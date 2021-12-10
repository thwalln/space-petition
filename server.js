const express = require("express");
const app = express();
const PORT = 8080;
const db = require("./db");
const { engine } = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

///////////////////////////////////////////// EXPRESS HANDLEBARS  ////////////////////////////////////

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

///////////////////////////////////////////// MIDDLEWARE /////////////////////////////////////////////

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(cookieSession({}));

///////////////////////////////////////////// ROUTES /////////////////////////////////////////////

app.get("/petition", (req, res) => {
    const cookie = req.cookies;

    if (cookie.signed === "true") {
        res.redirect("/thanks");
    } else {
        res.render("petition.handlebars", {
            layout: "main",
        });
    }
});

app.post("/petition", (req, res) => {
    const data = req.body;

    db.insertUserData(data.first, data.last, data.signature)
        .then(() => {
            res.cookie("signed", "true");
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
    const cookie = req.cookies;

    if (cookie.signed === "true") {
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
    const cookie = req.cookies;

    if (cookie.signed === "true") {
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
