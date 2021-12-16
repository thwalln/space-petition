const checkIfUserIsLoggedIn = (req, res, next) =>
    req.session.userId ? res.redirect("/petition") : next();

const checkSigIdAvailable = (req, res, next) => {
    if (!req.session.sigId) {
        return res.redirect("/login");
    }
    next();
};

module.exports = { checkIfUserIsLoggedIn, checkSigIdAvailable };
