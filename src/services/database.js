// Put your database code here
// dependencies
const db = require('better-sqlite3') 
const fs = require('fs');

const datadir = './data/';

if (!fs.existsSync(datadir)){
    fs.mkdirSync(datadir);
}
//create log database
const logdb = new db(datadir+'log.db') 

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if (row === undefined) {
    console.log('Log database appears to be empty. Creating log database...')
// create table
    const log  = `
        CREATE TABLE accesslog (
            id INTEGER PRIMARY KEY,
            remoteaddr TEXT,
            remoteuser TEXT,
            time TEXT,
            method TEXT,
            url TEXT,
            protocol TEXT,
            httpversion TEXT,
            status TEXT,
            referrer TEXT,
            useragent TEXT
        );
    `

    logdb.exec(log)
} else {
    console.log('Your log database exists.')
}

module.exports = logdb

