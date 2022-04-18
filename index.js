// Place your server entry point code here
//Require Express.js
const express = require('express')
const app = express()

// Serve static HTML files
app.use(express.static('./public'));

// Make Express use its own built-in body parser to handle JSON
app.use(express.json());

// Import the coinFlip function from your coin.mjs file

const args = require('minimist')(process.argv.slice(2))
console.log(args)
// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
args['port']
const HTTP_PORT  = args.port || process.env.PORT || 3000

const server = app.listen(HTTP_PORT, () => {
	console.log('App listening on port %PORT%'.replace('%PORT%', HTTP_PORT))
});

const Database = require('./src/database.js');
//const Database = require('better-sqlite3');
const db = new Database('user.db');


app.use( (req, res, next) => {
    // Require better-sqlite.
    // const Database = require('better-sqlite3');

    // Connect to a database or create one if it doesn't exist yet.
    // const db = new Database('user.db');
    // Is the database initialized or do we need to initialize it?
    const stmt = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' and name='remoteuser';`
    );
    // Define row using `get()` from better-sqlite3
    let row = stmt.get();
    // Check if there is a table. If row is undefined then no table exists.
    if (row === undefined) {
        // Echo information about what you are doing to the console.
       console.log('Your database appears to be empty. I will initialize it now.');
        // Set a const that will contain your SQL commands to initialize the database.
       const sqlInit = `
       CREATE TABLE accesslog (id INTEGER PRIMARY KEY, remoteaddr TEXT, remoteuser TEXT, time DATE, method TEXT, url TEXT, protocol TEXT, httpversion TEXT, status TEXT, referer TEXT, useragent TEXT);
    `;
        // Execute SQL commands that we just wrote above.
       db.exec(sqlInit);
        // Echo information about what we just did to the console.
       console.log('Your database has been initialized with a new table and two entries containing a username and password.');
    } 
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

    const sqlInit = 'INSERT INTO accesslog(remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?,?,?,?,?,?,?,?,?,?)';
    const statement = db.prepare(sqlInit);
    statement.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent);


    // Execute SQL commands that we just wrote above.
    console.log('SQL' + sqlInit);
    //db.exec(sqlInit);
    console.log('Inserted one record.')
    // Export all of the above as a module so that we can use it elsewhere.
    module.exports = db
    next();
});

app.get('/', (req, res) => {
  throw new Error('Error test successful.') // Express will catch this on its own.
})

app.get('/app/', (req, res) => {
	// Respond with status 200
	console.log('fxn');
	res.statusCode = 200;
	// Respond with status message "OK"
	res.statusMessage = 'OK';
	res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
	res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.get('/app/flip/', (req, res) => {
	const flipSide = coinFlip();
	console.log(flipSide);
	res.statusCode = 200;
	res.statusMessage = '{"flip":"' + flipSide + '"}';
	res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
	res.end(res.statusMessage);
});

app.get('/app/error/', (req, res) => {
	res.status(404).send('Error test successful.');
});

app.get('/app/log/access', (req, res) => {
	const stmt = db.prepare('SELECT * FROM accesslog').all();
	res.status(200).json(stmt);
});

app.get('/app/flips/:number', (req, res) => {
	var allFlips = coinFlips(req.params.number);
	var count = countFlips(allFlips);
	var dict = {
		"raw" : allFlips,
		"summary" : count
	};
	console.log(allFlips);
	res.statusCode = 200;
	res.statusMessage = JSON.stringify(dict); 
	res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
	res.end(res.statusMessage);
});

app.get('/app/flip/call/:userCall', (req, res) => {
        var guess = flipACoin(req.params.userCall);
        console.log(guess);
        res.statusCode = 200;
        res.statusMessage = JSON.stringify(guess);
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusMessage);
})

app.use(function(req,res){
	res.status(404).send('404 NOT FOUND')
});
/** Coin flip functions 
 * This module will emulate a coin flip given various conditions as parameters as defined below
 */

/** Simple coin flip
 * 
 * Write a function that accepts no parameters but returns either heads or tails at random.
 * 
 * @param {*}
 * @returns {string} 
 * 
 * example: coinFlip()
 * returns: heads
 * 
 */

function coinFlip() {
	let c = Math.random();
	if (c <= 0.5)
	   return "heads";
	else
       return "tails";
}

/** Multiple coin flips
 * 
 * Write a function that accepts one parameter (number of flips) and returns an array of 
 * resulting "heads" or "tails".
 * 
 * @param {number} flips 
 * @returns {string[]} results
 * 
 * example: coinFlips(10)
 * returns:
 *  [
      'heads', 'heads',
      'heads', 'tails',
      'heads', 'tails',
      'tails', 'heads',
      'tails', 'heads'
    ]
 */

function coinFlips(flips) {
	const sides = [];
	for (let i = 0; i < flips; i++){
		sides.push(coinFlip());
	}
	return sides;
}

/** Count multiple flips
 * 
 * Write a function that accepts an array consisting of "heads" or "tails" 
 * (e.g. the results of your `coinFlips()` function) and counts each, returning 
 * an object containing the number of each.
 * 
 * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
 * { tails: 5, heads: 5 }
 * 
 * @param {string[]} array 
 * @returns {{ heads: number, tails: number }}
 */

function countFlips(array) {
	let h = 0;
	let t = 0;
	array.forEach((x)=> {
		if (x.valueOf() == "heads")
			h += 1;
		else if (x.valueOf() == "tails")
			t += 1;
	});
	var flipcount = {};
	flipcount["heads"] = h;
	flipcount["tails"] = t;
	return flipcount;
}

/** Flip a coin!
 * 
 * Write a function that accepts one input parameter: a string either "heads" or "tails", flips a coin, and then records "win" or "lose". 
 * 
 * @param {string} call 
 * @returns {object} with keys that are the input param (heads or tails), a flip (heads or tails), and the result (win or lose). See below example.
 * 
 * example: flipACoin('tails')
 * returns: { call: 'tails', flip: 'heads', result: 'lose' }
 */

function flipACoin(call) {
	let side = coinFlip();
	var result = {};
	result["call"] = call;
	result["flip"] = side;
	if (side.valueOf() == call)
		result["result"] = "win";
	else
		result["result"] = "lose";

	return result;
}
