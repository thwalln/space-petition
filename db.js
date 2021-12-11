// db.js will be where we have all our functions for
// talking to the database,
// retrieve data,
// add data or
// update data

const spicedPg = require("spiced-pg");
const database = "petition";
const username = "postgres";
const password = "postgres";

// Let's create our line of communication to the database
const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

console.log(`[db] connecting to:${database}`);

// SELECT to get all user data
module.exports.selectAllUserData = () => {
    const q = "SELECT * FROM signatures";
    return db.query(q);
};

// SELECT to get a total number of signers
module.exports.selectTotalNumOfSigners = () => {
    const q = "SELECT COUNT(*) FROM signatures";
    return db.query(q);
};

// INSERT the user's signature and name and return their ID
module.exports.insertUserData = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature)
                VALUES ($1, $2, $3) RETURNING id`;
    const params = [firstName, lastName, signature];
    return db.query(q, params);
};
