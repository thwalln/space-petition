const { getAllSigners, getAllSignersFromCity } = require("../db");

const getAllPetitionSigners = (req, res) => {
    getAllSigners()
        .then((userData) => {
            const signers = userData.rows.map((row) => {
                return { ...row, showLink: row.url !== "" };
            });
            res.render("signers", {
                signers,
                displayCity: true,
                logout: true,
                profile: true,
                thanks: true,
                identifier: "signers",
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("error");
        });
};

const getAllPetitionSignersByCity = (req, res) => {
    const { city } = req.params;
    getAllSignersFromCity(city)
        .then((userData) => {
            const signers = userData.rows;
            res.render("signers", {
                signers,
                city,
                logout: true,
                thanks: true,
                profile: true,
                identifier: "signers",
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("error");
        });
};

module.exports = { getAllPetitionSigners, getAllPetitionSignersByCity };
