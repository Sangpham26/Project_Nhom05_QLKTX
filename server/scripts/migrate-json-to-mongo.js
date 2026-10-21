require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');
const repo = require('../src/repositories/mongoRepository');
const { collectionNames, stored } = require('../src/repositories/mongoRepository');
const { validateSnapshot } = require('../src/repositories/snapshotValidation');

const apply = process.argv.includes('--apply');
const checkSource = process.argv.includes('--check-source');
const sourcePath = path.resolve(__dirname, '..', process.env.DATA_FILE || './data/database.json');
const uploadDir = path.resolve(__dirname, '../uploads/room-types');

async function main() {
  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex');
  const snapshot = JSON.parse(sourceBytes.toString('utf8'));
  const report = validateSnapshot(snapshot, uploadDir);
  console.log(JSON.stringify({ source: sourcePath, sha256: sourceHash, counts: report.counts, images: report.imageCount, errors: report.errors }, null, 2));
  if (report.errors.length) throw new Error('Source validation failed. No MongoDB data was changed.');
  if (checkSource) return;

  await repo.ready();
  const marker = await repo.db.collection('_repository').findOne({ _id: 'json-migration-v1' });
  if (marker) {
    if (marker.sha256 !== sourceHash) throw new Error('This database was migrated from a different JSON file. No changes made.');
    console.log('Migration already recorded for this exact JSON file. No changes made.');
    return;
  }
  const targetCounts = Object.fromEntries(await Promise.all(collectionNames.map(async name =>
    [name, await repo.db.collection(name).countDocuments({})]
  )));
  console.log('Target record counts:', JSON.stringify(targetCounts));
  if (Object.values(targetCounts).some(Boolean)) throw new Error('Target contains application records. Choose an empty MongoDB database; no changes made.');
  if (!apply) {
    console.log('Dry run passed. To import, rerun with --apply after backing up JSON and uploads.');
    return;
  }
  const currentHash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  if (currentHash !== sourceHash) throw new Error('JSON file changed during validation. Rerun migration.');
  const session = repo.client.startSession();
  try {
    await session.withTransaction(async () => {
      await repo.db.collection('_repository').updateOne({ _id: 'revision' }, { $inc: { value: 1 } }, { session });
      if (await repo.db.collection('_repository').findOne({ _id: 'json-migration-v1' }, { session }))
        throw new Error('Migration was recorded concurrently. No changes made.');
      for (const name of collectionNames) {
        if (await repo.db.collection(name).countDocuments({}, { session }))
          throw new Error(`Collection ${name} changed during migration. No changes made.`);
      }
      for (const name of collectionNames) {
        const items = snapshot[name];
        if (items.length) await repo.db.collection(name).insertMany(items.map(stored), { session });
      }
      await repo.db.collection('_repository').insertOne({
        _id: 'json-migration-v1', sha256: sourceHash, counts: report.counts,
        images: report.imageCount, completedAt: new Date(),
      }, { session });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
  } finally { await session.endSession(); }

  const imported = await repo.read();
  for (const name of collectionNames) {
    const actual = new Map(imported[name].map(item => [item.id, item]));
    if (actual.size !== snapshot[name].length ||
        snapshot[name].some(item => !isDeepStrictEqual(actual.get(item.id), item)))
      throw new Error(`Post-migration mismatch in ${name}. Keep JSON fallback and investigate; do not rerun against a different source.`);
  }
  console.log('Migration committed and every document matched the JSON source. Original JSON and images were not modified.');
}

main().catch(error => {
  console.error('Migration stopped:', error.message);
  process.exitCode = 1;
}).finally(() => repo.close());
