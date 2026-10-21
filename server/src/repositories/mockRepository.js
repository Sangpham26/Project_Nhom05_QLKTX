const fs = require("fs");
const path = require("path");

// JSON fallback and migration rollback provider. The MongoDB provider shares
// this collection-scoped read/transaction contract.
class MockRepository {
  constructor(file = process.env.DATA_FILE || "./data/database.json") {
    this.file = path.resolve(__dirname, "../..", file);
    this.queue = Promise.resolve();
  }
  readFile() {
    if (!fs.existsSync(this.file))
      throw new Error("Chưa có dữ liệu. Chạy npm run seed.");
    return JSON.parse(fs.readFileSync(this.file, "utf8"));
  }
  select(state, collections) {
    if (!collections) return state;
    if (!Array.isArray(collections) || collections.some(name => !Array.isArray(state[name])))
      throw new Error('Invalid repository collection scope.');
    return Object.fromEntries(collections.map(name => [name, state[name]]));
  }
  async read(collections) {
    await this.queue;
    return this.select(this.readFile(), collections);
  }
  transaction(collections, fn) {
    if (typeof collections === 'function') { fn = collections; collections = undefined; }
    const run = async () => {
      const state = this.readFile();
      const result = await fn(this.select(state, collections));
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const temp = `${this.file}.${process.pid}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(state, null, 2), "utf8");
      fs.renameSync(temp, this.file);
      return result;
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => {});
    return result;
  }
  replace(state) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(temp, this.file);
  }
}
module.exports = new MockRepository();
