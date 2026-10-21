import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BedDouble,
  Building2,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import './wireframe.css';

const sections = [
  { id: 'trang-chu', title: 'Trang chủ công khai', role: 'Khách' },
  { id: 'dang-nhap', title: 'Đăng nhập', role: 'Tất cả' },
  { id: 'dashboard', title: 'Tổng quan quản trị', role: 'Admin' },
  { id: 'tra-cuu', title: 'Tra cứu phòng', role: 'Tất cả' },
  { id: 'chi-tiet-phong', title: 'Chi tiết loại phòng', role: 'Tất cả' },
  { id: 'quan-ly-anh', title: 'Quản lý loại phòng & ảnh', role: 'Admin' },
  { id: 'sinh-vien', title: 'Không gian sinh viên', role: 'Sinh viên' },
  { id: 'nhan-vien', title: 'Duyệt hồ sơ', role: 'Nhân viên' },
  { id: 'bao-cao', title: 'Báo cáo', role: 'Admin / Nhân viên' },
  { id: 'ho-so-dang-ky', title: 'Hồ sơ đăng ký', role: 'Sinh viên' },
  { id: 'hoa-don', title: 'Hóa đơn & thanh toán', role: 'Tất cả' },
  { id: 'ho-so-ca-nhan', title: 'Hồ sơ cá nhân', role: 'Tất cả' },
  { id: 'thong-bao', title: 'Thông báo', role: 'Tất cả' },
];

function Frame({ id, index, title, description, role, children }) {
  return (
    <section className="wf-section" id={id} aria-label={title}>
      <div className="wf-section-heading">
        <div className="wf-section-number">{String(index).padStart(2, '0')}</div>
        <div>
          <div className="wf-section-overline">{role} / WIREFRAME</div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="wf-artboard">{children}</div>
    </section>
  );
}

function Line({ width = '100%', thick = false }) {
  return <span className={`wf-line ${thick ? 'thick' : ''}`} style={{ width }} />;
}

function Lines({ widths = ['100%', '82%', '62%'] }) {
  return <div className="wf-lines">{widths.map((width, index) => <Line key={index} width={width} />)}</div>;
}

function ImageBox({ label = 'Ảnh phòng', className = '' }) {
  return <div className={`wf-image ${className}`}><BedDouble size={28} strokeWidth={1.5} /><span>{label}</span></div>;
}

function FakeField({ label, wide = false }) {
  return <label className={`wf-field ${wide ? 'wide' : ''}`}><span>{label}</span><div /></label>;
}

function MiniSidebar({ role, active }) {
  const menu = role === 'Sinh viên'
    ? [[LayoutDashboard, 'Tổng quan'], [BedDouble, 'Tra cứu phòng'], [ClipboardList, 'Hồ sơ đăng ký'], [DoorOpen, 'Lưu trú của tôi'], [FileText, 'Yêu cầu lưu trú'], [Wallet, 'Hóa đơn']]
    : role === 'Nhân viên'
      ? [[LayoutDashboard, 'Tổng quan'], [ClipboardList, 'Duyệt hồ sơ'], [Users, 'Sinh viên nội trú'], [FileText, 'Yêu cầu lưu trú'], [BedDouble, 'Vận hành phòng'], [CreditCard, 'Công nợ']]
      : [[LayoutDashboard, 'Tổng quan'], [LayoutDashboard, 'Báo cáo'], [Building2, 'Tòa nhà'], [BedDouble, 'Loại phòng'], [DoorOpen, 'Phòng'], [Wallet, 'Đơn giá'], [ShieldCheck, 'Nhân viên']];
  return <aside className="wf-mini-sidebar">
    <div className="wf-mini-brand"><span><Building2 size={16} /></span><strong>Nhóm 05</strong></div>
    <small>KHÔNG GIAN CỦA BẠN</small>
    <nav>{menu.map(([Icon, label]) => <div key={label} className={label === active ? 'active' : ''}><Icon size={13} /><span>{label}</span></div>)}</nav>
  </aside>;
}

function MiniShell({ role = 'Admin', active, children }) {
  return <div className="wf-mini-shell">
    <MiniSidebar role={role} active={active} />
    <div className="wf-mini-workspace">
      <div className="wf-mini-header"><span>Nhóm 05 <b>›</b> {active}</span><div><Bell size={14} /><span className="wf-mini-avatar">N</span></div></div>
      <div className="wf-mini-content">{children}</div>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, action }) {
  return <div className="wf-page-heading"><div><small>{eyebrow}</small><h3>{title}</h3><Line width="230px" /></div>{action && <span className="wf-action">{action}</span>}</div>;
}

