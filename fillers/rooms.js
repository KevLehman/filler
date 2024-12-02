const {faker} = require('@faker-js/faker');

function generateRoom() {
	const roomType = process.env.ROOM_TYPE || 'c';

	let room;

	if (roomType === 'l') {
		room = generateLivechatRoom();

		return room;
	}

	const roomName = faker.word.noun() + '_' + faker.number.int(9999);

	room = {
		_id: faker.git.commitSha({length: 25}),
		fname: roomName,
		_updatedAt: {
			$date: new Date(),
		},
		customFields: {},
		topic: '',
		broadcast: false,
		encrypted: false,
		name: roomName,
		t: roomType,
		msgs: 0,
		usersCount: 1,
		u: {
			_id: 'rocketchat.internal.admin.test',
			username: 'rocketchat.internal.admin.test',
			name: 'RocketChat Internal Admin Test',
		},
		ts: {
			$date: new Date(),
		},
		ro: false,
		default: false,
		sysMes: true,
	};

	return room;
}

function generateLivechatRoom() {
	const priorityWeight = faker.helpers.arrayElement([99, 1, 2, 3, 4, 5]);

	const room = {
		_id: faker.git.commitSha({length: 25}),
		fname: faker.person.fullName(),
		cl: false,
		ts: {
			$date: new Date(),
		},
		waitingResponse: true,
		msgs: 0,
		priorityWeight,
		source: {
			type: 'widget',
		},
		open: true,
		usersCount: 2,
		t: 'l',
		estimatedWaitingTimeQueue: 9999999,
		queuedAt: {
			$date: new Date(),
		},
		_updatedAt: {
			$date: new Date(),
		},
		servedBy: {
			_id: 'rocketchat.internal.admin.test',
			username: 'rocketchat.internal.admin.test',
			ts: {
				$date: new Date(),
			},
		},
		metrics: {
			v: {
				lq: {
					$date: new Date(),
				},
			},
		},
	};

	return room;
}

module.exports = async db => {
	const collection = db.collection('rocketchat_room');

	const bulkOperations = [];
	const batch = 1000;
	const totalElements = parseInt(process.env.ROOMS, 10) || 100000;

	for (let i = 0; i < totalElements; i++) {
		const room = generateRoom();
		bulkOperations.push({
			insertOne: {
				document: room,
			},
		});

		if (bulkOperations.length >= batch) {
			// eslint-disable-next-line no-await-in-loop
			const r = await collection.bulkWrite(bulkOperations);
			console.dir({
				action: 'room',
				batch: r.insertedCount,
				total: totalElements,
				remaining: totalElements - i,
				ok: r.isOk(),
				errors: r.hasWriteErrors(),
				errorList: r.getWriteErrors(),
			});
			bulkOperations.length = 0;
		}
	}
};
