// Keep the application's existing string IDs as both id and MongoDB _id.
// Additional fields stay allowed so historical records and future optional fields survive migration.
const definitions = {
  users: { required: ['email', 'passwordHash', 'role', 'active'], types: { email: 'string', passwordHash: 'string', role: 'string', active: 'bool' } },
  students: { required: ['userId', 'studentCode', 'fullName'], types: { userId: 'string', studentCode: 'string', fullName: 'string' } },
  staff: { required: ['userId', 'staffCode', 'fullName'], types: { userId: 'string', staffCode: 'string', fullName: 'string' } },
  buildings: { required: ['code', 'name', 'status'], types: { code: 'string', name: 'string', status: 'string' } },
  roomTypes: { required: ['code', 'name', 'gender', 'defaultCapacity', 'fee', 'status'], types: { code: 'string', name: 'string', gender: 'string', defaultCapacity: 'number', fee: 'number', status: 'string', images: 'array' } },
  rooms: { required: ['code', 'buildingId', 'roomTypeId', 'designCapacity', 'operationalCapacity', 'status'], types: { code: 'string', buildingId: 'string', roomTypeId: 'string', designCapacity: 'number', operationalCapacity: 'number', status: 'string' } },
  applications: { required: ['studentId', 'roomTypeId', 'status'], types: { studentId: 'string', roomTypeId: 'string', preferredRoomId: 'string', durationMonths: 'number', status: 'string' } },
  stays: { required: ['studentId', 'roomId', 'status'], types: { studentId: 'string', roomId: 'string', durationMonths: 'number', status: 'string' } },
  requests: { required: ['studentId', 'stayId', 'type', 'status'], types: { studentId: 'string', stayId: 'string', type: 'string', status: 'string' } },
  transfers: { required: ['studentId', 'fromRoomId', 'toRoomId', 'date'], types: { studentId: 'string', fromRoomId: 'string', toRoomId: 'string', date: 'string' } },
  periods: { required: ['month', 'issueDate', 'dueDate'], types: { month: 'string', issueDate: 'string', dueDate: 'string' } },
  readings: { required: ['roomId', 'periodId', 'type', 'start', 'end'], types: { roomId: 'string', periodId: 'string', type: 'string', start: 'number', end: 'number' } },
  pricing: { required: ['effectiveFrom', 'electricity', 'water'], types: { effectiveFrom: 'string', electricity: 'number', water: 'number' } },
  invoices: { required: ['studentId', 'roomId', 'periodId', 'snapshot', 'total'], types: { studentId: 'string', roomId: 'string', periodId: 'string', snapshot: 'object', total: 'number' } },
  payments: { required: ['invoiceId', 'amount', 'date', 'method'], types: { invoiceId: 'string', amount: 'number', date: 'string', method: 'string' } },
  notifications: { required: ['userId', 'title', 'body', 'read'], types: { userId: 'string', title: 'string', body: 'string', read: 'bool' } },
};

const collectionNames = Object.freeze(Object.keys(definitions));
const stringCollation = { locale: 'en', strength: 2 };
const indexes = {
  users: [ [{ email: 1 }, { unique: true, name: 'email_unique', collation: stringCollation }] ],
  students: [ [{ userId: 1 }, { unique: true, name: 'student_user_unique' }], [{ studentCode: 1 }, { unique: true, name: 'student_code_unique', collation: stringCollation }] ],
  staff: [ [{ userId: 1 }, { unique: true, name: 'staff_user_unique' }], [{ staffCode: 1 }, { unique: true, name: 'staff_code_unique', collation: stringCollation }] ],
  buildings: [ [{ code: 1 }, { unique: true, name: 'building_code_unique', collation: stringCollation }] ],
  roomTypes: [ [{ code: 1 }, { unique: true, name: 'room_type_code_unique', collation: stringCollation }] ],
  rooms: [ [{ code: 1 }, { unique: true, name: 'room_code_unique', collation: stringCollation }], [{ buildingId: 1, roomTypeId: 1, status: 1 }, { name: 'room_catalog_lookup' }] ],
  applications: [ [{ studentId: 1, status: 1 }, { name: 'application_student_status' }], [{ createdAt: -1 }, { name: 'application_created' }] ],
  stays: [ [{ studentId: 1, status: 1 }, { name: 'stay_student_status' }], [{ roomId: 1, status: 1 }, { name: 'stay_room_status' }], [{ studentId: 1 }, { name: 'one_active_stay_per_student', unique: true, partialFilterExpression: { status: 'ACTIVE' } }] ],
  requests: [ [{ studentId: 1, status: 1 }, { name: 'request_student_status' }], [{ stayId: 1, status: 1 }, { name: 'request_stay_status' }] ],
  transfers: [ [{ studentId: 1, date: -1 }, { name: 'transfer_student_date' }] ],
  periods: [ [{ month: 1 }, { unique: true, name: 'period_month_unique' }] ],
  readings: [ [{ roomId: 1, periodId: 1, type: 1 }, { unique: true, name: 'reading_room_period_type_unique' }] ],
  pricing: [ [{ effectiveFrom: -1 }, { name: 'pricing_effective_date' }] ],
  invoices: [ [{ studentId: 1, periodId: 1 }, { unique: true, name: 'invoice_student_period_unique' }], [{ roomId: 1, periodId: 1 }, { name: 'invoice_room_period' }] ],
  payments: [ [{ invoiceId: 1, date: 1 }, { name: 'payment_invoice_date' }] ],
  notifications: [ [{ userId: 1, createdAt: -1 }, { name: 'notification_user_created' }], [{ key: 1 }, { unique: true, name: 'notification_key_unique', partialFilterExpression: { key: { $type: 'string' } } }] ],
};

function validatorFor(name) {
  const definition = definitions[name];
  if (!definition) throw new Error(`Unknown MongoDB collection: ${name}`);
  const properties = { _id: { bsonType: 'string' }, id: { bsonType: 'string' } };
  for (const [field, bsonType] of Object.entries(definition.types)) properties[field] = { bsonType };
  return { $jsonSchema: { bsonType: 'object', required: ['_id', 'id', ...definition.required], properties } };
}

module.exports = { collectionNames, indexes, validatorFor };
