const { isDeepStrictEqual } = require('util');
const { MongoClient } = require('mongodb');
const { collectionNames, indexes, validatorFor } = require('./mongoSchema');

const transactionOptions = {
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority' },
  readPreference: 'primary',
};

function selectedCollections(names) {
  if (names === undefined) return collectionNames;
  if (!Array.isArray(names) || new Set(names).size !== names.length || names.some(name => !collectionNames.includes(name))) {
    throw new Error('Invalid repository collection scope.');
  }
  return names;
}

function stored(document) {
  if (!document || typeof document.id !== 'string' || !document.id) throw new Error('MongoDB record needs a string id.');
  const { _id, ...fields } = document;
  return { _id: document.id, ...fields };
}

function fromMongo(document, name) {
  if (typeof document.id !== 'string' || document._id !== document.id) {
    throw new Error(`Invalid ID in MongoDB collection ${name}.`);
  }
  const { _id, ...fields } = document;
  return fields;
}

class MongoRepository {
  constructor(uri = process.env.MONGODB_URI, databaseName = process.env.MONGODB_DB_NAME) {
    if (!uri || !databaseName) throw new Error('MONGODB_URI and MONGODB_DB_NAME are required when DB_PROVIDER=mongodb.');
    if (!/^[a-zA-Z0-9_-]{1,38}$/.test(databaseName)) throw new Error('MONGODB_DB_NAME is invalid.');
    this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    this.db = this.client.db(databaseName);
    this.readyPromise = null;
  }

  ready() {
    if (!this.readyPromise) this.readyPromise = this.initialize().catch(error => {
      this.readyPromise = null;
      throw error;
    });
    return this.readyPromise;
  }

  async initialize() {
    await this.client.connect();
    await this.db.command({ ping: 1 });
    const existing = new Set((await this.db.listCollections({}, { nameOnly: true }).toArray()).map(item => item.name));
    for (const name of collectionNames) {
      if (!existing.has(name)) {
        try {
          await this.db.createCollection(name, { validator: validatorFor(name), validationAction: 'error' });
        } catch (error) {
          if (error.codeName !== 'NamespaceExists') throw error;
        }
      }
      for (const [keys, options] of indexes[name] || []) await this.db.collection(name).createIndex(keys, options);
    }
    await this.db.collection('_repository').updateOne({ _id: 'revision' }, { $setOnInsert: { value: 0 } }, { upsert: true });
  }

  async load(names, session) {
    const data = {};
    for (const name of names) {
      const documents = await this.db.collection(name).find({}, { session }).toArray();
      data[name] = documents.map(document => fromMongo(document, name));
    }
    return data;
  }

  async read(names) {
    await this.ready();
    const selected = selectedCollections(names);
    const session = this.client.startSession();
    try {
      return await session.withTransaction(() => this.load(selected, session), transactionOptions);
    } finally {
      await session.endSession();
    }
  }

  async writeDifferences(before, after, names, session) {
    for (const name of names) {
      const prior = new Map(before[name].map(item => [item.id, item]));
      const next = new Map();
      for (const item of after[name]) {
        if (next.has(item.id)) throw new Error(`Duplicate id in ${name}: ${item.id}`);
        next.set(item.id, item);
      }
      const collection = this.db.collection(name);
      for (const [id, item] of next) {
        const old = prior.get(id);
        if (!old) await collection.insertOne(stored(item), { session });
        else if (!isDeepStrictEqual(old, item)) await collection.replaceOne({ _id: id }, stored(item), { session });
      }
      for (const id of prior.keys()) {
        if (!next.has(id)) await collection.deleteOne({ _id: id }, { session });
      }
    }
  }

  async transaction(names, fn) {
    if (typeof names === 'function') { fn = names; names = undefined; }
    const selected = selectedCollections(names);
    if (typeof fn !== 'function') throw new Error('Transaction callback is required.');
    await this.ready();
    const session = this.client.startSession();
    try {
      return await session.withTransaction(async () => {
        // Every writer touches this document first. A conflicting transaction retries
        // against a fresh snapshot, so cross-document rules (such as room capacity)
        // cannot both pass based on the same old state.
        const lock = await this.db.collection('_repository').updateOne(
          { _id: 'revision' }, { $inc: { value: 1 } }, { session },
        );
        if (lock.matchedCount !== 1) throw new Error('MongoDB revision document is missing.');
        const before = await this.load(selected, session);
        const after = structuredClone(before);
        const result = await fn(after);
        await this.writeDifferences(before, after, selected, session);
        return result;
      }, transactionOptions);
    } finally {
      await session.endSession();
    }
  }

  async seedIfEmpty(snapshot) {
    await this.ready();
    const session = this.client.startSession();
    try {
      return await session.withTransaction(async () => {
        await this.db.collection('_repository').updateOne({ _id: 'revision' }, { $inc: { value: 1 } }, { session });
        for (const name of collectionNames) {
          if (await this.db.collection(name).countDocuments({}, { session })) {
            throw new Error('MongoDB already has application data. Seed will not overwrite it.');
          }
        }
        for (const name of collectionNames) {
          const items = snapshot[name] || [];
          if (items.length) await this.db.collection(name).insertMany(items.map(stored), { session });
        }
        return Object.fromEntries(collectionNames.map(name => [name, (snapshot[name] || []).length]));
      }, transactionOptions);
    } finally {
      await session.endSession();
    }
  }

  async close() { await this.client.close(); this.readyPromise = null; }
}

module.exports = new MongoRepository();
module.exports.MongoRepository = MongoRepository;
module.exports.collectionNames = collectionNames;
module.exports.stored = stored;
