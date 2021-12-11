const express = require("express");
const app = express();
const PORT = 8080;
const db = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const secrets = require("./secrets.json");

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

app.get("/petition", (req, res) => {
    if (req.session.petitionSigned) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    const data = req.body;

    db.insertUserData(data.first, data.last, data.signature)
        .then((data) => {
            req.session.signatureId = data.rows[0].id;
            req.session.petitionSigned = true;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("Error in posting new values to database", err);
            res.render("petition", { error: true });
        });
});

app.get("/thanks", (req, res) => {
    if (req.session.petitionSigned) {
        db.selectTotalNumOfSigners()
            .then((data) => {
                const count = data.rows[0].count;
                return count;
            })
            .then((count) => {
                db.selectAllUserData().then((data) => {
                    const userSignatureURL =
                        data.rows[req.session.signatureId - 1].signature;
                    res.render("thanks", {
                        count,
                        userSignatureURL,
                    });
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.petitionSigned) {
        db.selectAllUserData()
            .then((data) => {
                const signers = data.rows;
                // console.log(signers);
                res.render("signers", {
                    signers,
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("*", (req, res) => {
    res.redirect("/petition");
});

app.listen(PORT, () => {
    console.log(`Petition server listening on port ${PORT}`);
});
