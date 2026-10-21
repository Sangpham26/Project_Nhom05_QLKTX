// Homepage navigation; its width and colors follow the shared landing theme.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { labels } from '../api';

const navItems = [
  { label: 'Trang chủ', href: '#dau-trang' },
  { label: 'Phòng ở', href: '#phong-o' },
  { label: 'Tiện ích', href: '#tien-ich' },
  { label: 'Quy trình', href: '#quy-trinh' },
];

export default function LandingNav({ session, onLogout, home = true }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const trigger = useRef(null);
  const mobileMenu = useRef(null);
  const accountWrap = useRef(null);
  const accountTrigger = useRef(null);
  const accountMenu = useRef(null);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 18);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    mobileMenu.current?.querySelector('a')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const links = [...(mobileMenu.current?.querySelectorAll('a') || [])];
      if (!links.length) return;
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault(); links.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
        event.preventDefault(); links[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);
  useEffect(() => {
    if (!accountOpen) return;
    accountMenu.current?.querySelector('[role="menuitem"]')?.focus();
    const closeOutside = (event) => {
      if (!accountWrap.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountTrigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);
  const moveAccountFocus = (event) => {
    const items = [...accountMenu.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    items[next].focus();
  };
  return (
    <header className={`lp-header${scrolled ? ' is-scrolled' : ''}`}>
      <nav className={`lp-nav lp-container${session ? ' has-session' : ''}`} aria-label="Điều hướng trang chủ">
        <a className="lp-brand" href={home ? '#dau-trang' : '/'} aria-label="Nhóm 05, về trang chủ">
          <span className="lp-brand-symbol"><Building2 size={23} strokeWidth={2.1} /></span>
          <span><strong>Nhóm 05</strong><small>KÝ TÚC XÁ SINH VIÊN</small></span>
        </a>
        <div className="lp-nav-desktop">
          {navItems.map((item) => <a key={item.href} href={home ? item.href : `/${item.href}`}>{item.label}</a>)}
        </div>
        {session ? (
          <div className="lp-account-wrap" ref={accountWrap} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false);
          }}>
            <button ref={accountTrigger} type="button" className="top-avatar" aria-label="Mở menu tài khoản" aria-expanded={accountOpen} aria-haspopup="menu" aria-controls={accountOpen ? 'lp-account-menu' : undefined} onClick={() => {
              setOpen(false);
              setAccountOpen((value) => !value);
            }} onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(false);
                setAccountOpen(true);
              }
            }}>{session.profile?.fullName?.charAt(0) || 'N'}</button>
            {accountOpen && <div id="lp-account-menu" ref={accountMenu} className="top-popover account-popover" role="menu" aria-label="Tài khoản" onKeyDown={moveAccountFocus}>
              <div className="account-popover-user"><strong>{session.profile?.fullName || session.user.email}</strong><span>{labels[session.user.role]}</span></div>
              <Link to="/dashboard" role="menuitem" onClick={() => setAccountOpen(false)}><LayoutDashboard size={17} />Trang quản lý</Link>
              <Link to="/profile" role="menuitem" onClick={() => setAccountOpen(false)}><Users size={17} />Chỉnh hồ sơ</Link>
              <button type="button" className="account-logout" role="menuitem" onClick={onLogout}><LogOut size={17} />Đăng xuất</button>
            </div>}
          </div>
        ) : <Link className="lp-nav-account" to="/login">Đăng nhập<ArrowRight size={16} /></Link>}
        <button ref={trigger} type="button" className="lp-menu-toggle" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="lp-mobile-menu" onClick={() => {
          setAccountOpen(false);
          setOpen((value) => !value);
        }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && <div id="lp-mobile-menu" ref={mobileMenu} className="lp-mobile-menu">
        {navItems.map((item) => <a key={item.href} href={home ? item.href : `/${item.href}`} onClick={() => setOpen(false)}>{item.label}</a>)}
        {!session && <Link className="lp-mobile-account" to="/login" onClick={() => setOpen(false)}>Đăng nhập<ArrowRight size={16} /></Link>}
      </div>}
    </header>
  );
}

