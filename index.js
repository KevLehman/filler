const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://localhost:3001/';
const client = new MongoClient(process.env.MONGO_URI || uri);

if (process.argv.length < 2) {
	console.error('Missing target collection');
	process.exit(1);
}

async function fill() {
	const col = process.argv[2];
	const db = client.db(process.env.DB || 'meteor');

	const availableFillers = fs.readdirSync(`${__dirname}/fillers`).map(file => path.basename(file, '.js'));
	if (!availableFillers.includes(col.toLowerCase())) {
		console.error(`Filler ${col} not found`);
		process.exit(1);
	}

	const filler = require(`./fillers/${col}`);
	return filler(db);
}

fill()
	.then(() => {
		console.log('done');
		process.exit(0);
	})
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
