const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const repo = require("../repositories");

const uploadDir = path.resolve(__dirname, "../../uploads/rooms");
const maxBytes = 5 * 1024 * 1024;
const formats = {
  "image/png": {
    ext: "png",
    valid: (b) =>
      b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
  },
  "image/jpeg": {
    ext: "jpg",
    valid: (b) =>
      b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/webp": {
    ext: "webp",
    valid: (b) =>
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
};

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function roomIn(db, roomId) {
  return (
    db.rooms.find((x) => x.id === roomId) ||
    fail("Phòng không tồn tại.", 404)
  );
}

function imagesOf(room) {
  return [...(room.images || [])].sort((a, b) => a.order - b.order);
}

function normalize(room) {
  room.images = imagesOf(room).map((image, order) => ({ ...image, order }));
  const cover = room.images.find((x) => x.isCover) || room.images[0];
  room.images.forEach((x) => {
    x.isCover = x.id === cover?.id;
  });
  return room.images;
}

function descriptionOf(value) {
  const description = String(value || "").trim();
  if (description.length > 120) fail("Mô tả ảnh tối đa 120 ký tự.");
  return description;
}

async function list(roomId) {
  const db = await repo.read(["rooms"]);
  return imagesOf(roomIn(db, roomId));
}

async function upload(roomId, buffer, contentType, description) {
  const mime = String(contentType || "")
    .split(";")[0]
    .toLowerCase();
  const format = formats[mime];
  if (!format) fail("Chỉ nhận ảnh PNG, JPG hoặc WebP.");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0)
    fail("File ảnh trống hoặc không đọc được.");
  if (buffer.length > maxBytes)
    fail("Mỗi ảnh phải nhỏ hơn hoặc bằng 5 MB.", 413);
  if (!format.valid(buffer))
    fail("Nội dung file không đúng định dạng ảnh đã chọn.");

  const imageId = crypto.randomUUID();
  const filename = `${imageId}.${format.ext}`;
  fs.mkdirSync(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, buffer, { flag: "wx" });

  try {
    return await repo.transaction(["rooms"], (db) => {
      const room = roomIn(db, roomId);
      if ((room.images || []).length >= 20)
        fail("Mỗi phòng tối đa 20 ảnh.");
      const image = {
        id: imageId,
        url: `/api/uploads/rooms/${filename}`,
        order: (room.images || []).length,
        description: descriptionOf(description),
        isCover: !(room.images || []).length,
      };
      room.images = [...(room.images || []), image];
      return image;
    });
  } catch (error) {
    await fs.promises.unlink(filepath).catch(() => {});
    throw error;
  }
}

async function update(roomId, imageId, body) {
  return repo.transaction(["rooms"], (db) => {
    const room = roomIn(db, roomId);
    const image =
      (room.images || []).find((x) => x.id === imageId) ||
      fail("Ảnh không tồn tại.", 404);
    if (body.description !== undefined)
      image.description = descriptionOf(body.description);
    if (body.isCover === true)
      (room.images || []).forEach((x) => {
        x.isCover = x.id === imageId;
      });
    normalize(room);
    return image;
  });
}

async function reorder(roomId, imageIds) {
  return repo.transaction(["rooms"], (db) => {
    const room = roomIn(db, roomId);
    const current = room.images || [];
    if (
      !Array.isArray(imageIds) ||
      imageIds.length !== current.length ||
      new Set(imageIds).size !== current.length ||
      imageIds.some((key) => !current.some((x) => x.id === key))
    )
      fail("Danh sách thứ tự ảnh không hợp lệ.");
    room.images = imageIds.map((key, order) => ({
      ...current.find((x) => x.id === key),
      order,
    }));
    return normalize(room);
  });
}

async function remove(roomId, imageId) {
  const result = await repo.transaction(["rooms"], (db) => {
    const room = roomIn(db, roomId);
    const image =
      (room.images || []).find((x) => x.id === imageId) ||
      fail("Ảnh không tồn tại.", 404);
    room.images = (room.images || []).filter((x) => x.id !== imageId);
    return { image, images: normalize(room) };
  });
  await fs.promises
    .unlink(path.join(uploadDir, path.basename(result.image.url)))
    .catch((error) => {
      if (error.code !== "ENOENT")
        console.error("Không thể xóa file ảnh:", error.message);
    });
  return result.images;
}

module.exports = { uploadDir, maxBytes, list, upload, update, reorder, remove };
