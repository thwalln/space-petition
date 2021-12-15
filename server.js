const express = require("express");
const app = express();
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
    updateUsers,
    upsertUserProfiles,
    updateUsersAndPassword,
    deleteSignature,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
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
            secret:
                process.env.COOKIE_SECRET ||
                require("./secrets.json").COOKIE_SECRET,
            maxAge: 1000 * 60 * 60 * 24 * 14,
            sameSite: true,
        })
    )
    .use((req, res, next) => {
        res.setHeader("x-frame-options", "deny");
        next();
    });

///////////////////////////////////////////// ROUTES /////////////////////////////////////////////

///////////////////////////////////////////// REGISTRATION

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

///////////////////////////////////////////// PROFILE

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

app.post("/profile/edit", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    if (!data.password) {
        updateUsers(data.first, data.last, data.email, cookie.userId)
            .then(() => {
                upsertUserProfiles(
                    data.age,
                    data.city,
                    data.url,
                    cookie.userId
                ).then(() => res.redirect("/petition"));
            })
            .catch((err) => {
                console.log(err);
                res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
            });
    } else {
        bc.hash(data.password)
            .then((hashedPw) => {
                updateUsersAndPassword(
                    data.first,
                    data.last,
                    data.email,
                    hashedPw,
                    cookie.userId
                ).then(() => {
                    upsertUserProfiles(
                        data.age,
                        data.city,
                        data.url,
                        cookie.userId
                    ).then(() => res.redirect("/petition"));
                });
            })
            .catch((err) => {
                console.log(err);
                res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
            });
    }
});

///////////////////////////////////////////// PETITION

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

///////////////////////////////////////////// THANKS

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

app.post("/thanks/delete", (req, res) => {
    const cookie = req.session;
    deleteSignature(cookie.userId)
        .then(() => {
            cookie.sigId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
        });
});

///////////////////////////////////////////// SIGNERS

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

///////////////////////////////////////////// LOGIN

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
                            // cookie.sigId = true; DAS NOCH ANPASSEN
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

///////////////////////////////////////////// STAR ROUTE

app.get("*", (req, res) => {
    res.redirect("/login");
});

///////////////////////////////////////////// FIRE UP SERVER

app.listen(process.env.PORT || 8080, () => {
    console.log(`Petition server listening`);
});
