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
    process.env.DATABASE_URL ||
        `postgres:${username}:${password}@localhost:5432/${database}`
);

console.log(`[db] connecting to:${database}`);

module.exports.getSignatureData = (userId) => {
    const q = "SELECT * FROM signatures WHERE user_id=$1";
    const params = [userId];
    return db.query(q, params);
};

module.exports.getSignatureCount = () => {
    const q = "SELECT COUNT(*) FROM signatures";
    return db.query(q);
};

module.exports.updateSignature = (userID, signature) => {
    const q = `INSERT INTO signatures (user_id, signature)
                VALUES ($1, $2)`;
    const params = [userID, signature];
    return db.query(q, params);
};

// INSERT the user's data in users table
module.exports.updateUserData = (
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

module.exports.getUserData = (email) => {
    const q = `SELECT users.id, users.email, users.password, signatures.user_id 
                FROM users
                LEFT JOIN signatures
                ON users.id = signatures.user_id
                WHERE email=$1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.updateUserProfile = (userAge, userCity, userURL, userID) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) 
                VALUES ($1, $2, $3, $4)`;
    const params = [userAge, userCity, userURL, userID];
    return db.query(q, params);
};

module.exports.getAllSigners = () => {
    const q = `SELECT signatures.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
                FROM signatures
                JOIN users
                ON signatures.user_id = users.id
                JOIN user_profiles
                ON signatures.user_id = user_profiles.user_id`;
    return db.query(q);
};

module.exports.getAllSignersFromCity = (city) => {
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

module.exports.getUserProfileData = (userId) => {
    const q = `SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url, user_profiles.user_id
                FROM users
                LEFT JOIN user_profiles
                ON users.id = user_profiles.user_id
                WHERE users.id = $1`;
    const params = [userId];
    return db.query(q, params);
};

// UPDATE users table: first, last, email
module.exports.updateUsers = (firstName, lastName, email, userId) => {
    const q = `UPDATE users
                SET first = $1,
                    last = $2,
                    email = $3
                WHERE id = $4`;
    const params = [firstName, lastName, email, userId];
    return db.query(q, params);
};

module.exports.updateUsersAndPassword = (
    firstName,
    lastName,
    email,
    password,
    userId
) => {
    const q = `UPDATE users
                SET first = $1,
                    last = $2,
                    email = $3,
                    password = $4
                WHERE id = $5`;
    const params = [firstName, lastName, email, password, userId];
    return db.query(q, params);
};

module.exports.upsertUserProfiles = (userAge, userCity, userURL, userID) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id)
                DO UPDATE SET age = $1, city = $2, url = $3, user_id = $4`;
    const params = [userAge, userCity, userURL, userID];
    return db.query(q, params);
};

module.exports.deleteSignature = (userID) => {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    const params = [userID];
    return db.query(q, params);
};
