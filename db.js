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
module.exports.selectAllUserDataFromSignaturesTable = (userId) => {
    const q = "SELECT * FROM signatures WHERE user_id=$1";
    const params = [userId];
    return db.query(q, params);
};

// SELECT to get a total number of signers
module.exports.selectTotalNumOfSignersFromSignaturesTable = () => {
    const q = "SELECT COUNT(*) FROM signatures";
    return db.query(q);
};

// INSERT the user's signature and name and return their ID
module.exports.insertUserDataIntoSignaturesTable = (userID, signature) => {
    const q = `INSERT INTO signatures (user_id, signature)
                VALUES ($1, $2) RETURNING id`;
    const params = [userID, signature];
    return db.query(q, params);
};

// INSERT the user's data in users table
module.exports.insertUserDataIntoUsersTable = (
    firstName,
    lastName,
    emailAddress,
    password
) => {
    const q = `INSERT INTO users (first, last, email, password) 
                VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [firstName, lastName, emailAddress, password];
    return db.query(q, params);
};

module.exports.selectAllUserDataFromUsersTable = (email) => {
    console.log(email);
    const q = `SELECT * FROM users WHERE email=$1`;
    const params = [email];
    return db.query(q, params);
};
