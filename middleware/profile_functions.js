const {
    updateUserProfile,
    getUserProfileData,
    updateUsers,
    upsertUserProfiles,
    updateUsersAndPassword,
} = require("../db");
const { hash } = require("../bc");

const postProfileInformation = (req, res) => {
    let { age, city, url } = req.body;
    const { userId } = req.session;
    if (age.length !== 0 || city.length !== 0 || url.length !== 0) {
        if (
            url.startsWith("http:") ||
            url.startsWith("https:") ||
            url.startsWith("//") ||
            url === ""
        ) {
            updateUserProfile(age, city, url, userId)
                .then(() => res.redirect("/petition"))
                .catch((err) => {
                    console.log(err);
                    res.redirect("/petition");
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/petition");
    }
};

const getUserProfile = (req, res) => {
    const cookie = req.session;
    if (cookie.userId) {
        getUserProfileData(cookie.userId)
            .then((userData) => {
                const userInfo = userData.rows[0];
                res.render("edit-profile", { userInfo });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/login");
    }
};

const updateUserProfiles = (req, res) => {
    let { first, last, email, age, city, url, password } = req.body;
    const { userId } = req.session;
    if (!password) {
        updateUsers(first, last, email, userId)
            .then(() => {
                if (age === "") {
                    age = null;
                }
                if (city === "") {
                    city = null;
                }
                if (url === "") {
                    url = null;
                }
                upsertUserProfiles(age, city, url, userId).then(() =>
                    res.redirect("/petition")
                );
            })
            .catch((err) => {
                console.log(err);
                res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
            });
    } else {
        hash(password)
            .then((hashedPw) => {
                updateUsersAndPassword(
                    first,
                    last,
                    email,
                    hashedPw,
                    userId
                ).then(() => {
                    if (age === "") {
                        age = null;
                    }
                    if (city === "") {
                        city = null;
                    }
                    if (url === "") {
                        url = null;
                    }
                    upsertUserProfiles(age, city, url, userId).then(() =>
                        res.redirect("/petition")
                    );
                });
            })
            .catch((err) => {
                console.log(err);
                res.send("HIER MUSS NOCH EINE ERROR PAGE REIN");
            });
    }
};

module.exports = {
    postProfileInformation,
    getUserProfile,
    updateUserProfiles,
};
