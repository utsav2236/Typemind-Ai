// tests/liveApiTest.js
// Live integration test against the running server.
// Run with: node tests/liveApiTest.js
// Requires the server to be running on http://localhost:5000

import './config/env.js';

const BASE = 'http://localhost:5000';
let cookieJar = '';
let sessionId = '';
let userId = '';

// ── Helpers ───────────────────────────────────────────────────────────────────

const req = async (method, path, body, withCookie = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (withCookie && cookieJar) headers['Cookie'] = cookieJar;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  // Capture Set-Cookie header
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookieJar = setCookie.split(';')[0];

  const data = await res.json();
  return { status: res.status, data };
};

const pass = (label) => console.log(`  ✅  ${label}`);
const fail = (label, msg) => console.log(`  ❌  ${label}: ${msg}`);
const section = (name) => console.log(`\n━━━ ${name} ━━━`);

const assert = (condition, label, extra = '') => {
  if (condition) pass(label);
  else fail(label, extra);
};

// ── Build a realistic keystroke array ─────────────────────────────────────────

const buildKeystrokes = (text, accuracy = 95) => {
  const keystrokes = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const correct = Math.random() * 100 < accuracy;
    keystrokes.push({
      key:          correct ? char : String.fromCharCode(char.charCodeAt(0) + 1),
      expectedKey:  char,
      correct,
      responseTime: 80 + Math.floor(Math.random() * 150),
    });
  }
  return keystrokes;
};

// ── Test data ─────────────────────────────────────────────────────────────────

