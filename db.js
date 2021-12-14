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
                VALUES ($1, $2)`;
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
    const q = `SELECT * FROM users WHERE email=$1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.insertProfileInfoIntoUserProfileTable = (
    userAge,
    userCity,
    userURL,
    userID
) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) 
                VALUES ($1, $2, $3, $4)`;
    const params = [userAge, userCity, userURL, userID];
    return db.query(q, params);
};

module.exports.getListOfSigners = () => {
    const q = `SELECT signatures.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
                FROM signatures
                JOIN users
                ON signatures.user_id = users.id
                JOIN user_profiles
                ON signatures.user_id = user_profiles.user_id`;
    return db.query(q);
};

module.exports.getListOfSignersFromCertainCity = (city) => {
    const q = `SELECT signatures.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
                FROM signatures
                JOIN users
                ON signatures.user_id = users.id
                JOIN user_profiles
                ON signatures.user_id = user_profiles.user_id
                WHERE LOWER(user_profiles.city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
};

// NEW QUERIES

// A new query that is exactly like the one to get the signers but has in addition a WHERE clause that limits to a certain city. You can make the query case insensitive by using the SQL LOWER function (e.g., WHERE LOWER(city) = LOWER($1)).

// Change the query to get user information by email address so that it joins the signatures table and gets the signature id for the user if the user has signed
