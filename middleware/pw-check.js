const { hash, compare } = require("../bc");
const { updateUserData, getUserData } = require("../db");

const hashPw = (req, res) => {
    const data = req.body;
    const cookie = req.session;
    hash(data.password)
        .then((hashedPw) => {
            return updateUserData(data.first, data.last, data.email, hashedPw);
        })
        .then((userData) => {
            cookie.userId = userData.rows[0].id;
            return res.redirect("/profile");
        })
        .catch((err) => {
            console.log("Error in registration", err);
            return res.send(
                "Error in registration - <a href='/registration'>please try again</a> ERRRRR PAGE NOCH MACHEN!!!"
            );
        });
};

const comparePw = (req, res) => {
    const data = req.body;
    const cookie = req.session;
    getUserData(data.email)
        .then((userData) => {
            compare(data.password, userData.rows[0].password).then((match) => {
                if (match) {
                    cookie.userId = userData.rows[0].id;
                    // userData.rowCount === 1 &&
                    // userData.rows[0].user_id === cookie.userId
                    //     ? res.redirect("/thanks")
                    //     : res.redirect("/petition");
                    if (
                        userData.rowCount === 1 &&
                        userData.rows[0].user_id === cookie.userId
                    ) {
                        cookie.sigId = true;
                        //DAS NOCH ANPASSEN UND DANN AUF TERNARY UMSTEIGEN
                        res.redirect("/thanks");
                    } else {
                        res.redirect("/petition");
                    }
                } else {
                    res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
                }
            });
        })
        .catch((err) => {
            console.log(err);
            res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
        });
};

module.exports = {
    hashPw,
    comparePw,
};
