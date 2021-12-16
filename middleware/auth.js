// Hier kommen alle globalen auth Middleware Functions rein

const checkIfUserIsLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect("/petition");
    }
    next();
};

module.exports = { checkIfUserIsLoggedIn };
