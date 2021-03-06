const {
    getSignatureCount,
    getSignatureData,
    deleteSignature,
} = require("../db");

const getSigCountAndData = (req, res) => {
    const cookie = req.session;
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
                    profile: true,
                    logout: true,
                    identifier: "thanks",
                });
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("error");
        });
};

const deleteSig = (req, res) => {
    const cookie = req.session;
    deleteSignature(cookie.userId)
        .then(() => {
            cookie.sigId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.render("error");
        });
};

module.exports = {
    getSigCountAndData,
    deleteSig,
};
