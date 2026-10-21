require('dotenv').config({ path: require('path').resolve(__dirname,'../../.env') });
const express = require('express');
const cors = require('cors');
const roomImages = require('./services/roomImages');
const repo = require('./repositories');
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use('/api/uploads/room-types', express.static(roomImages.uploadDir, { fallthrough: false, immutable: true, maxAge: '1y', setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use(express.json());
app.get('/api/health', (req,res) => res.json({ success:true, data:{ status:'ok' } }));
app.use('/api', require('./routes/apiRoutes'));
app.use('/api', (req,res) => res.status(404).json({ success:false, error:'Đường dẫn API không tồn tại.' }));
app.use((error,req,res,next) => { console.error(error.message); const status = error.status || 500; const message = status === 413 ? 'Ảnh vượt quá dung lượng tối đa 5 MB.' : status === 404 ? 'Ảnh hoặc đường dẫn không tồn tại.' : error.status ? error.message : 'Lỗi máy chủ. Vui lòng thử lại.'; res.status(status).json({ success:false, error:message }); });
const port = process.env.PORT || 4000;
Promise.resolve(repo.ready?.()).then(() => {
  app.listen(port, () => console.log('KTX API running at http://localhost:' + port));
}).catch(async error => {
  console.error('Cannot start API: database unavailable:', error.message);
  try { await repo.close?.(); } catch (closeError) { console.error('Database close failed:', closeError.message); }
  process.exitCode = 1;
});