function Table({ columns, rows = 3 }) {
  return <div className="wf-table" style={{ '--wf-columns': columns.length }}><div className="wf-table-head">{columns.map(column => <span key={column}>{column}</span>)}</div>{Array.from({ length: rows }, (_, row) => <div className="wf-table-row" key={row}>{columns.map((column, cell) => cell === columns.length - 1 ? <span key={column} className="wf-table-chip" /> : <Line key={column} width={cell === 0 ? '65%' : '77%'} />)}</div>)}</div>;
}

function PublicHome() {
  return <div className="wf-public-home">
    <div className="wf-public-nav"><div className="wf-public-logo"><Building2 size={20} /><strong>Nhóm 05</strong></div><div><span>Khám phá phòng</span><span className="wf-action">Đăng nhập <ArrowRight size={12} /></span></div></div>
    <div className="wf-public-hero"><div><small>KHÔNG GIAN SỐNG DÀNH CHO BẠN</small><h3>Chốn ở tốt,<br /><em>hành trình</em><br />rộng mở.</h3><Lines widths={['75%', '68%']} /><div className="wf-hero-buttons"><span className="wf-action">Bắt đầu ngay</span><span className="wf-outline-action">Khám phá phòng</span></div></div><div className="wf-building"><div className="wf-building-roof" /><div className="wf-building-body">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div></div></div>
    <div className="wf-feature-row">{['Chọn kiểu phòng', 'Gửi nguyện vọng', 'Sống tiện nghi'].map((title, i) => <div key={title}><small>0{i + 1} / {title.toUpperCase()}</small><strong>{title}</strong><Lines widths={['80%', '62%']} /></div>)}</div>
  </div>;
}

function Login() {
  return <div className="wf-login"><div className="wf-login-form"><div className="wf-public-logo"><Building2 size={19} /><strong>Nhóm 05</strong></div><div className="wf-login-center"><small>CHÀO MỪNG TRỞ LẠI</small><h3>Rất vui khi gặp lại bạn.</h3><Line width="84%" /><FakeField label="Email" /><FakeField label="Mật khẩu" /><span className="wf-action">Đăng nhập <ArrowRight size={12} /></span><p>Chưa có tài khoản? Đăng ký ngay</p></div></div><div className="wf-login-visual"><div className="wf-building compact"><div className="wf-building-roof" /><div className="wf-building-body">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div></div><strong>Mọi trải nghiệm bắt đầu từ một chốn về.</strong></div></div>;
}

function Dashboard() {
  return <MiniShell active="Tổng quan"><div className="wf-welcome"><div><small>THỨ 5 · HÔM NAY</small><h3>Xin chào, quản trị viên ✳</h3><Line width="210px" /></div><Building2 size={43} strokeWidth={1.2} /></div><div className="wf-metrics">{[['Phòng đang quản lý', '10'], ['Sinh viên nội trú', '02'], ['Hồ sơ chờ duyệt', '01'], ['Còn phải thu', '—']].map(([label, value]) => <div key={label}><span className="wf-metric-icon" /><small>{label}</small><strong>{value}</strong><Line width="58%" /></div>)}</div><div className="wf-two-columns"><div className="wf-panel"><strong>Tỷ lệ lấp đầy</strong><div className="wf-occupancy"><div className="wf-donut" /><Lines widths={['64px', '72px']} /></div></div><div className="wf-panel"><strong>Tình hình khoản thu</strong><div className="wf-bars"><Line width="100%" thick /><Line width="72%" thick /><Line width="48%" thick /></div></div></div><div className="wf-panel"><strong>Hồ sơ cần xử lý</strong><Table columns={['Sinh viên', 'Nguyện vọng', 'Ngày gửi', 'Trạng thái']} rows={2} /></div></MiniShell>;
}

function Catalog() {
  return <MiniShell active="Phòng"><PageHeading eyebrow="KHÁM PHÁ KHÔNG GIAN" title="Tìm chốn ở phù hợp" /><div className="wf-type-cards">{['Phòng nam 4 người', 'Phòng nam 6 người', 'Phòng nữ 4 người'].map(name => <div key={name}><ImageBox label="Ảnh loại phòng" /><strong>{name}</strong><Line width="58%" /></div>)}</div><div className="wf-filter"><div><Search size={14} /> Tìm mã phòng, loại phòng...</div><span>Tất cả tòa</span><span>Loại phòng</span><span>Còn chỗ</span></div><div className="wf-room-cards">{['A101', 'A102', 'B101'].map(code => <div key={code}><ImageBox label="Ảnh phòng" /><div><small>Tòa nhà · Tầng</small><strong>Phòng {code}</strong><Line width="70%" /><span>Phí / tháng <ArrowRight size={13} /></span></div></div>)}</div></MiniShell>;
}

