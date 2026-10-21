export async function api(path, options = {}) {
  const token = localStorage.getItem('ktx_token');
  let response;
  try { response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(options.headers || {}) }, body: options.body ? JSON.stringify(options.body) : undefined }); }
  catch { throw new Error('Không kết nối được máy chủ. Hãy kiểm tra backend.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || 'Có lỗi xảy ra.');
  return result.data;
}
export async function uploadRoomImage(typeId, file, description = '') {
  const token = localStorage.getItem('ktx_token');
  let response;
  try {
    response = await fetch(`/api/roomTypes/${encodeURIComponent(typeId)}/images?description=${encodeURIComponent(description)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: file,
    });
  } catch { throw new Error('Không kết nối được máy chủ khi tải ảnh lên.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || 'Không thể tải ảnh lên.');
  return result.data;
}
export const money = n => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(Number(n || 0));
export const date = d => d ? new Date(`${String(d).slice(0,10)}T12:00:00`).toLocaleDateString('vi-VN') : '—';
export const labels = { STUDENT:'Sinh viên', STAFF:'Nhân viên', ADMIN:'Quản trị viên', ACTIVE:'Đang sử dụng', INACTIVE:'Ngừng sử dụng', PENDING:'Chờ duyệt', REVIEWING:'Đang kiểm tra', NEEDS_INFO:'Cần bổ sung', APPROVED:'Đã duyệt', REJECTED:'Từ chối', ENDED:'Đã kết thúc', TRANSFERRED:'Đã chuyển', EXTEND:'Gia hạn', RETURN:'Trả phòng', ELECTRICITY:'Điện', WATER:'Nước', UNPAID:'Chưa thanh toán', PARTIAL:'Trả một phần', PAID:'Đã thanh toán', OVERDUE:'Quá hạn', MALE:'Nam', FEMALE:'Nữ', OTHER:'Khác', ANY:'Tất cả', CASH:'Tiền mặt', TRANSFER:'Chuyển khoản' };
