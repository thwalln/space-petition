const express = require("express");
const app = express();
const PORT = 8080;
const {
    selectAllUserDataFromSignaturesTable,
    selectTotalNumOfSignersFromSignaturesTable,
    insertUserDataIntoSignaturesTable,
    insertUserDataIntoUsersTable,
    selectAllUserDataFromUsersTable,
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
            res.redirect("/login");
        })
        .catch((err) => {
            console.log("Error in registration", err);
            res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
        });
});

app.get("/login", (req, res) => {
    res.render("login", {});
});

app.post("/login", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    selectAllUserDataFromUsersTable(data.email)
        .then((userData) => {
            bc.compare(data.password, userData.rows[0].password).then(
                (match) => {
                    if (match) {
                        cookie.userId = userData.rows[0].id;
                        console.log("first LOG:", userData);
                        selectAllUserDataFromSignaturesTable(cookie.userId)
                            .then((userData) => {
                                console.log("Second LOG:", userData);
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
        .catch((err) => console.log(err));
});

app.get("/petition", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    const data = req.body;
    const cookie = req.session;
    insertUserDataIntoSignaturesTable(cookie.userId, data.signature)
        .then((newUser) => {
            cookie.signatureId = newUser.rows[0].id;
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
        selectAllUserDataFromSignaturesTable()
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

app.get("*", (req, res) => {
    res.redirect("/registration");
});

app.listen(PORT, () => {
    console.log(`Petition server listening on port ${PORT}`);
});
