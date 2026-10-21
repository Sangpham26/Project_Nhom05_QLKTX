import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Expand, ImageOff } from 'lucide-react';
import { api, labels, money } from '../api';
import Photo from './Photo';
import LandingGallery from './LandingGallery';

function useCatalog() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    api('/catalog').then((data) => { if (alive) setState({ loading: false, data, error: '' }); })
      .catch((error) => { if (alive) setState({ loading: false, data: null, error: error.message }); });
    return () => { alive = false; };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}

const sortedImages = (images) => [...(images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const coverIndex = (images) => Math.max(0, images.findIndex((image) => image.isCover));

function RoomPanel({ type, rooms }) {
  const [images, setImages] = useState(() => sortedImages(type.images));
  const [index, setIndex] = useState(() => coverIndex(sortedImages(type.images)));
  const [gallery, setGallery] = useState(false);
  const [warning, setWarning] = useState('');
  useEffect(() => {
    let alive = true;
    api(`/roomTypes/${encodeURIComponent(type.id)}/images`).then((items) => {
      if (!alive) return;
      const next = sortedImages(items);
      setImages(next); setIndex(coverIndex(next));
    }).catch(() => { if (alive) setWarning('Chưa cập nhật được thư viện. Bạn vẫn có thể xem các ảnh đã tải.'); });
    return () => { alive = false; };
  }, [type.id]);
  const photos = images.map((image) => ({ id: image.id, src: image.url, alt: image.description || `Không gian ${type.name.toLowerCase()}`, caption: image.description || type.name }));
  const current = photos[index] || photos[0];
  const availableRooms = rooms.filter((room) => room.roomTypeId === type.id && room.status === 'ACTIVE' && room.building?.status === 'ACTIVE');
  const knownVacancy = availableRooms.every((room) => Number.isFinite(room.vacant));
  const vacancy = availableRooms.reduce((total, room) => total + (room.vacant || 0), 0);
  const feeKnown = type.fee !== undefined && type.fee !== null && Number.isFinite(Number(type.fee));
  return <div className="dl-room-panel" id={`dl-room-panel-${type.id}`} role="tabpanel" aria-labelledby={`dl-room-tab-${type.id}`} tabIndex={0}>
    <div className="dl-room-photos"><div className="dl-room-main">{current ? <Photo key={current.src} {...current} /> : <div className="dl-room-no-photo"><ImageOff size={38} strokeWidth={1.2} /><span>THƯ VIỆN ĐANG CẬP NHẬT</span><strong>Chưa có ảnh của<br />loại phòng này.</strong><p>Thông tin phòng vẫn có ở bên cạnh.</p></div>}
      {current && <button type="button" className="dl-expand" onClick={() => setGallery(true)} aria-label={`Mở thư viện ${type.name}`}><Expand size={18} />Xem không gian</button>}</div>
      <div className="dl-room-photo-caption"><span>{current ? (current.caption || 'Thư viện ảnh loại phòng') : 'Ảnh sẽ xuất hiện khi thư viện được cập nhật.'}</span><span>{photos.length ? `${String(index + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}` : '—'}</span></div>
      {photos.length > 1 && <div className="dl-thumbnails" aria-label={`Các góc nhìn ${type.name}`}>{photos.map((photo, photoIndex) => <button key={photo.id} type="button" aria-label={`Xem ảnh ${photoIndex + 1}${photo.caption ? `: ${photo.caption}` : ''}`} aria-pressed={index === photoIndex} onClick={() => setIndex(photoIndex)}><Photo key={photo.src} {...photo} /><span>{String(photoIndex + 1).padStart(2, '0')}</span></button>)}</div>}
      {warning && <p className="dl-room-warning" role="status">{warning}</p>}
    </div>
    <div className="dl-room-info"><span className="dl-kicker">LOẠI PHÒNG ĐANG MỞ</span><h3>{type.name}</h3><p className="dl-room-description">{type.description || 'Xem danh sách phòng để biết thông tin cụ thể và gửi nguyện vọng.'}</p>
      <dl className="dl-room-facts">{Number.isFinite(Number(type.defaultCapacity)) && type.defaultCapacity != null && <div><dt>Sức chứa</dt><dd>{type.defaultCapacity}<small> người / phòng</small></dd></div>}{labels[type.gender] && <div><dt>Dành cho</dt><dd className="dl-fact-text">{labels[type.gender]}</dd></div>}{knownVacancy && <div><dt>Chỗ còn trống</dt><dd>{vacancy}<small> chỗ / {availableRooms.length} phòng</small></dd></div>}</dl>
      {feeKnown && <div className="dl-room-price"><span>Phí tham khảo · sinh viên / tháng</span><strong>{money(type.fee)}</strong></div>}
      <Link className="dl-button dl-button-warm" to={`/rooms?type=${encodeURIComponent(type.id)}`}>Xem phòng & gửi nguyện vọng<ArrowUpRight size={19} /></Link>
      <p className="dl-room-footnote">Chỗ trống được tính từ các phòng đang hoạt động. Phòng được bố trí sau khi hồ sơ được duyệt.</p>
    </div>
    {gallery && current && <LandingGallery title={type.name} photos={photos} initialIndex={index} onClose={() => setGallery(false)} />}
  </div>;
}

export default function RoomExplorer() {
  const catalog = useCatalog();
  const [selectedId, setSelectedId] = useState(null);
  const types = (catalog.data?.roomTypes || []).filter((type) => type.status === 'ACTIVE');
  const selected = types.find((type) => type.id === selectedId) || types[0];
  const selectByKey = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? types.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + types.length) % types.length;
    setSelectedId(types[next].id);
    document.getElementById(`dl-room-tab-${types[next].id}`)?.focus();
  };
  return <section id="phong-o" className="dl-rooms" aria-labelledby="dl-rooms-heading"><div className="dl-container">
    <div className="dl-section-head" data-dl-reveal><span className="dl-kicker">03 / CÁC LOẠI PHÒNG</span><h2 id="dl-rooms-heading">Các loại phòng.<br /><em>Chỗ còn trống.</em></h2><p>So sánh loại phòng, xem từng góc nhìn và kiểm tra chỗ còn trống trước khi gửi nguyện vọng.</p></div>
    {catalog.loading && <div className="dl-catalog-state" role="status"><span className="dl-loading-line" /><p>Đang tải các loại phòng…</p></div>}
    {!catalog.loading && catalog.error && <div className="dl-catalog-state" role="alert"><h3>Chưa tải được thông tin phòng.</h3><p>{catalog.error}</p><button type="button" className="dl-button dl-button-outline" onClick={catalog.retry}>Thử lại<ArrowUpRight size={18} /></button></div>}
    {!catalog.loading && !catalog.error && !types.length && <div className="dl-catalog-state"><h3>Danh sách phòng đang được cập nhật.</h3><Link className="dl-button dl-button-outline" to="/rooms">Mở trang phòng ở<ArrowUpRight size={18} /></Link></div>}
    {!catalog.loading && !catalog.error && selected && <><div className="dl-room-tabs" role="tablist" aria-label="Chọn loại phòng">{types.map((type, index) => <button key={type.id} type="button" id={`dl-room-tab-${type.id}`} role="tab" aria-selected={selected.id === type.id} aria-controls={`dl-room-panel-${type.id}`} tabIndex={selected.id === type.id ? 0 : -1} onKeyDown={(event) => selectByKey(event, index)} onClick={() => setSelectedId(type.id)}><span>0{index + 1}</span>{type.name}<ArrowUpRight size={17} /></button>)}</div><RoomPanel key={selected.id} type={selected} rooms={catalog.data.rooms || []} /></>}
    <Link className="dl-all-rooms" to="/rooms">Xem toàn bộ danh sách phòng<ArrowUpRight size={19} /></Link>
  </div></section>;
}
