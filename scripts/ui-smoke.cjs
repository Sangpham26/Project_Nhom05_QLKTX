const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  fs.mkdirSync('tmp', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'tmp/home.png', fullPage: true });
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.locator('input[name=email]').fill('admin@ktx.demo');
  await page.locator('input[name=password]').fill('Demo@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('**/dashboard');
  await page.getByText('Phòng đang quản lý').waitFor();
  await page.screenshot({ path: 'tmp/dashboard.png', fullPage: true });
  await page.goto('http://localhost:5173/rooms', { waitUntil: 'networkidle' });
  await page.getByText('Phòng A101').waitFor();
  await page.screenshot({ path: 'tmp/rooms.png', fullPage: true });
  const roomCode = `UI${Date.now()}`;
  await page.getByRole('button',{name:'Thêm phòng'}).click();
  await page.locator('input[name=code]').fill(roomCode);
  await page.locator('select[name=buildingId]').selectOption('b-a');
  await page.locator('select[name=roomTypeId]').selectOption('t-4m');
  await page.locator('input[name=designCapacity]').fill('4');
  await page.locator('input[name=operationalCapacity]').fill('4');
  await page.getByRole('button',{name:'Lưu thông tin'}).click();
  await page.getByPlaceholder('Tìm mã phòng, loại phòng...').fill(roomCode);
  await page.getByText(`Phòng ${roomCode}`).waitFor();
  for (const [email,expected,forbidden] of [
    ['staff@ktx.demo','Duyệt hồ sơ','Đơn giá'],
    ['an@ktx.demo','Tra cứu phòng','Nhân viên']
  ]) {
    const context = await browser.newContext({viewport:{width:1440,height:900}});
    const rolePage = await context.newPage();
    rolePage.on('pageerror',error=>errors.push(error.message));
    await rolePage.goto('http://localhost:5173/login', {waitUntil:'networkidle'});
    await rolePage.locator('input[name=email]').fill(email);
    await rolePage.locator('input[name=password]').fill('Demo@123');
    await rolePage.getByRole('button',{name:'Đăng nhập'}).click();
    await rolePage.waitForURL('**/dashboard');
    await rolePage.getByRole('navigation').getByText(expected).waitFor();
    if (await rolePage.getByRole('navigation').getByText(forbidden).count()) throw new Error(`Unexpected ${forbidden} menu for ${email}`);
    if (email.startsWith('staff@')) {
      rolePage.on('dialog',dialog=>dialog.accept());
      await rolePage.getByRole('navigation').getByText('Duyệt hồ sơ').click();
      await rolePage.getByText('Trần Đức Bình',{exact:true}).click();
      await rolePage.getByRole('button',{name:'Duyệt & bố trí phòng'}).click();
      await rolePage.locator('select[name=roomId]').selectOption('room-A201');
      await rolePage.locator('input[name=startDate]').fill('2026-10-01');
      await rolePage.locator('input[name=endDate]').fill('2027-06-30');
      await rolePage.getByRole('button',{name:'Lưu thông tin'}).click();
      await rolePage.getByText('Đã duyệt',{exact:true}).first().waitFor();
    }
    if (email.startsWith('an@')) await rolePage.screenshot({path:'tmp/student-dashboard.png',fullPage:true});
    await context.close();
  }
  const studentContext=await browser.newContext();
  const studentB=await studentContext.newPage();
  await studentB.goto('http://localhost:5173/login');
  await studentB.locator('input[name=email]').fill('binh@ktx.demo');
  await studentB.locator('input[name=password]').fill('Demo@123');
  await studentB.getByRole('button',{name:'Đăng nhập'}).click();
  await studentB.waitForURL('**/dashboard');
  await studentB.getByText('A201').first().waitFor();
  await studentContext.close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS UI: 3 role logins, admin adds room, staff approves application, student sees room; no browser errors.');
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