function RoomDetail() {
  return <div className="wf-detail-stage"><div className="wf-detail-modal"><div className="wf-detail-title"><div><small>NHÓM 05</small><strong>Phòng nam 4 người</strong></div><span>×</span></div><div className="wf-detail-grid"><div><ImageBox className="large" label="Ảnh đại diện loại phòng" /><div className="wf-thumbs"><ImageBox label="01" /><ImageBox label="02" /></div><Line width="40%" /></div><div className="wf-detail-info"><small>KHÁM PHÁ LOẠI PHÒNG</small><h3>Phòng nam 4 người</h3><Lines widths={['100%', '80%']} /><div className="wf-detail-stats">{['Sức chứa', 'Giới tính', 'Còn trống'].map(label => <div key={label}><small>{label}</small><Line width="75%" /></div>)}</div><div className="wf-detail-price"><small>Phí tham khảo / sinh viên / tháng</small><strong>650.000 đ</strong></div><span className="wf-action">Gửi nguyện vọng <ArrowRight size={12} /></span></div></div></div></div>;
}

function RoomTypeAdmin() {
  return <MiniShell active="Loại phòng"><PageHeading eyebrow="DANH MỤC HỆ THỐNG" title="Quản lý loại phòng" action="Thêm loại phòng" /><div className="wf-panel"><div className="wf-filter"><div><Search size={14} /> Tìm loại phòng...</div></div><Table columns={['Mã', 'Tên loại phòng', 'Ảnh', 'Giới tính', 'Sức chứa', 'Phí / tháng', 'Trạng thái']} rows={3} /></div><div className="wf-editor"><div className="wf-editor-head"><strong>Cập nhật loại phòng</strong><span>×</span></div><div className="wf-editor-fields"><FakeField label="Mã loại" /><FakeField label="Tên loại phòng" /><FakeField label="Mô tả" wide /><FakeField label="Giới tính áp dụng" /><FakeField label="Sức chứa mặc định" /></div><div className="wf-editor-photo-head"><strong>Thư viện ảnh</strong><span className="wf-outline-action">Chọn ảnh</span></div><div className="wf-editor-photos"><div><ImageBox label="Ảnh 01" /><span>Ảnh đại diện · Góc chính diện</span></div><div><ImageBox label="Ảnh 02" /><span>Góc bên trái · Đổi thứ tự · Xóa</span></div></div><div className="wf-editor-actions"><span className="wf-outline-action">Đóng</span><span className="wf-action">Lưu loại phòng và ảnh</span></div></div></MiniShell>;
}

function Student() {
  return <MiniShell role="Sinh viên" active="Tổng quan"><div className="wf-welcome"><div><small>KHÔNG GIAN CỦA BẠN</small><h3>Xin chào, sinh viên ✳</h3><Line width="200px" /></div><DoorOpen size={40} strokeWidth={1.2} /></div><div className="wf-metrics three"><div><small>Hồ sơ đăng ký</small><strong>Đã duyệt</strong><Line width="55%" /></div><div><small>Phòng hiện tại</small><strong>A101</strong><Line width="55%" /></div><div><small>Hóa đơn cần thanh toán</small><strong>01</strong><Line width="55%" /></div></div><div className="wf-two-columns"><div className="wf-panel"><strong>Lưu trú hiện tại</strong><div className="wf-student-stay"><ImageBox label="Phòng A101" /><div><Lines widths={['80%', '65%', '75%']} /><span className="wf-outline-action">Xem chi tiết</span></div></div></div><div className="wf-panel"><strong>Thông báo mới</strong><div className="wf-feed"><Line width="90%" /><Line width="72%" /><Line width="83%" /></div></div></div></MiniShell>;
}

