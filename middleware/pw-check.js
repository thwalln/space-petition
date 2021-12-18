const { hash, compare } = require("../bc");
const { updateUserData, getUserData, getSignatureData } = require("../db");

const hashPw = (req, res) => {
    const data = req.body;
    const cookie = req.session;
    if (
        data.first.legnth === 0 ||
        data.last.legnth === 0 ||
        data.email.legnth === 0 ||
        data.password.length === 0
    ) {
        res.render("error", { registration: true });
    } else {
        hash(data.password)
            .then((hashedPw) => {
                return updateUserData(
                    data.first,
                    data.last,
                    data.email,
                    hashedPw
                );
            })
            .then((userData) => {
                cookie.userId = userData.rows[0].id;
                return res.redirect("/profile");
            })
            .catch((err) => {
                console.log("Error in registration", err);
                return res.render("error", { registration: true });
            });
    }
};

const comparePw = (req, res) => {
    const data = req.body;
    const cookie = req.session;
    getUserData(data.email)
        .then((userData) => {
            compare(data.password, userData.rows[0].password).then((match) => {
                if (match) {
                    cookie.userId = userData.rows[0].id;
                    getSignatureData(cookie.userId)
                        .then((data) => {
                            console.log(data);
                            if (
                                userData.rowCount === 1 &&
                                userData.rows[0].user_id === cookie.userId &&
                                data.rows[0].signature.length >= 1048
                            ) {
                                cookie.sigId = true;
                                res.redirect("/thanks");
                            } else {
                                res.redirect("/petition");
                            }
                        })
                        .catch((err) => console.log(err));
                } else {
                    return res.render("error", { loggedin: true });
                }
            });
        })
        .catch((err) => {
            console.log(err);
            return res.render("error", { loggedin: true });
        });
};

module.exports = {
    hashPw,
    comparePw,
};
