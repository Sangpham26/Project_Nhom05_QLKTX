import React from 'react';
import { Clock, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { contactDetails as contact } from './contactDetails';

export default function ContactPage() {
  return <div className="contact-page">
    <div className="page-title"><div><span className="eyebrow">HỖ TRỢ SINH VIÊN</span><h1>Liên hệ ban quản lý</h1><p>Thông tin văn phòng và giờ làm việc của ban quản lý ký túc xá.</p></div></div>
    <section className="contact-overview section-card" aria-labelledby="contact-office"><div><span className="eyebrow">VĂN PHÒNG KÝ TÚC XÁ</span><h2 id="contact-office">{contact.name}</h2><p><MapPin size={21} />{contact.office}</p>{contact.streetAddress && <p>{contact.streetAddress}</p>}</div><a className="button button-primary" href={`tel:${contact.phone}`}><Phone size={19} />Gọi {contact.phone}</a></section>
    <div className="contact-grid">
      <section className="section-card"><div className="section-head"><h2>Thông tin liên hệ</h2></div><dl className="contact-facts">
        <div><dt><UserRound size={20} />Người liên hệ</dt><dd>{contact.person}</dd></div>
        <div><dt><Phone size={20} />Số điện thoại</dt><dd><a href={`tel:${contact.phone}`}>{contact.phone}</a></dd></div>
        <div><dt><Mail size={20} />Email</dt><dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span className="muted">Chưa cập nhật</span>}</dd></div>
        <div><dt><MapPin size={20} />Địa điểm văn phòng</dt><dd>{contact.office}</dd></div>
      </dl></section>
      <section className="section-card"><div className="section-head"><h2><Clock size={21} />Giờ làm việc</h2></div><p className="muted">Giờ hành chính</p><dl className="contact-hours">{contact.hours.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.time}</dd></div>)}</dl><p className="contact-note">Bạn có thể gọi số điện thoại ở trên hoặc đến văn phòng trong giờ làm việc để được hỗ trợ về hồ sơ và lưu trú.</p></section>
    </div>
  </div>;
}
