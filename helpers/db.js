const {MongoClient} = require('mongodb');

const defaultDbUri = 'mongodb://localhost:3001/';
const defaultDbName = 'meteor';

function connect(uri = defaultDbUri, dbName = defaultDbName) {
	return new MongoClient(uri).db(dbName);
}

module.exports = {
	connect,
};
