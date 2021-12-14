const express = require("express");
const app = express();
const PORT = 8080;
const {
    selectAllUserDataFromSignaturesTable,
    selectTotalNumOfSignersFromSignaturesTable,
    insertUserDataIntoSignaturesTable,
    insertUserDataIntoUsersTable,
    selectAllUserDataFromUsersTable,
    insertProfileInfoIntoUserProfileTable,
    getListOfSigners,
    getListOfSignersFromCertainCity,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const secrets = require("./secrets.json");
const bc = require("./bc");

///////////////////////////////////////////// EXPRESS HANDLEBARS  ////////////////////////////////////

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

///////////////////////////////////////////// MIDDLEWARE /////////////////////////////////////////////

app.use(express.static("./public"))
    .use(express.urlencoded({ extended: false }))
    .use(
        cookieSession({
            secret: secrets.COOKIE_SECRET,
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
            return insertUserDataIntoUsersTable(
                data.first,
                data.last,
                data.email,
                hashedPw
            );
        })
        .then((userData) => {
            cookie.userId = userData.rows[0].id;
            res.redirect("/profile");
        })
        .catch((err) => {
            console.log("Error in registration", err);
            res.send(
                "Error in registration - HIER MUSS NOCH EINE ERROR PAGE REIN"
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
            insertProfileInfoIntoUserProfileTable(age, city, url, userId)
                .then(() => res.redirect("/petition"))
                .catch((err) => {
                    console.log(err);
                    res.render("profile", {
                        // error message needed
                    });
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
    insertUserDataIntoSignaturesTable(cookie.userId, data.signature)
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
        selectTotalNumOfSignersFromSignaturesTable()
            .then((userCount) => {
                const count = userCount.rows[0].count;
                return count;
            })
            .then((count) => {
                selectAllUserDataFromSignaturesTable(cookie.userId).then(
                    (userData) => {
                        const userSignature = userData.rows[0].signature;
                        res.render("thanks", {
                            count,
                            userSignature,
                        });
                    }
                );
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/registration");
    }
});

app.get("/signers", (req, res) => {
    const cookie = req.session;
    if (cookie.sigId) {
        getListOfSigners()
            .then((userData) => {
                const signers = userData.rows;
                res.render("signers", {
                    signers,
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
        getListOfSignersFromCertainCity(city).then((userData) => {
            console.log(userData);
            const signers = userData.rows;
            res.render("signers", {
                signers,
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
    // POST /login - If you are doing a final query to find the logged-in user's signature id, you can stop doing that and get it with the query to get their user id and password
    const data = req.body;
    const cookie = req.session;
    selectAllUserDataFromUsersTable(data.email)
        .then((userData) => {
            bc.compare(data.password, userData.rows[0].password).then(
                (match) => {
                    console.log("Match: ", match);
                    if (match) {
                        cookie.userId = userData.rows[0].id;
                        selectAllUserDataFromSignaturesTable(cookie.userId)
                            .then((userData) => {
                                if (
                                    userData.rowCount === 1 &&
                                    userData.rows[0].user_id === cookie.userId
                                ) {
                                    cookie.sigId = true;
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            })
                            .catch((err) => console.log(err));
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

app.get("*", (req, res) => {
    res.redirect("/registration");
});

app.listen(PORT, () => {
    console.log(`Petition server listening on port ${PORT}`);
});
