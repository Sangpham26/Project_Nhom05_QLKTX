const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const repo = require("../repositories");

const uploadDir = path.resolve(__dirname, "../../uploads/room-types");
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
function typeIn(db, typeId) {
  return (
    db.roomTypes.find((x) => x.id === typeId) ||
    fail("Loại phòng không tồn tại.", 404)
  );
}
function imagesOf(type) {
  return [...(type.images || [])].sort((a, b) => a.order - b.order);
}
function normalize(type) {
  type.images = imagesOf(type).map((image, order) => ({ ...image, order }));
  const cover = type.images.find((x) => x.isCover) || type.images[0];
  type.images.forEach((x) => {
    x.isCover = x.id === cover?.id;
  });
  return type.images;
}
function descriptionOf(value) {
  const description = String(value || "").trim();
  if (description.length > 120) fail("Mô tả ảnh tối đa 120 ký tự.");
  return description;
}
async function list(typeId) {
  const db = await repo.read(["roomTypes"]);
  return imagesOf(typeIn(db, typeId));
}
async function upload(typeId, buffer, contentType, description) {
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
    return await repo.transaction(["roomTypes"], (db) => {
      const type = typeIn(db, typeId);
      if ((type.images || []).length >= 20)
        fail("Mỗi loại phòng tối đa 20 ảnh.");
      const image = {
        id: imageId,
        url: `/api/uploads/room-types/${filename}`,
        order: (type.images || []).length,
        description: descriptionOf(description),
        isCover: !(type.images || []).length,
      };
      type.images = [...(type.images || []), image];
      return image;
    });
  } catch (error) {
    await fs.promises.unlink(filepath).catch(() => {});
    throw error;
  }
}
async function update(typeId, imageId, body) {
  return repo.transaction(["roomTypes"], (db) => {
    const type = typeIn(db, typeId);
    const image =
      (type.images || []).find((x) => x.id === imageId) ||
      fail("Ảnh không tồn tại.", 404);
    if (body.description !== undefined)
      image.description = descriptionOf(body.description);
    if (body.isCover === true)
      (type.images || []).forEach((x) => {
        x.isCover = x.id === imageId;
      });
    normalize(type);
    return image;
  });
}
async function reorder(typeId, imageIds) {
  return repo.transaction(["roomTypes"], (db) => {
    const type = typeIn(db, typeId);
    const current = type.images || [];
    if (
      !Array.isArray(imageIds) ||
      imageIds.length !== current.length ||
      new Set(imageIds).size !== current.length ||
      imageIds.some((key) => !current.some((x) => x.id === key))
    )
      fail("Danh sách thứ tự ảnh không hợp lệ.");
    type.images = imageIds.map((key, order) => ({
      ...current.find((x) => x.id === key),
      order,
    }));
    return normalize(type);
  });
}
async function remove(typeId, imageId) {
  const result = await repo.transaction(["roomTypes"], (db) => {
    const type = typeIn(db, typeId);
    const image =
      (type.images || []).find((x) => x.id === imageId) ||
      fail("Ảnh không tồn tại.", 404);
    type.images = (type.images || []).filter((x) => x.id !== imageId);
    return { image, images: normalize(type) };
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
