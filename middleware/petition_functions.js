const { updateSignature } = require("../db");

const postSignature = (req, res) => {
    const data = req.body;
    const cookie = req.session;
    if (data.signature.length !== 1046) {
        updateSignature(cookie.userId, data.signature)
            .then(() => {
                cookie.sigId = true;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log(err);
                res.render("petition", {
                    error: true,
                    logout: true,
                    profile: true,
                });
            });
    } else {
        res.render("petition", {
            emptySignature: true,
            logout: true,
            profile: true,
        });
    }
};

const displayPetitionPage = (req, res) => {
    const { userId, sigId } = req.session;
    if (userId) {
        if (sigId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", { logout: true, profile: true });
        }
    } else {
        res.redirect("/registration");
    }
};

module.exports = {
    postSignature,
    displayPetitionPage,
};
