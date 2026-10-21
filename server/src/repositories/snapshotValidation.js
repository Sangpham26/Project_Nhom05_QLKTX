const fs = require('fs');
const path = require('path');
const { collectionNames, validatorFor } = require('./mongoSchema');

const relations = {
  students: { userId: 'users' }, staff: { userId: 'users' },
  rooms: { buildingId: 'buildings', roomTypeId: 'roomTypes' },
  applications: { studentId: 'students', roomTypeId: 'roomTypes', preferredRoomId: 'rooms', roomId: 'rooms', stayId: 'stays', handledBy: 'users' },
  stays: { studentId: 'students', roomId: 'rooms', applicationId: 'applications', previousStayId: 'stays' },
  requests: { studentId: 'students', stayId: 'stays', handledBy: 'users' },
  transfers: { studentId: 'students', fromRoomId: 'rooms', toRoomId: 'rooms', handledBy: 'users' },
  readings: { roomId: 'rooms', periodId: 'periods', enteredBy: 'users' },
  invoices: { studentId: 'students', roomId: 'rooms', periodId: 'periods', issuedBy: 'users' },
  payments: { invoiceId: 'invoices', recordedBy: 'users' },
  notifications: { userId: 'users' },
};

function validateSnapshot(snapshot, uploadDir) {
  const errors = [];
  const counts = {};
  const ids = {};
  for (const name of collectionNames) {
    const items = snapshot[name];
    if (!Array.isArray(items)) { errors.push(`${name} must be an array`); continue; }
    const schema = validatorFor(name).$jsonSchema;
    counts[name] = items.length;
    ids[name] = new Set();
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !item.id) { errors.push(`${name}: invalid id`); continue; }
      if (ids[name].has(item.id)) errors.push(`${name}: duplicate id ${item.id}`);
      ids[name].add(item.id);
      if (Object.hasOwn(item, '_id')) errors.push(`${name}/${item.id}: source must not contain _id`);
      for (const field of schema.required) {
        if (field !== '_id' && !Object.hasOwn(item, field)) errors.push(`${name}/${item.id}: missing ${field}`);
      }
      for (const [field, rule] of Object.entries(schema.properties)) {
        if (field === '_id' || !Object.hasOwn(item, field)) continue;
        const value = item[field];
        const actual = Array.isArray(value) ? 'array' : typeof value;
        const valid = rule.bsonType === 'number' ? actual === 'number' && Number.isFinite(value)
          : rule.bsonType === 'bool' ? actual === 'boolean'
            : rule.bsonType === 'object' ? actual === 'object' && value !== null && !Array.isArray(value)
              : actual === rule.bsonType;
        if (!valid) errors.push(`${name}/${item.id}: invalid type for ${field}`);
      }
    }
  }
  for (const [name, fields] of Object.entries(relations)) {
    for (const item of snapshot[name] || []) {
      for (const [field, target] of Object.entries(fields)) {
        if (item[field] != null && !ids[target]?.has(item[field]))
          errors.push(`${name}/${item.id}: ${field} points to missing ${target}/${item[field]}`);
      }
    }
  }
  const unique = (name, key) => {
    const seen = new Set();
    for (const item of snapshot[name] || []) {
      const value = key(item);
      if (value == null) continue;
      if (seen.has(value)) errors.push(`${name}: duplicate unique value ${value}`);
      seen.add(value);
    }
  };
  unique('users', x => x.email?.toLowerCase());
  unique('students', x => x.userId);
  unique('students', x => x.studentCode?.toLowerCase());
  unique('staff', x => x.userId);
  unique('staff', x => x.staffCode?.toLowerCase());
  for (const name of ['buildings', 'roomTypes', 'rooms']) unique(name, x => x.code?.toLowerCase());
  unique('periods', x => x.month);
  unique('readings', x => `${x.roomId}:${x.periodId}:${x.type}`);
  unique('invoices', x => `${x.studentId}:${x.periodId}`);
  unique('stays', x => x.status === 'ACTIVE' ? x.studentId : null);
  unique('notifications', x => typeof x.key === 'string' ? x.key : null);
  let imageCount = 0;
  const imageIds = new Set();
  for (const type of snapshot.roomTypes || []) {
    for (const image of type.images || []) {
      imageCount++;
      if (!image.id || imageIds.has(image.id)) errors.push(`roomTypes/${type.id}: duplicate or missing image id`);
      imageIds.add(image.id);
      const filename = path.basename(image.url || '');
      if (!image.url?.startsWith('/api/uploads/room-types/') || !/^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(filename)) {
        errors.push(`roomTypes/${type.id}: invalid image URL`);
      } else if (!fs.existsSync(path.join(uploadDir, filename))) {
        errors.push(`roomTypes/${type.id}: image file missing: ${filename}`);
      }
    }
  }
  return { counts, imageCount, errors };
}

module.exports = { validateSnapshot };
