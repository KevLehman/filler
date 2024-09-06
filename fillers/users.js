const {faker} = require('@faker-js/faker');
const {writeBatch, processMissingElements} = require('../helpers/write');

function generateUser() {
	return {
		_id: faker.git.commitSha({length: 25}),
		createdAt: new Date(),
		services: {
			password: {
				bcrypt: '$2b$10$frdLpgwe3YppH2I9rdtoY.tJ/thMt8DJa1eKR1aTDKXb9IVX1pJGS',
			},
			email2fa: {
				enabled: true,
				changedAt: new Date(),
			},
		},
		username: `${faker.internet.userName()}-${faker.git.commitSha({length: 15})}`,
		emails: [
			{
				address: `${faker.internet.userName()}-${faker.git.commitSha({length: 15})}@hotmail.com`,
				verified: false,
			},
		],
		type: 'user',
		status: 'offline',
		active: true,
		_updatedAt: new Date(),
		__rooms: [
			'GENERAL',
		],
		roles: [
			'user',
		],
		name: faker.person.fullName(),
		requirePasswordChange: false,
		settings: {},
		statusText: '',
	};
}

function generateSubscription(userId, username) {
	return {
		_id: faker.git.commitSha({length: 25}),
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
		ts: new Date(),
		rid: 'GENERAL',
		name: 'general',
		t: 'c',
		u: {
			_id: userId,
			username,
		},
		_updatedAt: new Date(),
	};
}

module.exports = async db => {
	const users = db.collection('users');
	const subs = db.collection('rocketchat_subscription');

	const bulkOperations = [];
	const subsBulkOperations = [];
	const batch = 10000;
	const totalElements = parseInt(process.env.USERS, 10) || 100000;

	for (let i = 0; i < totalElements; i++) {
		const user = generateUser();
		bulkOperations.push({
			insertOne: {
				document: user,
			},
		});

		subsBulkOperations.push({
			insertOne: {
				document: generateSubscription(user._id, user.username),
			},
		});

		if (bulkOperations.length >= batch) {
			// eslint-disable-next-line no-await-in-loop
			await writeBatch(users, totalElements, bulkOperations, i);
			bulkOperations.length = 0;
		}

		if (subsBulkOperations.length >= batch) {
			// eslint-disable-next-line no-await-in-loop
			await writeBatch(subs, totalElements, subsBulkOperations, i);
			subsBulkOperations.length = 0;
		}
	}

	await Promise.all([
		processMissingElements(users, bulkOperations.length, bulkOperations),
		processMissingElements(subs, subsBulkOperations.length, subsBulkOperations),
	]);
};

