require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true // Allow executing multiple SQL statements
});

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

console.log('Connecting to MariaDB...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected.');

    console.log('Running schema.sql...');
    connection.query(schemaSql, (err, results) => {
        if (err) {
            console.error('Error executing schema:', err);
        } else {
            console.log('Database schema created successfully!');
        }
        connection.end();
    });
});
