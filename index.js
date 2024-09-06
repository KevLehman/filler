const fs = require('fs');
const path = require('path');
const {connect} = require('./helpers/db');

async function fill() {
	const col = process.argv[2];
	if (process.argv.length < 2) {
		console.error('Missing target collection');
		process.exit(1);
	}

	const db = connect(process.env.MONGO_URI, process.env.DB);

	const availableFillers = fs.readdirSync(`${__dirname}/fillers`).map(file => path.basename(file, '.js'));
	if (!availableFillers.includes(col.toLowerCase())) {
		console.error(`Filler ${col} not found`);
		process.exit(1);
	}

	const filler = require(`./fillers/${col}`);

	console.log(`Filling database using "${col}" script`);
	return filler(db);
}

fill()
	.then(() => {
		console.log(`Done filling ${process.argv[2]}`);
		process.exit(0);
	})
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
