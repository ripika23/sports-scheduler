const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const app = require('../app');
const db = require('../models');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '../public/images/screenshots');
const ARTIFACTS_DIR = 'C:\\Users\\Ripika\\.gemini\\antigravity\\brain\\08deb08b-de8e-4e18-8abd-6a295524fc58';
const PORT = 3099;

async function seedData() {
  console.log('Seeding demo database for screenshots...');
  await db.sequelize.sync({ force: true });

  const admin = await db.User.create({
    name: 'System Administrator',
    email: 'admin@sportsscheduler.com',
    passwordHash: db.User.hashPassword('AdminPassword123!'),
    role: 'admin'
  });

  const alice = await db.User.create({
    name: 'Alice Walker',
    email: 'alice@example.com',
    passwordHash: db.User.hashPassword('PlayerPassword123!'),
    role: 'player'
  });

  const bob = await db.User.create({
    name: 'Bob Johnson',
    email: 'bob@example.com',
    passwordHash: db.User.hashPassword('PlayerPassword123!'),
    role: 'player'
  });

  const charlie = await db.User.create({
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    passwordHash: db.User.hashPassword('PlayerPassword123!'),
    role: 'player'
  });

  const football = await db.Sport.create({
    sportName: 'Football',
    description: '11-a-side or 7-a-side association football on turf or grass.',
    createdBy: admin.id
  });

  const basketball = await db.Sport.create({
    sportName: 'Basketball',
    description: '5-on-5 full court or 3-on-3 half court basketball pickup matches.',
    createdBy: admin.id
  });

  const cricket = await db.Sport.create({
    sportName: 'Cricket',
    description: 'T20 or box cricket matches with tennis or leather ball.',
    createdBy: admin.id
  });

  await db.Sport.create({
    sportName: 'Badminton',
    description: 'Indoor singles and doubles badminton matches.',
    createdBy: admin.id
  });

  await db.Sport.create({
    sportName: 'Volleyball',
    description: '6-a-side competitive or recreational volleyball games.',
    createdBy: admin.id
  });

  const now = new Date();
  const future1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const session1 = await db.Session.create({
    sportId: football.id,
    creatorId: alice.id,
    sessionTitle: 'Weekend 7v7 Premier Turf Clash',
    venue: 'Metropolis Sports Arena, Field 2',
    sessionDate: future1,
    sessionTime: '18:00',
    teamAPlayers: 'Alice Walker, David Green, Frank Miller',
    teamBPlayers: 'George Clark, Henry Scott',
    additionalPlayersNeeded: 3,
    status: 'active'
  });

  const session2 = await db.Session.create({
    sportId: basketball.id,
    creatorId: admin.id,
    sessionTitle: 'Friday Night 5v5 Open Runs',
    venue: 'Downtown Community Rec Center Court A',
    sessionDate: future2,
    sessionTime: '19:30',
    teamAPlayers: 'System Administrator, Liam Vance',
    teamBPlayers: 'Noah Ray, Mason Cole',
    additionalPlayersNeeded: 4,
    status: 'active'
  });

  await db.Session.create({
    sportId: cricket.id,
    creatorId: bob.id,
    sessionTitle: 'Sunday Morning Box Cricket League',
    venue: 'Green Valley Indoor Sports Complex',
    sessionDate: future3,
    sessionTime: '08:00',
    teamAPlayers: 'Bob Johnson, Charlie Brown',
    teamBPlayers: 'Sam Wilson, Peter Parker',
    additionalPlayersNeeded: 2,
    cancellationReason: 'Heavy rain forecasted and turf maintenance underway.',
    status: 'cancelled'
  });

  // Bob joins Alice's session
  await db.SessionParticipant.create({
    sessionId: session1.id,
    userId: bob.id,
    team: 'B'
  });

  // Charlie joins Admin's session
  await db.SessionParticipant.create({
    sessionId: session2.id,
    userId: charlie.id,
    team: 'A'
  });

  // Alice joins Admin's session
  await db.SessionParticipant.create({
    sessionId: session2.id,
    userId: alice.id,
    team: 'B'
  });
}

async function capture() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  await seedData();

  const server = app.listen(PORT, () => {
    console.log(`Screenshot capture server listening on port ${PORT}`);
  });

  console.log(`Launching Edge from ${EDGE_PATH}...`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  const takeScreenshot = async (filename, description) => {
    console.log(`Capturing: ${filename} - ${description}`);
    const localPath = path.join(SCREENSHOTS_DIR, filename);
    const artifactPath = path.join(ARTIFACTS_DIR, filename);

    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`  ✓ Saved: ${filename}`);
  };

  try {
    // 1. Home Page
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await takeScreenshot('01_home.png', 'Home Landing Page');

    // 2. Login Page
    await page.goto(`http://localhost:${PORT}/auth/login`, { waitUntil: 'networkidle0' });
    await takeScreenshot('02_login.png', 'User Login Page');

    // 3. Signup Page
    await page.goto(`http://localhost:${PORT}/auth/signup`, { waitUntil: 'networkidle0' });
    await takeScreenshot('03_signup.png', 'User Registration Page');

    // Login as Admin
    await page.goto(`http://localhost:${PORT}/auth/login`, { waitUntil: 'networkidle0' });
    await page.type('#email', 'admin@sportsscheduler.com');
    await page.type('#password', 'AdminPassword123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // 4. Admin Dashboard
    await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
    await takeScreenshot('04_admin_dashboard.png', 'Admin Command Dashboard');

    // 5. Sports Management
    await page.goto(`http://localhost:${PORT}/sports`, { waitUntil: 'networkidle0' });
    await takeScreenshot('05_sports_management.png', 'Sports Management Catalog');

    // 10. Reports Dashboard
    await page.goto(`http://localhost:${PORT}/reports`, { waitUntil: 'networkidle0' });
    await takeScreenshot('10_reports_dashboard.png', 'Admin Analytics & Reports Dashboard');

    // Logout admin by clearing cookies
    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }

    // Login as Alice (Player)
    await page.goto(`http://localhost:${PORT}/auth/login`, { waitUntil: 'networkidle0' });
    await page.type('#email', 'alice@example.com');
    await page.type('#password', 'PlayerPassword123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // 6. Create Session Form
    await page.goto(`http://localhost:${PORT}/sessions/new`, { waitUntil: 'networkidle0' });
    await takeScreenshot('06_create_session.png', 'Create Sports Session Form');

    // 7. Available Sessions
    await page.goto(`http://localhost:${PORT}/sessions/available`, { waitUntil: 'networkidle0' });
    await takeScreenshot('07_available_sessions.png', 'Available Sessions Browser');

    // 8. Joined Sessions
    await page.goto(`http://localhost:${PORT}/sessions/joined`, { waitUntil: 'networkidle0' });
    await takeScreenshot('08_joined_sessions.png', 'Player Joined Sessions');

    // 9. My Sessions
    await page.goto(`http://localhost:${PORT}/sessions/my-sessions`, { waitUntil: 'networkidle0' });
    await takeScreenshot('09_my_sessions.png', 'My Created Sessions');

    console.log('All 10 required screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
}

capture();
