const express = require("express");
const app = express();
const PORT = 8080;
const db = require("./db");
const { engine } = require("express-handlebars");
const cookieParser = require("cookie-parser");

///////////////////////////////////////////// EXPRESS HANDLEBARS  ////////////////////////////////////

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

///////////////////////////////////////////// MIDDLEWARE /////////////////////////////////////////////

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

///////////////////////////////////////////// ROUTES /////////////////////////////////////////////

app.get("/petition", (req, res) => {
    const cookie = req.cookies;
    console.log(cookie);

    if (cookie.signed === "true") {
        res.redirect("/thanks");
    } else {
        res.render("petition.handlebars", {
            layout: "main",
        });
    }
});

app.post("/petition", (req, res) => {
    // runs when the user submits their signature, i.e. clicks submit
    // attempts toINSERT all data to submit into a designated table into your database, you will get this data from req.body
    console.log(req.body);
    db.insertUserData()
        .then(({ rows }) => console.log(rows))
        .catch((err) => {
            console.log(err);
            res.render("petition.handlebars", {
                layout: "main",
                error: true,
            });
        });
    // IF the db insert fails (i.e. your promise from the db query gets rejected), rerender petition.handlebars and pass an indication that there should be an error message shown to the template
    // IF there is no error
    // set cookie to remember that the user has signed (do this last → this logic will change in the future)
    // redirect to thank you page
    // db.addOscar("Janelle Monáe", 36, 0)
    //     .then(() => console.log("oscar added"))
    //     .catch((err) => console.log("no oscar added"));
    res.cookie("signed", "true");
    res.redirect("/thanks");
});

app.get("/thanks", (req, res) => {
    const cookie = req.cookies;
    // Still do to
    // SELECT the number of peopler that have signed the petition from the db → I recommend looking into what COUNT can do for you here ;)
    if (cookie.signed === "true") {
        res.render("thanks.handlebars", {
            layout: "main",
        });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    // redirect users to /petition if there is no cookie (this means they haven't signed yet & should not see this page!)
    // SELECT first and last values of every person that has signed from the database and pass them to signers.handlebars
    const cookie = req.cookies;

    if (cookie.signed === "true") {
        res.render("signers.handlebars", {
            layout: "main",
        });
    } else {
        res.redirect("/petition");
    }
});

app.get("*", (req, res) => {
    res.redirect("/petition");
    // alternativly, show 404 (error.handlebars) page
});

app.listen(PORT, () => {
    console.log("Petition server listening");
});
