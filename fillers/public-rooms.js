const {faker} = require('@faker-js/faker');
const {writeBatch, processMissingElements} = require('../helpers/write');

async function getUsers(db, size) {
	const list = await db.collection('users').aggregate([
		{$sample: {size}},
		{$project: {username: 1}},
	]).toArray();

	return list;
}

function getRandomUser(list) {
	return list[Math.floor(list.length * Math.random())];
}

function generateRoom(list) {
	const user = getRandomUser(list);

	const name = `${faker.word.adjective()}.${faker.word.adjective()}-${faker.git.commitSha({length: 15})}`;
	return {
		_id: faker.git.commitSha({length: 25}),
		_updatedAt: new Date(),
		customFields: {},
		name,
		fname: name,
		t: 'c',
		msgs: 0,
		usersCount: list.length,
		u: user,
		ts: new Date(),
		ro: false,
		default: false,
		sysMes: true,
	};
}

function generateSubscription({t, rid, name, userId, username}) {
	return {
		_id: faker.git.commitSha({length: 25}),
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
		ts: new Date(),
		rid,
		name,
		t,
		u: {
			_id: userId,
			username,
		},
		_updatedAt: new Date(),
	};
}

module.exports = async db => {
	const bulkOperations = [];
	const subsBulkOperations = [];
	const usersBulkOperations = [];

	const roomsBatch = 10000;
	const subsBatch = 10000;
	const usersBatch = 2000;

	const totalRooms = parseInt(process.env.ROOMS, 10) || 100000;
	const usersPerRoom = parseInt(process.env.USERS_PER_ROOM, 10) || 10;
	const totalSubs = totalRooms * usersPerRoom;

	const usersList = await getUsers(db, usersPerRoom);

	for (let i = 0; i < totalRooms; i++) {
		const room = generateRoom(usersList);
		bulkOperations.push({
			insertOne: {
				document: room,
			},
		});

		if (bulkOperations.length >= roomsBatch) {
			// eslint-disable-next-line no-await-in-loop
			await writeBatch(db.collection('rocketchat_room'), totalRooms, bulkOperations, i);
			bulkOperations.length = 0;
		}

		usersBulkOperations.push({
			updateMany: {
				filter: {_id: {$in: usersList.map(({_id}) => _id)}},
				update: {$push: {__rooms: room._id}},
			},
		});

		if (usersBulkOperations.length >= usersBatch) {
			// eslint-disable-next-line no-await-in-loop
			await writeBatch(db.collection('users'), totalRooms, usersBulkOperations, i);
			usersBulkOperations.length = 0;
		}

		for (const member of usersList) {
			const sub = generateSubscription({
				t: room.t,
				rid: room._id,
				name: room.name,
				userId: member._id,
				username: member.username,
			});
			subsBulkOperations.push({
				insertOne: {
					document: sub,
				},
			});

			if (subsBulkOperations.length >= subsBatch) {
				// eslint-disable-next-line no-await-in-loop
				await writeBatch(db.collection('rocketchat_subscription'), totalSubs, subsBulkOperations, i);
				subsBulkOperations.length = 0;
			}
		}
	}

	await processMissingElements(db.collection('rocketchat_room'), totalRooms, bulkOperations);
	await processMissingElements(db.collection('rocketchat_subscription'), totalSubs, subsBulkOperations);
	await processMissingElements(db.collection('users'), totalRooms, usersBulkOperations);
};
