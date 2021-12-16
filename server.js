const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const {
    checkIfUserIsLoggedIn,
    checkSigIdAvailable,
} = require("./middleware/auth");
const { hashPw, comparePw } = require("./middleware/pw-check");
const {
    postSignature,
    displayPetitionPage,
} = require("./middleware/petition_functions");
const {
    getAllPetitionSigners,
    getAllPetitionSignersByCity,
} = require("./middleware/signers_functions");
const {
    getSigCountAndData,
    deleteSig,
} = require("./middleware/thanks_functions");
const {
    postProfileInformation,
    getUserProfile,
    updateUserProfiles,
} = require("./middleware/profile_functions");

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

app.get("/registration", checkIfUserIsLoggedIn, (req, res) =>
    res.render("registration", {})
);

app.post("/registration", hashPw);

app.get("/login", checkIfUserIsLoggedIn, (req, res) => res.render("login", {}));

app.post("/login", comparePw);

app.get("/profile", (req, res) => res.render("profile", {}));

app.post("/profile", postProfileInformation);

app.get("/profile/edit", getUserProfile);

app.post("/profile/edit", updateUserProfiles);

app.get("/petition", displayPetitionPage);

app.post("/petition", postSignature);

app.get("/thanks", checkSigIdAvailable, getSigCountAndData);

app.post("/thanks/delete", deleteSig);

app.get("/signers", checkSigIdAvailable, getAllPetitionSigners);

app.get("/signers/:city", checkSigIdAvailable, getAllPetitionSignersByCity);

app.get("/logout", (req, res) => {
    req.session.sigId = null;
    req.session.userId = null;
    res.redirect("/login");
});

app.get("*", checkIfUserIsLoggedIn, (req, res) =>
    res.redirect("/registration")
);

///////////////////////////////////////////// FIRE UP SERVER

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => {
        console.log(`Petition server listening`);
    });
}

// FOR SUPERTEST
module.exports.app = app;
