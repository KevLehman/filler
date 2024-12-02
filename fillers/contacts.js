const {faker} = require('@faker-js/faker');
const {writeBatch, processMissingElements} = require('../helpers/write');

function generateContactChannel() {
	const sourceType = faker.helpers.arrayElement(['widget', 'email', 'sms', 'app', 'api']);
	const sourceId = faker.git.commitSha({length: 25});
	const verified = faker.datatype.boolean();
	return {
		name: faker.helpers.arrayElement(['widget', 'email', 'sms', 'app', 'api']),
		verified,
		visitor: {
			visitorId: faker.git.commitSha({length: 25}),
			source: {type: sourceType, ...(sourceType === 'app' && {id: sourceId})},
		},
		blocked: faker.datatype.boolean(),
		details: {
			type: sourceType,
			...(sourceType === 'app' && {id: sourceId}),
			label: faker.word.noun(),
			alias: faker.word.noun(),
		},
		...(verified && {verifiedAt: faker.date.recent()}),
		...(faker.datatype.boolean() && {
			lastChat: {
				_id: faker.git.commitSha({length: 25}),
				ts: faker.date.recent(),
			},
		}),
	};
}

function generatePhone() {
	return {phoneNumber: faker.phone.number()};
}

function generateEmail() {
	return {address: faker.internet.email()};
}

function generateConflictingFields() {
	return {field: faker.helpers.arrayElement(['name', 'manager', `customFields.${faker.word.noun()}`]), value: faker.word.noun()};
}

function generateContact() {
	return {
		_id: faker.git.commitSha({length: 25}),
		_updatedAt: new Date(),
		name: faker.person.fullName(),
		phones: Array(faker.number.int(parseInt(process.env.MAX_PHONES, 10))).fill(undefined).map(() => generatePhone()),
		emails: Array(faker.number.int(parseInt(process.env.MAX_EMAILS, 10))).fill(undefined).map(() => generateEmail()),
		contactManager: faker.git.commitSha({length: 25}),
		unknown: faker.datatype.boolean(),
		conflictingFields: faker.datatype.boolean() ? Array(faker.number.int(parseInt(process.env.MAX_CONFLICTING_FIELDS, 10))).fill(undefined).map(() => generateConflictingFields()) : [],
		customFields: Object.fromEntries(Array(faker.number.int(parseInt(process.env.MAX_CUSTOM_FIELDS, 10))).fill(undefined).map(() => [faker.word.noun(), faker.word.noun()])),
		channels: Array(faker.number.int(parseInt(process.env.MAX_CHANNELS, 10))).fill(undefined).map(() => generateContactChannel()),
		createdAt: faker.date.recent(),
		...(faker.datatype.boolean() && {
			lastChat: {
				_id: faker.git.commitSha({length: 25}),
				ts: faker.date.recent(),
			},
		}),
		preRegistration: true,
	};
}

function validateEnv() {
	if ((!process.env.MAX_PHONES || !process.env.MAX_EMAILS || !process.env.MAX_CONFLICTING_FIELDS || !process.env.MAX_CHANNELS || !process.env.MAX_CUSTOM_FIELDS)) {
		throw new Error('Missing env variables');
	}
}

module.exports = async db => {
	validateEnv();
	const collection = db.collection('rocketchat_livechat_contact');

	const bulkOperations = [];
	const batch = 1000;
	const totalElements = parseInt(process.env.CONTACTS, 10) || 10000;

	for (let i = 0; i < totalElements; i++) {
		bulkOperations.push({
			insertOne: {
				document: generateContact(),
			},
		});

		if (bulkOperations.length >= batch) {
			// eslint-disable-next-line no-await-in-loop
			await writeBatch(collection, totalElements, bulkOperations, i);
			bulkOperations.length = 0;
		}
	}

	await processMissingElements(collection, totalElements, bulkOperations);
};

