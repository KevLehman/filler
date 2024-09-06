function getIterationNumberFromBatchSize(batchSize, currentIteration) {
	if (typeof currentIteration !== 'number') {
		return 0;
	}

	return Math.abs((batchSize - (currentIteration + 1)) / batchSize) + 1;
}

async function writeBatch(collection, totalElements, docs, currentIterationParam) {
	const colName = collection.collectionName;
	const currentIteration = getIterationNumberFromBatchSize(docs.length, currentIterationParam);
	console.log(`Processing batch of size ${docs.length} - ${colName}. Iteration ${currentIteration}`);

	const r = await collection.bulkWrite(docs);

	console.dir({
		action: colName,
		batchSize: r.insertedCount,
		total: totalElements,
		ok: r.isOk(),
		errors: r.hasWriteErrors(),
		...(r.hasWriteErrors() && {writeErrors: r.getWriteErrors()}),
		...(currentIteration !== 0 && {remaining: totalElements - ((currentIteration) * docs.length)}),
	});
}

async function processMissingElements(collection, totalElements, docs) {
	if (docs.length > 0) {
		await writeBatch(collection, totalElements, docs);
	}
}

module.exports = {
	writeBatch,
	processMissingElements,
};
