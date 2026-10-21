import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react';
import { api, uploadRoomImage } from './api';

const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;
const sorted = images => [...(images || [])].sort((a, b) => a.order - b.order);

export default function RoomTypeEditor({ initial, fields, onSaveType, onChanged, onClose }) {
  const [entity, setEntity] = useState(initial);
  const [values, setValues] = useState(initial);
  const [images, setImages] = useState(sorted(initial.images));
  const [pending, setPending] = useState([]);
  const [coverChoice, setCoverChoice] = useState(null);
  const [error, setError] = useState('');
  const [fileErrors, setFileErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const previewUrls = useRef(new Set());
  useEffect(() => () => { for (const url of previewUrls.current) URL.revokeObjectURL(url); }, []);

  const selectFiles = event => {
    const accepted = [], failures = [];
    for (const file of event.target.files || []) {
      if (!allowed.has(file.type)) { failures.push(`${file.name}: chỉ nhận PNG, JPG hoặc WebP.`); continue; }
      if (file.size === 0 || file.size > maxBytes) { failures.push(`${file.name}: dung lượng phải từ 1 byte đến 5 MB.`); continue; }
      if (images.length + pending.length + accepted.length >= 20) { failures.push(`${file.name}: mỗi loại phòng tối đa 20 ảnh.`); continue; }
      const url = URL.createObjectURL(file);
      previewUrls.current.add(url);
      accepted.push({ id: crypto.randomUUID(), file, url, description: '' });
    }
    setPending(old => [...old, ...accepted]);
    setFileErrors(failures);
    event.target.value = '';
  };
  const removePending = id => {
    const item = pending.find(x => x.id === id);
    if (item) { URL.revokeObjectURL(item.url); previewUrls.current.delete(item.url); }
    setPending(old => old.filter(x => x.id !== id));
    if (coverChoice === id) setCoverChoice(null);
  };
  const movePending = (index, direction) => {
    const next = [...pending], target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPending(next);
  };
  const changeImage = (id, description) => setImages(old => old.map(x => x.id === id ? { ...x, description } : x));
  const saveDescription = async image => {
    if (!entity.id) return;
    try { await api(`/roomTypes/${entity.id}/images/${image.id}`, { method: 'PATCH', body: { description: image.description } }); onChanged(); }
    catch (cause) { setError(cause.message); }
  };
  const chooseCover = async id => {
    if (pending.some(x => x.id === id)) { setCoverChoice(id); return; }
    try {
      await api(`/roomTypes/${entity.id}/images/${id}`, { method: 'PATCH', body: { isCover: true } });
      setImages(old => old.map(x => ({ ...x, isCover: x.id === id })));
      setCoverChoice(null); onChanged();
    } catch (cause) { setError(cause.message); }
  };
  const moveStored = async (index, direction) => {
    const next = [...images], target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try { const result = await api(`/roomTypes/${entity.id}/images/order`, { method: 'PUT', body: { imageIds: next.map(x => x.id) } }); setImages(sorted(result)); onChanged(); }
    catch (cause) { setError(cause.message); }
  };
  const deleteStored = async image => {
    if (!window.confirm(`Xóa ảnh ${image.description || 'này'} khỏi loại phòng?`)) return;
    try { const result = await api(`/roomTypes/${entity.id}/images/${image.id}`, { method: 'DELETE' }); setImages(sorted(result)); onChanged(); }
    catch (cause) { setError(cause.message); }
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setFileErrors([]);
    try {
      const saved = await onSaveType(values, entity.id);
      setEntity(saved);
      const failures = [], remaining = [], uploaded = new Map();
      for (const item of pending) {
        try {
          const image = await uploadRoomImage(saved.id, item.file, item.description);
          uploaded.set(item.id, image.id);
          URL.revokeObjectURL(item.url); previewUrls.current.delete(item.url);
        } catch (cause) { failures.push(`${item.file.name}: ${cause.message}`); remaining.push(item); }
      }
      setPending(remaining);
      const chosen = uploaded.get(coverChoice);
      if (chosen) {
        try { await api(`/roomTypes/${saved.id}/images/${chosen}`, { method: 'PATCH', body: { isCover: true } }); setCoverChoice(null); }
        catch (cause) { failures.push(`Ảnh đại diện: ${cause.message}`); }
      }
      const latest = await api(`/roomTypes/${saved.id}/images`);
      setImages(sorted(latest)); setFileErrors(failures); onChanged();
      if (!failures.length) setError('');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  return <form className="room-type-editor" onSubmit={save}>
    <div className="form-grid">
      {fields.map(field => <label className="field" key={field.name}>
        <span>{field.label}{field.required && <em>*</em>}</span>
        {field.options ? <select name={field.name} required={field.required} value={values[field.name] ?? ''} onChange={event => setValues(old => ({ ...old, [field.name]: event.target.value }))}>
          <option value="">Chọn {field.label.toLowerCase()}</option>
          {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.rows ? <textarea name={field.name} rows={field.rows} required={field.required} value={values[field.name] ?? ''} onChange={event => setValues(old => ({ ...old, [field.name]: event.target.value }))}/> : <input name={field.name} type={field.type || 'text'} min={field.min} required={field.required} value={values[field.name] ?? ''} onChange={event => setValues(old => ({ ...old, [field.name]: event.target.value }))}/>}
      </label>)}
    </div>
    <div className="photo-editor-head"><div><h3>Thư viện ảnh</h3><p>Ảnh của loại phòng được dùng chung cho tất cả phòng thuộc loại này. Tối đa 20 ảnh, 5 MB mỗi ảnh.</p></div><label className="button button-outline upload-button"><ImagePlus size={17}/>Chọn ảnh<input aria-label="Chọn ảnh loại phòng" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={selectFiles}/></label></div>
    {!images.length && !pending.length && <div className="photo-empty"><UploadCloud size={28}/><strong>Chưa có ảnh</strong><span>Chọn nhiều ảnh PNG, JPG hoặc WebP để thêm vào thư viện.</span></div>}
    <div className="photo-editor-list">
      {images.map((image, index) => <div className="photo-editor-item" key={image.id}>
        <img src={image.url} alt={image.description || `Ảnh ${index + 1}`} />
        <div className="photo-editor-fields"><div className="photo-editor-label"><strong>Ảnh {index + 1}</strong>{image.isCover && <span className="cover-chip">Ảnh đại diện</span>}</div><input aria-label={`Mô tả ảnh ${index + 1}`} placeholder="Mô tả ngắn, ví dụ: Góc nhìn bên trái" maxLength={120} value={image.description || ''} onChange={event => changeImage(image.id, event.target.value)} onBlur={() => saveDescription(image)}/><div className="photo-editor-tools"><button type="button" title="Đưa lên" disabled={index === 0 || busy} onClick={() => moveStored(index, -1)}><ArrowUp size={15}/></button><button type="button" title="Đưa xuống" disabled={index === images.length - 1 || busy} onClick={() => moveStored(index, 1)}><ArrowDown size={15}/></button><button type="button" className={image.isCover ? 'chosen' : ''} onClick={() => chooseCover(image.id)} disabled={busy}><Star size={15}/>{image.isCover ? 'Đại diện' : 'Chọn đại diện'}</button><button type="button" className="delete-photo" onClick={() => deleteStored(image)} disabled={busy}><Trash2 size={15}/>Xóa</button></div></div>
      </div>)}
      {pending.map((image, index) => <div className="photo-editor-item pending-photo" key={image.id}>
        <img src={image.url} alt={`Ảnh chuẩn bị tải ${index + 1}`}/>
        <div className="photo-editor-fields"><div className="photo-editor-label"><strong>Ảnh mới {index + 1}</strong><span className="pending-chip">Chưa lưu</span>{coverChoice === image.id && <span className="cover-chip">Ảnh đại diện</span>}</div><input aria-label={`Mô tả ảnh mới ${index + 1}`} placeholder="Mô tả ngắn (không bắt buộc)" maxLength={120} value={image.description} onChange={event => setPending(old => old.map(x => x.id === image.id ? { ...x, description: event.target.value } : x))}/><div className="photo-editor-tools"><button type="button" title="Đưa lên" disabled={index === 0 || busy} onClick={() => movePending(index, -1)}><ArrowUp size={15}/></button><button type="button" title="Đưa xuống" disabled={index === pending.length - 1 || busy} onClick={() => movePending(index, 1)}><ArrowDown size={15}/></button><button type="button" onClick={() => chooseCover(image.id)} disabled={busy}><Star size={15}/>Chọn đại diện</button><button type="button" className="delete-photo" onClick={() => removePending(image.id)} disabled={busy}><Trash2 size={15}/>Bỏ</button></div></div>
      </div>)}
    </div>
    {error && <div className="inline-error">{error}</div>}
    {fileErrors.length > 0 && <div className="inline-error">{fileErrors.map((message, index) => <div key={index}>{message}</div>)}</div>}
    <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Đóng</button><button className="button button-primary" disabled={busy}>{busy ? 'Đang lưu và tải ảnh...' : 'Lưu loại phòng và ảnh'}</button></div>
  </form>;
}
