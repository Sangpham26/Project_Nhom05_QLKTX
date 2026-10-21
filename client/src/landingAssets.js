// Dimensions and descriptions were checked against the supplied img/ files.
// Presentation photos are independent of the room-type libraries in the database.
const photo = (file, width, height, alt, caption) => ({
  src: `/landing/img/${file}`, width, height, alt, caption,
});

export const landingAssets = {
  hero: photo('4bed1.jpg', 2561, 1795,
    'Phòng có giường tầng khung trắng, tường xanh và cửa sổ bên trái', 'Nội thất phòng · ảnh giới thiệu'),
  campus: photo('toancanhktx.jpg', 612, 406,
    'Tòa nhà gạch đỏ với hàng cây và khoảng sân phía trước', 'Góc khu ở nhìn từ bên ngoài'),
  room: photo('4bed2.jpg', 2561, 1782,
    'Giường tầng, tủ đồ và cửa sổ trong một phòng ở', 'Giường tầng và góc để đồ'),
  courtyard: photo('sinhhoatchung.jpg', 750, 500,
    'Hành lang và cầu thang bao quanh một khoảng sân có cây xanh', 'Hành lang nhìn xuống khoảng cây xanh'),
  study: photo('khuhoctap.jpg', 462, 462,
    'Nhóm sinh viên trao đổi quanh bàn trong phòng có ghế ngồi và cửa sổ', 'Khu vực học nhóm'),
  rest: photo('6bed1.jpg', 1128, 891,
    'Giường tầng khung đen và những tủ đồ màu vàng trong phòng', 'Không gian nghỉ ngơi và cất đồ'),
};

export const storyScenes = [
  {
    title: 'Khu ký túc xá.', eyebrow: 'TỪ BÊN NGOÀI', photo: landingAssets.campus,
    body: 'Tòa nhà với hàng cây và khoảng sân phía trước. Đây là hình ảnh giới thiệu bên ngoài khu ở.',
  },
  {
    title: 'Nội thất phòng ở.', eyebrow: 'ĐI VÀO PHÒNG', photo: landingAssets.room,
    body: 'Phòng có giường tầng, tủ đồ và cửa sổ. Xem hình ảnh để tìm hiểu cách bố trí trong phòng.',
    href: '#phong-o', link: 'Xem các loại phòng',
  },
  {
    title: 'Hành lang và khu vực chung.', eyebrow: 'NHỮNG KHOẢNG CHUNG', photo: landingAssets.courtyard,
    body: 'Hành lang và cầu thang nối các tầng, bao quanh khu vực có cây xanh ở giữa.',
    href: '#tien-ich', link: 'Xem khu vực sinh hoạt',
  },
];
