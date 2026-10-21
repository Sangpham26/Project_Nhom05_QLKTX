import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import Photo from './Photo';

export default function LandingGallery({ title, photos, initialIndex = 0, onClose }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));
  const current = photos[index];
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    closeButton.current.focus();
    return () => { element.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);
  const step = (direction) => setIndex((value) => (value + direction + photos.length) % photos.length);
  return <dialog ref={dialog} className="dl-gallery" aria-labelledby="dl-gallery-title" onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={(event) => {
      if (photos.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll('button:not([disabled])')];
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
      }
    }}
    onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <header className="dl-gallery-head"><div><span className="dl-kicker">THƯ VIỆN ẢNH LOẠI PHÒNG</span><h2 id="dl-gallery-title">{title}</h2></div><button ref={closeButton} type="button" className="dl-circle-button" aria-label="Đóng thư viện ảnh" onClick={onClose}><X /></button></header>
    <div className="dl-gallery-stage"><Photo key={current.src} {...current} eager />{photos.length > 1 && <><button type="button" className="dl-gallery-arrow previous" aria-label="Ảnh trước" onClick={() => step(-1)}><ArrowLeft /></button><button type="button" className="dl-gallery-arrow next" aria-label="Ảnh tiếp theo" onClick={() => step(1)}><ArrowRight /></button></>}</div>
    <div className="dl-gallery-caption" aria-live="polite"><span>{current.caption || title}</span><span>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span></div>
    {photos.length > 1 && <div className="dl-thumbnails" aria-label="Chọn góc nhìn">{photos.map((photo, photoIndex) => <button key={photo.id} type="button" aria-label={`Xem ảnh ${photoIndex + 1}${photo.caption ? `: ${photo.caption}` : ''}`} aria-pressed={index === photoIndex} onClick={() => setIndex(photoIndex)}><Photo key={photo.src} {...photo} /><span>{String(photoIndex + 1).padStart(2, '0')}</span></button>)}</div>}
    <p className="dl-gallery-help">Dùng phím ← → để đổi ảnh. Nhấn Escape để đóng.</p>
  </dialog>;
}
