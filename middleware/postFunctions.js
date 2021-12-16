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
                console.log("err inserting new user in db", err);
                res.render("petition", { error: true });
            });
    } else {
        res.send(
            "ERROR leere Unterschrift ---> Hier einfach nochmal die Petition Page mit einem entsprechenden ERROR posten"
        );
    }
};

module.exports = {
    postSignature,
};
