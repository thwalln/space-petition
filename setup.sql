DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != ''),
    last VARCHAR NOT NULL CHECK (last != ''),
    signature VARCHAR NOT NULL CHECK (signature != '')
);

INSERT INTO signatures (first, last, signature) VALUES ('Thomas', 'Wallner', 'Signature TW');
INSERT INTO signatures (first, last, signature) VALUES ('Niklas', 'Klein', 'Signature NK');
INSERT INTO signatures (first, last, signature) VALUES ('Demian', 'Kapser', 'Signature DK');

SELECT * FROM signatures;