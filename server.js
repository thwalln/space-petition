const express = require("express");
const app = express();
const PORT = 8080;
const {
    getSignatureData,
    getSignatureCount,
    updateSignature,
    updateUserData,
    getUserData,
    updateUserProfile,
    getAllSigners,
    getAllSignersFromCity,
    getUserProfileData,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const secrets = require("./secrets.json");
const bc = require("./bc");

///////////////////////////////////////////// EXPRESS HANDLEBARS  ////////////////////////////////////

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

///////////////////////////////////////////// MIDDLEWARE /////////////////////////////////////////////

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

app.use(express.static("./public"))
    .use(express.urlencoded({ extended: false }))
    .use(
        cookieSession({
            secret: process.env.COOKIE_SECRET || secrets.COOKIE_SECRET,
            maxAge: 1000 * 60 * 60 * 24 * 14,
            sameSite: true,
        })
    )
    .use((req, res, next) => {
        res.setHeader("x-frame-options", "deny");
        next();
    });

///////////////////////////////////////////// ROUTES /////////////////////////////////////////////

app.get("/registration", (req, res) => {
    res.render("registration", {});
});

app.post("/registration", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    bc.hash(data.password)
        .then((hashedPw) => {
            return updateUserData(data.first, data.last, data.email, hashedPw);
        })
        .then((userData) => {
            cookie.userId = userData.rows[0].id;
            res.redirect("/profile");
        })
        .catch((err) => {
            console.log("Error in registration", err);
            res.send(
                "Error in registration - <a href='/registration'>please try again</a>"
            );
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", {});
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    const { userId } = req.session;
    if (age.length !== 0 || city.length !== 0 || url.length !== 0) {
        if (
            url.startsWith("http:") ||
            url.startsWith("https:") ||
            url.startsWith("//") ||
            url === ""
        ) {
            updateUserProfile(age, city, url, userId)
                .then(() => res.redirect("/petition"))
                .catch((err) => {
                    console.log(err);
                    res.redirect("/petition");
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/petition");
    }
});

app.get("/petition", (req, res) => {
    const cookie = req.session;
    if (cookie.userId) {
        if (cookie.sigId) {
            res.redirect("/thanks");
        } else {
            res.render("petition");
        }
    } else {
        res.redirect("/registration");
    }
});

app.post("/petition", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    updateSignature(cookie.userId, data.signature)
        .then(() => {
            cookie.sigId = true;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err inserting new user in db", err);
            res.render("petition", { error: true });
        });
});

app.get("/thanks", (req, res) => {
    const cookie = req.session;
    if (cookie.sigId) {
        getSignatureCount()
            .then((userCount) => {
                const count = userCount.rows[0].count;
                return count;
            })
            .then((count) => {
                getSignatureData(cookie.userId).then((userData) => {
                    const userSignature = userData.rows[0].signature;
                    res.render("thanks", {
                        count,
                        userSignature,
                    });
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/registration");
    }
});

app.get("/signers", (req, res) => {
    const cookie = req.session;
    if (cookie.sigId) {
        getAllSigners()
            .then((userData) => {
                const signers = userData.rows.map((row) => {
                    return { ...row, showLink: row.url !== "" };
                });
                res.render("signers", {
                    signers,
                    displayCity: true,
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/registration");
    }
});

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    const cookie = req.session;
    if (cookie.sigId) {
        getAllSignersFromCity(city).then((userData) => {
            const signers = userData.rows;
            res.render("signers", {
                signers,
                city,
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render("login", {});
});

app.post("/login", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    getUserData(data.email)
        .then((userData) => {
            bc.compare(data.password, userData.rows[0].password).then(
                (match) => {
                    if (match) {
                        cookie.userId = userData.rows[0].id;
                        if (
                            userData.rowCount === 1 &&
                            userData.rows[0].user_id === cookie.userId
                        ) {
                            cookie.sigId = true;
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    } else {
                        res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
                    }
                }
            );
        })
        .catch((err) => {
            console.log(err);
            res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
        });
});

app.get("/profile/edit", (req, res) => {
    const cookie = req.session;
    if (cookie.userId) {
        getUserProfileData(cookie.userId)
            .then((userData) => {
                const userInfo = userData.rows[0];
                res.render("edit-profile", { userInfo });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/login");
    }
});

// We are going to update all the fields, even if the user hasn't changed them
//////// The password however, WON'T be pre-populated

// Second block:
// If password WAS updated you need to first of all HASH it, just like in the registration route
// UPDATE to the users table: first, last, email, password
// Then, as above, you are going to need to make an UPSERT to the user_profile table
// If everything goes to plan, redirect exactly as above
// If there is an error, render the page again with an error message
app.post("/profile/edit", (req, res) => {
    if (!req.body.password) {
        // user has left their password as it is
        // we should leave the value in the DB as it is
        // hier zwei Upsert Queries machen
        // First Block (user has NOT updated their password)
        //////// We need to update TWO tables
        //////// UPDATE users table: first, last, email
        //////// UPDATE user_profiles table: age, city, url (if row in table exists)
        //////// We need 2 separate queries for this as there is no UPDATE JOIN
        // ALSO: we need to consider that the user might have skipped the profile page without filling it in.
        // In this case, they won't have a row to update in this table and this will cause an error
        // SOLUTION: We need to first of all check if they have a row
        // If they don't, create one
        // If they do, update it
        // This is called an UPSERT and it looks like this
        // The potential conflict column here will be the user_id, you need to make sure it has a UNIQUE constraint on it
        // If this is successful: redirect the user to an appropriate page
        // If there is an error: re-render the page with an appropriate error message
        // Refer to login and registration for an example
    } else {
        req.body.password; // hashen
        // user has updated their password
        // Insgesamt zwei Queries, eine die drei values updated und eine die vier updated (inkl. Passwort)
        // we should update the db with new value
        // hier müssen wir das PW wieder prüfen und hashen
        // redirect user back to thank you page
    }
});

app.get("*", (req, res) => {
    res.redirect("/registration");
});

app.listen(process.env.PORT || PORT, () => {
    console.log(`Petition server listening on port ${PORT}`);
});

/////////////////// New part

// Part 3 - DELETE signature
// On the thanks page, there should a link for the user to delete their signature

// Something to note here is that we are doing something destructive to our database, so, by convention this shouldn't be a GET request.
// Instead, we are going to use a POST request
// BUT, this isn't possible with an ANCHOR tag
// A good solution, would be a button inside a form tag
// method="POST"
// On the server, it will receive a request and delete the signature from the signatures table
// This can be done with a DELETE query
// After deleting the row from the table
// Set signed/sigId cookie from the cookie object value to be null
// Redirect the user back to the petition

// /// dann noch irgendwo ein Feature einbauen, wo die Unterschrift gelöscht werden soll
// // für die Deletion sollen wir einen Post Request machen (Wird eine einfache DELETE FROM signatures WHERE userID = XY)
// // Form Tag machen und als Action die URL reinschreiben auf die wir directen wollen;