function Staff() {
  return <MiniShell role="Nhân viên" active="Duyệt hồ sơ"><PageHeading eyebrow="VẬN HÀNH KÝ TÚC XÁ" title="Duyệt hồ sơ đăng ký" /><div className="wf-metrics three"><div><small>Chờ duyệt</small><strong>01</strong></div><div><small>Cần bổ sung</small><strong>—</strong></div><div><small>Đã duyệt</small><strong>02</strong></div></div><div className="wf-panel"><div className="wf-filter"><div><Search size={14} /> Tìm sinh viên, mã hồ sơ...</div><span>Trạng thái</span></div><Table columns={['Sinh viên', 'Loại phòng', 'Ngày gửi', 'Trạng thái', 'Chi tiết']} rows={4} /></div><div className="wf-panel wf-decision"><div><strong>Chi tiết hồ sơ</strong><Lines widths={['92%', '70%']} /></div><div><strong>Bố trí phòng</strong><Lines widths={['82%', '65%']} /></div><span className="wf-action">Duyệt & bố trí phòng</span></div></MiniShell>;
}

function Report() {
  return <MiniShell active="Báo cáo"><PageHeading eyebrow="SỐ LIỆU KÝ TÚC XÁ" title="Báo cáo tổng hợp" /><div className="wf-metrics three"><div><small>Tổng số phòng</small><strong>10</strong><Line width="55%" /></div><div><small>Sinh viên nội trú</small><strong>02</strong><Line width="55%" /></div><div><small>Tỷ lệ lấp đầy</small><strong>5%</strong><Line width="55%" /></div></div><div className="wf-two-columns"><div className="wf-panel"><strong>Tình hình sử dụng phòng</strong><div className="wf-occupancy"><div className="wf-donut" /><Lines widths={['80px', '65px']} /></div></div><div className="wf-panel"><strong>Thu phí theo kỳ</strong><div className="wf-bars"><Line width="100%" thick /><Line width="75%" thick /><Line width="48%" thick /></div></div></div><div className="wf-panel"><strong>Thống kê theo tòa nhà</strong><Table columns={['Tòa nhà', 'Số phòng', 'Đang ở', 'Còn trống']} rows={2} /></div></MiniShell>;
}

function Application() {
  return <MiniShell role="Sinh viên" active="Hồ sơ đăng ký"><PageHeading eyebrow="ĐĂNG KÝ LƯU TRÚ" title="Hồ sơ đăng ký" action="Gửi nguyện vọng" /><div className="wf-panel"><strong>Trạng thái hồ sơ</strong><div className="wf-application-status"><span className="wf-step active">01 · Đã gửi</span><span className="wf-step">02 · Xét duyệt</span><span className="wf-step">03 · Bố trí phòng</span></div><Table columns={['Mã hồ sơ', 'Loại phòng mong muốn', 'Ngày gửi', 'Trạng thái']} rows={2} /></div><div className="wf-panel"><strong>Biểu mẫu nguyện vọng</strong><div className="wf-application-form"><FakeField label="Loại phòng mong muốn" /><FakeField label="Thời gian dự kiến" /><FakeField label="Liên hệ" /><FakeField label="Ghi chú" /><span className="wf-action">Gửi hồ sơ</span></div></div></MiniShell>;
}

function Invoice() {
  return <MiniShell role="Sinh viên" active="Hóa đơn"><PageHeading eyebrow="CHI PHÍ LƯU TRÚ" title="Hóa đơn & thanh toán" /><div className="wf-invoice-summary"><div><small>Tổng đã lập</small><strong>— đ</strong></div><div><small>Đã thanh toán</small><strong>— đ</strong></div><div><small>Còn phải trả</small><strong>— đ</strong></div></div><div className="wf-panel"><strong>Danh sách hóa đơn</strong><Table columns={['Kỳ thu', 'Phòng', 'Số tiền', 'Đã trả', 'Trạng thái']} rows={3} /></div><div className="wf-two-columns"><div className="wf-panel"><strong>Chi tiết khoản thu</strong><div className="wf-invoice-lines"><span>Tiền phòng <Line width="70px" /></span><span>Điện / nước <Line width="65px" /></span><span>Tổng cộng <Line width="90px" /></span></div></div><div className="wf-panel"><strong>Lịch sử thanh toán</strong><Table columns={['Ngày', 'Số tiền', 'Phương thức']} rows={2} /></div></div></MiniShell>;
}

function Profile() {
  return <MiniShell active="Hồ sơ cá nhân"><PageHeading eyebrow="TÀI KHOẢN CỦA BẠN" title="Hồ sơ cá nhân" /><div className="wf-profile-banner"><span className="wf-profile-avatar">N</span><div><strong>Họ và tên người dùng</strong><Line width="130px" /></div></div><div className="wf-panel"><strong>Thông tin cá nhân</strong><div className="wf-profile-fields"><FakeField label="Họ và tên" /><FakeField label="Số điện thoại" /><FakeField label="Địa chỉ" /><FakeField label="Khoa / ngành" /><FakeField label="Khóa học" /><FakeField label="Liên hệ khác" /></div><div className="wf-profile-save"><span className="wf-action">Lưu thay đổi</span></div></div></MiniShell>;
}

