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

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(
    cookieSession({
        secret: secrets.COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

///////////////////////////////////////////// ROUTES /////////////////////////////////////////////

app.get("/petition", (req, res) => {
    if (req.session.signed === "true") {
        res.redirect("/thanks");
    } else {
        res.render("petition.handlebars", {
            layout: "main",
        });
    }
});

app.post("/petition", (req, res) => {
    const data = req.body;
    console.log(req.body);

    db.insertUserData(data.first, data.last, data.signature)
        .then(() => {
            req.session.signed = "true";
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log(
                "Error in posting new values to database in POST / petition",
                err
            );
            res.render("petition.handlebars", {
                layout: "main",
                error: true,
            });
        });
});

app.get("/thanks", (req, res) => {
    if (req.session.signed === "true") {
        db.selectTotalNumOfSigners()
            .then((data) => {
                const count = data.rows[0].count;
                res.render("thanks.handlebars", {
                    layout: "main",
                    count,
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.signed === "true") {
        db.selectFirstAndLast()
            .then((data) => {
                const signers = data.rows;
                console.log(signers);
                res.render("signers.handlebars", {
                    layout: "main",
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
    console.log("Petition server listening");
});