// Both providers expose read(collectionNames?) and transaction(collectionNames?, fn).
// MongoDB stores each entity as its own document in a dedicated collection.
const provider = (process.env.DB_PROVIDER || 'json').toLowerCase();
if (!['json', 'mongodb'].includes(provider)) throw new Error('DB_PROVIDER must be json or mongodb.');
module.exports = provider === 'mongodb' ? require('./mongoRepository') : require('./mockRepository');
