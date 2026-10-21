require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const repo = require('../src/repositories/mongoRepository');
const { collectionNames } = require('../src/repositories/mongoSchema');
const { validateSnapshot } = require('../src/repositories/snapshotValidation');

async function main() {
  const data = await repo.read();
  const report = validateSnapshot(data, path.resolve(__dirname, '../uploads/room-types'));
  const marker = await repo.db.collection('_repository').findOne({ _id: 'json-migration-v1' });
  if (report.errors.length) throw new Error(report.errors.join('\n'));
  const indexes = {};
  for (const name of collectionNames) indexes[name] = (await repo.db.collection(name).listIndexes().toArray()).length;
  console.log(JSON.stringify({ database: process.env.MONGODB_DB_NAME, counts: report.counts, images: report.imageCount, indexCounts: indexes, migrationRecorded: Boolean(marker) }, null, 2));
  if (!marker) throw new Error('MongoDB has no JSON migration marker.');
  const sourcePath = path.resolve(__dirname, '..', process.env.DATA_FILE || './data/database.json');
  if (fs.existsSync(sourcePath)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
    if (hash !== marker.sha256) throw new Error('Local JSON file differs from the migration source. Check rollback source before deploying.');
    console.log('Migration source SHA-256 matches the preserved JSON file.');
  }
}

main().catch(error => { console.error('Verification failed:', error.message); process.exitCode = 1; })
  .finally(() => repo.close());
