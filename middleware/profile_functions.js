const {
    updateUserProfile,
    getUserProfileData,
    updateUsers,
    upsertUserProfiles,
    updateUsersAndPassword,
    onlyGetUserProfileData,
} = require("../db");
const { hash } = require("../bc");

const getUserPage = (req, res) => {
    onlyGetUserProfileData(req.session.userId).then((data) => {
        if (data.rows.length === 0) {
            res.render("profile", { identifier: "profile" });
        } else {
            res.redirect("/profile/edit");
        }
    });
};

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
                res.render("edit-profile", {
                    userInfo,
                    logout: true,
                    profile: true,
                    identifier: "edit-profile",
                });
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
                if (
                    url === null ||
                    url.startsWith("http:") ||
                    url.startsWith("https:") ||
                    url.startsWith("//") ||
                    url === ""
                ) {
                    upsertUserProfiles(age, city, url, userId).then(() =>
                        res.redirect("/petition")
                    );
                } else {
                    res.send("ERROR");
                }
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
                    if (
                        url === null ||
                        url.startsWith("http:") ||
                        url.startsWith("https:") ||
                        url.startsWith("//") ||
                        url === ""
                    ) {
                        upsertUserProfiles(age, city, url, userId).then(() =>
                            res.redirect("/petition")
                        );
                    } else {
                        res.send("ERROR");
                    }
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
    getUserPage,
};
