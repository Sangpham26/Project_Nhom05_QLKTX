import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react';
import { landingAssets } from './landingAssets';
import LandingNav from './landing/LandingNav';
import ScrollStory from './landing/ScrollStory';
import RoomExplorer from './landing/RoomExplorer';
import Photo from './landing/Photo';
import { clamp, observeScroll, useMediaQuery, useReveal } from './landing/useLandingMotion';

function Hero() {
  const section = useRef(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    if (reduced) return;
    const element = section.current;
    const cleanup = observeScroll(() => {
      const box = element.getBoundingClientRect();
      const progress = clamp(-box.top / box.height);
      element.style.setProperty('--dl-hero-drift', `${progress * 58}px`);
      element.style.setProperty('--dl-hero-scale', 1.025 + progress * 0.035);
    });
    return () => { cleanup(); element.style.removeProperty('--dl-hero-drift'); element.style.removeProperty('--dl-hero-scale'); };
  }, [reduced]);
  return <section ref={section} className="dl-hero" aria-labelledby="dl-hero-heading">
    <div className="dl-hero-image"><Photo {...landingAssets.hero} eager /></div><div className="dl-hero-scrim" aria-hidden="true" />
    <div className="dl-hero-content dl-container"><span className="dl-kicker dl-hero-enter">KÝ TÚC XÁ SINH VIÊN</span><h1 id="dl-hero-heading"><span>Tìm phòng ở.</span><em>Đăng ký trực tuyến.</em></h1><div className="dl-hero-bottom"><div><p className="dl-hero-enter">Khám phá không gian, tìm phòng phù hợp và bắt đầu đăng ký chỗ ở của bạn.</p><div className="dl-hero-actions dl-hero-enter"><a href="#khong-gian" className="dl-button dl-button-paper">Khám phá không gian<ArrowDown size={18} /></a><a href="#phong-o" className="dl-button dl-button-outline">Tìm phòng phù hợp<ArrowUpRight size={19} /></a></div></div><span className="dl-hero-caption">ẢNH GIỚI THIỆU<br />Nội thất phòng ở</span></div></div>
    <div className="dl-hero-foot dl-container"><a href="#khong-gian"><ArrowDown size={16} /><span>Cuộn để khám phá</span></a><span>01 <i /> 05</span></div>
  </section>;
}

function LifeSection() {
  return <section id="tien-ich" className="dl-life dl-container" aria-labelledby="dl-life-heading">
    <div className="dl-section-head" data-dl-reveal><span className="dl-kicker">04 / HỌC TẬP VÀ SINH HOẠT</span><h2 id="dl-life-heading">Học tập.<br /><em>Và sinh hoạt.</em></h2><p>Hình ảnh khu vực học tập, phòng ở và sinh hoạt tại ký túc xá.</p></div>
    <article className="dl-life-row"><figure data-dl-reveal><Photo {...landingAssets.study} /><figcaption>01 — {landingAssets.study.caption}</figcaption></figure><div className="dl-life-copy" data-dl-reveal><span className="dl-kicker">KHU VỰC HỌC TẬP</span><h3>Không gian<br />học tập chung.</h3><p>Khu vực có bàn, ghế và cửa sổ để học nhóm, trao đổi bài hoặc đọc tài liệu.</p><span className="dl-life-index" aria-hidden="true">01</span></div></article>
    <article className="dl-life-row is-reverse"><figure data-dl-reveal><Photo {...landingAssets.rest} /><figcaption>02 — {landingAssets.rest.caption}</figcaption></figure><div className="dl-life-copy" data-dl-reveal><span className="dl-kicker">PHÒNG Ở</span><h3>Giường ngủ<br />và tủ đồ.</h3><p>Giường tầng và tủ đồ được sắp xếp trong cùng một phòng. Xem kỹ hình ảnh từng loại phòng để chọn cách bố trí hợp với bạn.</p><a className="dl-text-link" href="#phong-o">Quay lại chọn phòng<ArrowUpRight size={19} /></a><span className="dl-life-index" aria-hidden="true">02</span></div></article>
  </section>;
}

function JourneyCTA({ session }) {
  return <section id="quy-trinh" className="dl-start" aria-labelledby="dl-start-heading"><div className="dl-container">
    <span className="dl-kicker" data-dl-reveal>05 / BƯỚC TIẾP THEO</span><div className="dl-start-layout"><h2 id="dl-start-heading" data-dl-reveal>Đăng ký chỗ ở.<br /><em>Theo dõi hồ sơ.</em></h2><div className="dl-start-copy" data-dl-reveal><p>Xem phòng đang mở, tạo tài khoản sinh viên và gửi nguyện vọng. Bạn có thể theo dõi hồ sơ sau khi đăng nhập.</p><Link className="dl-button dl-button-paper" to={session ? '/rooms' : '/register'}>{session ? 'Chọn phòng phù hợp' : 'Bắt đầu đăng ký'}<ArrowUpRight size={20} /></Link><Link className="dl-text-link" to={session ? '/dashboard' : '/rooms'}>{session ? 'Mở trang quản lý' : 'Xem phòng trước'}<ArrowUpRight size={19} /></Link></div></div>
    <ol className="dl-start-steps"><li><span>01</span><div><strong>Xem phòng</strong><p>Ảnh, thông tin và chỗ còn trống.</p></div></li><li><span>02</span><div><strong>Gửi nguyện vọng</strong><p>Chọn phòng và thời hạn ở.</p></div></li><li><span>03</span><div><strong>Theo dõi hồ sơ</strong><p>Nhận cập nhật khi hồ sơ được xử lý.</p></div></li></ol>
  </div></section>;
}

function Footer({ session }) {
  return <footer className="dl-footer"><div className="dl-container"><div className="dl-footer-main"><a className="dl-footer-brand" href="#dau-trang">Nhóm 05<span>Ký túc xá sinh viên</span></a><nav aria-label="Điều hướng chân trang"><a href="#khong-gian">Không gian</a><a href="#phong-o">Phòng ở</a><a href="#tien-ich">Sinh hoạt</a><Link to={session ? '/dashboard' : '/login'}>{session ? 'Trang quản lý' : 'Đăng nhập'}</Link></nav><a className="dl-back-top" href="#dau-trang" aria-label="Về đầu trang"><ArrowUp size={22} /></a></div><div className="dl-footer-bottom"><span>Website quản lý ký túc xá sinh viên</span><span>© {new Date().getFullYear()} Nhóm 05</span></div></div></footer>;
}

export default function LandingPage({ session, onLogout }) {
  const root = useRef(null);
  useReveal(root);
  return <div id="dau-trang" ref={root} className="ktx-landing dorm-landing"><a className="dl-skip" href="#noi-dung-chinh">Đi đến nội dung</a><LandingNav session={session} onLogout={onLogout} /><main id="noi-dung-chinh" tabIndex={-1}><Hero /><ScrollStory /><RoomExplorer /><LifeSection /></main><div className="lp-outro dl-outro"><JourneyCTA session={session} /><Footer session={session} /></div></div>;
}