const testEmail = `testlive_${Date.now()}@typemind.dev`;
const testPassword = 'TestPass123!';
const practiceText = 'The quick brown fox jumps over the lazy dog near the peaceful river bank today.';

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n🔬 TypeMind AI — Live API Test Suite');
  console.log('=====================================\n');

  let passed = 0;
  let failed = 0;
  const record = (ok) => ok ? passed++ : failed++;

  // ──────────────────────────────────────────────────────────────────────────
  section('1. HEALTH CHECK');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const { status, data } = await req('GET', '/api/health');
    record(assert(status === 200,         'GET /api/health → 200'));
    record(assert(data.success === true,  'Response success=true'));
    record(assert(data.database === 'connected', `DB status = connected (got: ${data.database})`));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('2. AUTH — REGISTER');
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Valid registration
    const { status, data } = await req('POST', '/api/auth/register', {
      name: 'Live Test User',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    record(assert(status === 201,           'POST /api/auth/register → 201'));
    record(assert(data.success === true,    'success=true'));
    record(assert(data.user?.email === testEmail, 'Returns user.email'));
    record(assert(!data.user?.password,     'Password NOT in response'));
    record(assert(!data.token,              'JWT NOT in response body'));
    if (data.user?._id) userId = data.user._id;

    // Duplicate email
    const dup = await req('POST', '/api/auth/register', {
      name: 'Dup', email: testEmail, password: testPassword, confirmPassword: testPassword,
    });
    record(assert(dup.status === 409, 'Duplicate email → 409'));

    // Missing fields
    const missing = await req('POST', '/api/auth/register', { email: testEmail });
    record(assert(missing.status === 400, 'Missing fields → 400'));

    // Password mismatch
    const mismatch = await req('POST', '/api/auth/register', {
      name: 'X', email: `mismatch_${Date.now()}@x.com`,
      password: 'Password1', confirmPassword: 'Password2',
    });
    record(assert(mismatch.status === 400, 'Password mismatch → 400'));

    // Weak password
    const weak = await req('POST', '/api/auth/register', {
      name: 'X', email: `weak_${Date.now()}@x.com`,
      password: '123', confirmPassword: '123',
    });
    record(assert(weak.status === 400, 'Weak password → 400'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('3. AUTH — LOGOUT & LOGIN');
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Logout
    const logout = await req('POST', '/api/auth/logout', null, true);
    record(assert(logout.status === 200, 'POST /api/auth/logout → 200'));

    // Wrong password
    const badLogin = await req('POST', '/api/auth/login', {
      email: testEmail, password: 'WrongPass!',
    });
    record(assert(badLogin.status === 401, 'Wrong password → 401'));

    // Correct login
    const { status, data } = await req('POST', '/api/auth/login', {
      email: testEmail, password: testPassword,
    });
    record(assert(status === 200,          'POST /api/auth/login → 200'));
    record(assert(data.success === true,   'success=true'));
    record(assert(data.user?.email === testEmail, 'Returns correct user'));
    record(assert(!data.user?.password,    'Password NOT in response'));
    record(assert(!data.token,             'JWT NOT in response body'));
    record(assert(!!cookieJar,             'JWT cookie set'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('4. AUTH — GET ME');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const { status, data } = await req('GET', '/api/auth/me', null, true);
    record(assert(status === 200,         'GET /api/auth/me → 200'));
    record(assert(data.user?.email === testEmail, 'Returns correct user'));

    // Without cookie → 401
    const noCookie = await req('GET', '/api/auth/me');
    record(assert(noCookie.status === 401, 'No cookie → 401 Unauthorized'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('5. USER PROFILE');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const { status, data } = await req('GET', '/api/users/profile', null, true);
    record(assert(status === 200, 'GET /api/users/profile → 200'));
    record(assert(data.user?.stats !== undefined, 'Has stats object'));
    record(assert(data.user?.preferences !== undefined, 'Has preferences object'));

    // Update profile
    const upd = await req('PUT', '/api/users/profile', {
      name: 'Updated Name',
      preferences: { theme: 'light', soundEnabled: false },
    }, true);
    record(assert(upd.status === 200,              'PUT /api/users/profile → 200'));
    record(assert(upd.data.user?.name === 'Updated Name', 'Name updated'));
    record(assert(upd.data.user?.preferences?.theme === 'light', 'Theme updated'));

    // Cannot update stats directly
    const statsUpd = await req('PUT', '/api/users/profile', { stats: { typingIQ: 999 } }, true);
    // Should succeed but typingIQ should NOT be changed via this route
    record(assert(statsUpd.status !== 200 || statsUpd.data.user?.stats?.typingIQ !== 999,
      'Cannot directly update typingIQ via profile endpoint'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('6. TYPING SESSION SUBMISSION');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const keystrokes = buildKeystrokes(practiceText, 96);

    const { status, data } = await req('POST', '/api/typing/sessions', {
      mode: 'general',
      difficulty: 'intermediate',
      duration: 60,
      text: practiceText,
      keystrokes,
    }, true);

    record(assert(status === 201,                   'POST /api/typing/sessions → 201'));
    record(assert(data.success === true,            'success=true'));
    record(assert(typeof data.session?.wpm === 'number', `WPM calculated (got ${data.session?.wpm})`));
    record(assert(data.session?.wpm >= 0,           'WPM >= 0'));
    record(assert(data.session?.accuracy >= 0 && data.session?.accuracy <= 100, `Accuracy in range (${data.session?.accuracy}%)`));
    record(assert(typeof data.session?.typingIQ === 'number', `TypingIQ calculated (got ${data.session?.typingIQ})`));
    record(assert(data.session?.typingIQ >= 0 && data.session?.typingIQ <= 150, 'TypingIQ in 0-150 range'));
    record(assert(data.session?.iqLevel !== undefined, `IQ Level: ${data.session?.iqLevel}`));
    record(assert(data.userStats?.totalTests === 1,  'totalTests incremented to 1'));
    record(assert(Array.isArray(data.newAchievements), 'newAchievements is array'));
    record(assert(data.newAchievements?.some(a => a.key === 'FIRST_TEST'), 'FIRST_TEST achievement unlocked'));
    if (data.session?._id) sessionId = data.session._id;

    // Session without auth
    const unauth = await req('POST', '/api/typing/sessions', {
      mode: 'general', difficulty: 'intermediate', duration: 60,
      text: practiceText, keystrokes,
    });
    record(assert(unauth.status === 401, 'No auth → 401'));

    // Invalid duration
    const badDuration = await req('POST', '/api/typing/sessions', {
      mode: 'general', difficulty: 'intermediate', duration: 5,
      text: practiceText, keystrokes,
    }, true);
    record(assert(badDuration.status === 400, 'Duration < 15s → 400'));

    // Empty keystrokes
    const emptyKS = await req('POST', '/api/typing/sessions', {
      mode: 'general', difficulty: 'intermediate', duration: 60,
      text: practiceText, keystrokes: [],
    }, true);
    record(assert(emptyKS.status === 400, 'Empty keystrokes → 400'));

    // Missing text
    const noText = await req('POST', '/api/typing/sessions', {
      mode: 'general', difficulty: 'intermediate', duration: 60,
      keystrokes,
    }, true);
    record(assert(noText.status === 400, 'Missing text → 400'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('7. SESSION HISTORY');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const { status, data } = await req('GET', '/api/typing/sessions', null, true);
    record(assert(status === 200, 'GET /api/typing/sessions → 200'));
    record(assert(Array.isArray(data.sessions), 'sessions is array'));
    record(assert(data.pagination !== undefined, 'Has pagination'));
    record(assert(data.sessions.length >= 1, `Has at least 1 session (got ${data.sessions.length})`));

    // With pagination
    const paged = await req('GET', '/api/typing/sessions?page=1&limit=5', null, true);
    record(assert(paged.status === 200, 'Pagination params accepted'));
    record(assert(paged.data.pagination?.limit === 5, 'Limit=5 respected'));

    // Get single session
    if (sessionId) {
      const single = await req('GET', `/api/typing/sessions/${sessionId}`, null, true);
      record(assert(single.status === 200, `GET /api/typing/sessions/:id → 200`));
      record(assert(single.data.session?._id === sessionId, 'Correct session returned'));
    }

    // Invalid ID
    const bad = await req('GET', '/api/typing/sessions/invalidid', null, true);
    record(assert(bad.status === 400, 'Invalid ObjectId → 400'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('8. ANALYTICS');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const overview = await req('GET', '/api/analytics/overview', null, true);
    record(assert(overview.status === 200, 'GET /api/analytics/overview → 200'));
    record(assert(overview.data.overview?.totalTests >= 1, 'totalTests >= 1'));
    record(assert(overview.data.overview?.typingIQ !== undefined, 'typingIQ present'));

    const progress = await req('GET', '/api/analytics/progress', null, true);
    record(assert(progress.status === 200, 'GET /api/analytics/progress → 200'));
    record(assert(Array.isArray(progress.data.progress), 'progress is array'));

    const weaknesses = await req('GET', '/api/analytics/weaknesses', null, true);
    record(assert(weaknesses.status === 200, 'GET /api/analytics/weaknesses → 200'));
    record(assert(Array.isArray(weaknesses.data.weakKeys), 'weakKeys is array'));

    const keyPerf = await req('GET', '/api/analytics/key-performance', null, true);
    record(assert(keyPerf.status === 200, 'GET /api/analytics/key-performance → 200'));

    const fingerPerf = await req('GET', '/api/analytics/finger-performance', null, true);
    record(assert(fingerPerf.status === 200, 'GET /api/analytics/finger-performance → 200'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('9. ACHIEVEMENTS');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const all = await req('GET', '/api/achievements', null, true);
    record(assert(all.status === 200, 'GET /api/achievements → 200'));
    record(assert(Array.isArray(all.data.achievements), 'achievements is array'));
    record(assert(all.data.achievements?.some(a => a.key === 'FIRST_TEST'), 'FIRST_TEST in achievements'));

    const recent = await req('GET', '/api/achievements/recent', null, true);
    record(assert(recent.status === 200, 'GET /api/achievements/recent → 200'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('10. LEADERBOARD');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const lb = await req('GET', '/api/leaderboard', null, true);
    record(assert(lb.status === 200, 'GET /api/leaderboard → 200'));
    record(assert(Array.isArray(lb.data.leaderboard), 'leaderboard is array'));
    record(assert(lb.data.period !== undefined, 'period field present'));

    // Weekly
    const weekly = await req('GET', '/api/leaderboard?period=weekly', null, true);
    record(assert(weekly.status === 200, 'GET /api/leaderboard?period=weekly → 200'));

    // Invalid period
    const badPeriod = await req('GET', '/api/leaderboard?period=yearly', null, true);
    record(assert(badPeriod.status === 400, 'Invalid period → 400'));

    // Check email not exposed
    if (lb.data.leaderboard?.length > 0) {
      const entry = lb.data.leaderboard[0];
      record(assert(!entry.email, 'Email NOT in leaderboard entries'));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('11. AI — GENERATE PRACTICE');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const practice = await req('POST', '/api/ai/generate-practice', {
      duration: 60,
      difficulty: 'adaptive',
      mode: 'general',
    }, true);

    record(assert([200, 503].includes(practice.status),
      `POST /api/ai/generate-practice → ${practice.status} (200=success, 503=no API key)`));

    if (practice.status === 200) {
      record(assert(typeof practice.data.practice?.text === 'string', 'Returns practice text'));
      record(assert(practice.data.practice?.text?.length > 20, `Text has content (${practice.data.practice?.text?.length} chars)`));
      record(assert(practice.data.practice?.difficulty !== undefined, 'Difficulty resolved'));
      record(assert(Array.isArray(practice.data.practice?.focusKeys), 'focusKeys is array'));
    } else {
      record(assert(practice.data.success === false, '503 has success=false'));
    }

    // AI endpoint without auth
    const noAuth = await req('POST', '/api/ai/generate-practice', { duration: 60 });
    record(assert(noAuth.status === 401, 'AI without auth → 401'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('12. AI ANALYSIS RETRIEVAL');
  // ──────────────────────────────────────────────────────────────────────────
  {
    if (sessionId) {
      const analysis = await req('GET', `/api/ai/analysis/${sessionId}`, null, true);
      record(assert(analysis.status === 200, `GET /api/ai/analysis/:id → 200`));
      record(assert(['pending','completed','failed',null].includes(analysis.data.analysis?.status ?? null),
        'Analysis status is valid'));
    }

    const recent = await req('GET', '/api/ai/analyses', null, true);
    record(assert(recent.status === 200, 'GET /api/ai/analyses → 200'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('13. SECURITY CHECKS');
  // ──────────────────────────────────────────────────────────────────────────
  {
    // 404 for unknown route
    const notFound = await req('GET', '/api/nonexistent');
    record(assert(notFound.status === 404, 'Unknown route → 404'));

    // Protected route without cookie
    const noAuthAnalytics = await req('GET', '/api/analytics/overview');
    record(assert(noAuthAnalytics.status === 401, 'Analytics without auth → 401'));

    // Massive keystrokes array (over limit)
    const massiveKS = Array(2001).fill({ key: 'a', expectedKey: 'a', correct: true, responseTime: 100 });
    const massive = await req('POST', '/api/typing/sessions', {
      mode: 'general', difficulty: 'intermediate', duration: 60,
      text: practiceText, keystrokes: massiveKS,
    }, true);
    record(assert(massive.status === 400, 'Over-limit keystrokes → 400'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('14. MULTI-SESSION STATS ACCUMULATION');
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Submit a 2nd session and verify stats are updated
    const ks2 = buildKeystrokes(practiceText, 98);
    const s2 = await req('POST', '/api/typing/sessions', {
      mode: 'quotes', difficulty: 'advanced', duration: 30,
      text: practiceText, keystrokes: ks2,
    }, true);
    record(assert(s2.status === 201, 'Second session submitted'));
    record(assert(s2.data.userStats?.totalTests === 2, 'totalTests = 2 after 2nd session'));
    record(assert(s2.data.userStats?.averageWpm > 0, 'averageWpm > 0'));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed}/${total} tests passed`);
  if (failed > 0) console.log(`  FAILED:  ${failed} test(s) need attention`);
  console.log('══════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('\n[Fatal] Test suite crashed:', err.message);
  process.exit(1);
});
