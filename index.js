const { MongoClient } = require('mongodb');
const { faker } = require('@faker-js/faker');

const uri = 'mongodb://localhost:3001/';
//
const client = new MongoClient(uri);

if (!process.env.USER_ID || !process.env.ROOM_ID || !process.env.USER_NAME) {
	console.error("Missing env variables");
	process.exit(1);
}

function generateMessage() {
	const ts = faker.date.between({
		from: new Date(process.env.REF_DATE),
		to: new Date(),
	});
	return {
		_id: faker.git.commitSha({ length: 25 }),
		rid: process.env.ROOM_ID,
		ts,
		msg: faker.lorem.sentence(),
		u: {
			_id: process.env.USER_ID,
			username: process.env.USER_NAME,
			name: faker.person.firstName(),
		},
		_updatedAt: ts,
		groupable: faker.datatype.boolean(),
		insertedFromScript: true,
	}
}

async function fill() {
	const db = client.db('meteor');
	const collection = db.collection('rocketchat_message');

	const bulkOperations = [];
	const batch = 1000;
	const totalElements = parseInt(process.env.MESSAGES) || 10000;

	for (let i = 0; i < totalElements; i++) {
		bulkOperations.push({
			insertOne: {
				document: generateMessage(),
			},
		});
		if (bulkOperations.length >= batch) {
			const r = await collection.bulkWrite(bulkOperations);
			console.dir({
				batch: r.insertedCount,
				total: totalElements,
				remaining: totalElements - i,
				ok: r.isOk(),
				errors: r.hasWriteErrors(),
				errorList: r.getWriteErrors(),
			})
			bulkOperations.length = 0;
		}
	}
}

fill()
	.then(() => {
		console.log("done");
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
	});