function Notifications() {
  return <MiniShell role="Sinh viên" active="Thông báo"><PageHeading eyebrow="CẬP NHẬT DÀNH CHO BẠN" title="Thông báo" /><div className="wf-panel"><div className="wf-notification-title"><strong>Hộp thông báo</strong><small>Thông báo chưa đọc</small></div><div className="wf-notification-list">{['Trạng thái hồ sơ', 'Thông tin lưu trú', 'Hóa đơn mới', 'Yêu cầu lưu trú'].map((title, index) => <div key={title}><span className="wf-notification-icon"><Bell size={14} /></span><div><strong>{title}</strong><Lines widths={['85%', '61%']} /><small>Ngày cập nhật</small></div>{index < 2 && <i />}</div>)}</div></div></MiniShell>;
}

export default function WireframePage() {
  return <div className="wireframe-page">
    <header className="wf-document-header"><div className="wf-document-top"><Link to="/dashboard" className="wf-back"><ArrowLeft size={17} /> Quay lại trang quản trị</Link><span>BẢN DÀNH CHO FIGMA CAPTURE</span></div><div className="wf-document-title"><div><span className="wf-kicker">NHÓM 05 · KÝ TÚC XÁ SINH VIÊN</span><h1>Wireframe website</h1><p>Các khung màn hình chính phản ánh bố cục hiện tại của website. Mỗi khung có thể được chụp riêng hoặc chụp toàn bộ trang bằng Figma Capture.</p></div><div className="wf-document-count"><strong>{String(sections.length).padStart(2, '0')}</strong><span>màn hình</span></div></div><nav className="wf-index" aria-label="Các màn hình wireframe">{sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a>)}</nav></header>
    <Frame {...sections[0]} index={1} description="Thanh điều hướng, giới thiệu, lời kêu gọi hành động và ba bước sử dụng."><PublicHome /></Frame>
    <Frame {...sections[1]} index={2} description="Biểu mẫu truy cập và khu vực minh họa bên phải."><Login /></Frame>
    <Frame {...sections[2]} index={3} description="Khung điều hướng xanh đen, banner chào, chỉ số, biểu đồ và bảng xử lý."><Dashboard /></Frame>
    <Frame {...sections[3]} index={4} description="Loại phòng, bộ lọc và các thẻ phòng dùng chung thư viện ảnh."><Catalog /></Frame>
    <Frame {...sections[4]} index={5} description="Popup ảnh lớn bên trái, ảnh thu nhỏ bên dưới và thông tin phòng bên phải."><RoomDetail /></Frame>
    <Frame {...sections[5]} index={6} description="Bảng danh mục và biểu mẫu quản lý thư viện ảnh loại phòng."><RoomTypeAdmin /></Frame>
    <Frame {...sections[6]} index={7} description="Tổng quan lưu trú, hồ sơ, hóa đơn và thông báo của sinh viên."><Student /></Frame>
    <Frame {...sections[7]} index={8} description="Bộ lọc hồ sơ, bảng danh sách và thao tác duyệt của nhân viên."><Staff /></Frame>
    <Frame {...sections[8]} index={9} description="Các chỉ số, biểu đồ sử dụng phòng và thống kê theo tòa nhà."><Report /></Frame>
    <Frame {...sections[9]} index={10} description="Tiến trình xét duyệt, danh sách hồ sơ và biểu mẫu gửi nguyện vọng."><Application /></Frame>
    <Frame {...sections[10]} index={11} description="Tổng quan khoản thu, danh sách hóa đơn, chi tiết và lịch sử thanh toán."><Invoice /></Frame>
    <Frame {...sections[11]} index={12} description="Thông tin tài khoản và biểu mẫu cập nhật hồ sơ cá nhân."><Profile /></Frame>
    <Frame {...sections[12]} index={13} description="Danh sách thông báo, nội dung ngắn và trạng thái chưa đọc."><Notifications /></Frame>
    <footer className="wf-document-footer"><span>NHÓM 05 / WIREFRAME</span><Link to="/dashboard">Trở lại trang quản trị <ArrowRight size={15} /></Link></footer>
  </div>;
}
