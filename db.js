// db.js will be where we have all our functions for
// talking to the database,
// retrieve data,
// add data or
// update data

const spicedPg = require("spiced-pg");
const database = "petition"; // this is the database name, not the tables
const username = "postgres";
const password = "postgres";

// let's create our line of communication to the database

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

console.log(`[db] connecting to:${database}`);

module.exports.getOscars = () => {
    const q = "SELECT * FROM oscars";
    return db.query(q);
};

module.exports.addOscar = (actorName, actorAge, numOscars) => {
    const q = `INSERT INTO oscars (name, age, number_of_oscars)
                VALUES ($1, $2, $3)`;
    const params = [actorName, actorAge, numOscars];
    return db.query(q, params);
};
