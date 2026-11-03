import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { exec, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { startAttackerServer } from './attacker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const ATTACKER_PORT = Number(process.env.ATTACKER_PORT || 4000);
const app = express();

const MODE_IDS = ['sqli_auth', 'sqli_union', 'xss', 'cmdi', 'csrf'];
const requested = String(process.env.PROTECTED || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const modes = Object.fromEntries(
  MODE_IDS.map((id) => [id, requested.includes('all') || requested.includes(id) ? 'protected' : 'vulnerable'])
);

const SESSION_COOKIE = 'northwind_session';
const sessions = new Map();

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false }));

function parseCookies(req) {
  const cookies = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

function sessionFor(req) {
  const sid = parseCookies(req)[SESSION_COOKIE];
  return sid ? sessions.get(sid) : null;
}

function currentUser(req) {
  const session = sessionFor(req);
  if (!session) return null;
  return db.prepare('SELECT id, username, role, email, balance FROM users WHERE username = ?').get(session.username) || null;
}

function publicUser(user) {
  return user ? { id: user.id, username: user.username, role: user.role, email: user.email, balance: user.balance } : null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = user;
  req.session = sessionFor(req);
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'You do not have access to this area.' });
    next();
  });
}

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username ?? '');
  const password = String(req.body?.password ?? '');
  let user;

  try {
    if (modes.sqli_auth === 'protected') {
      const sql = 'SELECT id, username, role, email, balance FROM users WHERE username = ? AND password = ?';
      user = db.prepare(sql).get(username, password);
    } else {
      const sql = `SELECT id, username, role, email, balance FROM users WHERE username = '${username}' AND password = '${password}'`;
      user = db.prepare(sql).get();
    }
  } catch {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  if (!user) return res.status(401).json({ error: 'Incorrect username or password.' });

  const sid = crypto.randomUUID();
  const csrfToken = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, { username: user.username, csrfToken });
  // The demo keeps this readable by JavaScript so the stored-XSS impact can be
  // shown end-to-end. HttpOnly is the standard hardening step for the cookie.
  res.cookie(SESSION_COOKIE, sid, { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 1000 * 60 * 60 * 4 });

  res.json({ ok: true, user: publicUser(user), csrfToken });
});

app.get('/api/auth/me', (req, res) => {
  const session = sessionFor(req);
  const user = currentUser(req);
  if (!user || !session) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: publicUser(user), csrfToken: session.csrfToken });
});

app.post('/api/auth/logout', (req, res) => {
  const sid = parseCookies(req)[SESSION_COOKIE];
  if (sid) sessions.delete(sid);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  const session = sessionFor(req);
  const user = currentUser(req);
  res.json({ authenticated: Boolean(user), user: publicUser(user), csrfToken: session?.csrfToken || null });
});

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/products', (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 120);
  try {
    let rows;
    if (modes.sqli_union === 'protected') {
      const sql = 'SELECT id, name, description, price FROM products WHERE name LIKE ? OR description LIKE ? OR category LIKE ?';
      const like = `%${q}%`;
      rows = db.prepare(sql).all(like, like, like);
    } else {
      const sql = `SELECT id, name, description, price FROM products WHERE name LIKE '%${q}%' OR description LIKE '%${q}%' OR category LIKE '%${q}%'`;
      rows = db.prepare(sql).all();
    }
    res.json({ products: rows, count: rows.length });
  } catch {
    res.status(500).json({ error: 'Search is temporarily unavailable.' });
  }
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT id, name, description, price, category, sku FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const reviews = db.prepare(
    'SELECT id, product_id, author, content, rating, created_at FROM reviews WHERE product_id = ? ORDER BY id DESC'
  ).all(product.id);

  res.json({ product, reviews, renderRichText: modes.xss !== 'protected' });
});

app.post('/api/products/:id/reviews', (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const author = String(req.body?.author ?? '').trim();
  const content = String(req.body?.content ?? '').trim();
  const rating = Number(req.body?.rating);

  if (!author || !content) return res.status(400).json({ error: 'Please add your name and a review.' });
  if (author.length > 60 || content.length > 2000) return res.status(400).json({ error: 'Your review is too long.' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Choose a rating from 1 to 5.' });

  const createdAt = new Date().toISOString();
  const result = db.prepare('INSERT INTO reviews (product_id, author, content, rating, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(product.id, author, content, rating, createdAt);
  const review = db.prepare('SELECT id, product_id, author, content, rating, created_at FROM reviews WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  res.status(201).json({ ok: true, review });
});

/* ------------------------------------------------------------------ */
/* Account and store credit                                            */
/* ------------------------------------------------------------------ */

app.get('/api/account', requireAuth, (req, res) => {
  const transfers = db.prepare(
    'SELECT id, from_user, to_user, amount, created_at FROM transfers WHERE from_user = ? OR to_user = ? ORDER BY id DESC LIMIT 20'
  ).all(req.user.username, req.user.username);

  res.json({ user: publicUser(req.user), csrfToken: req.session.csrfToken, transfers });
});

app.all('/api/account/transfer', requireAuth, (req, res) => {
  const source = { ...req.query, ...(req.body || {}) };
  const to = String(source.to ?? '').trim();
  const amount = Number(source.amount);

  if (modes.csrf === 'protected') {
    const token = req.get('x-csrf-token') || '';
    if (req.method !== 'POST' || !token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'This request could not be verified. Please refresh and try again.' });
    }
  }

  if (!to || !/^[a-zA-Z0-9_.-]{1,40}$/.test(to)) {
    return res.status(400).json({ error: 'Enter a valid recipient username.' });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Enter a whole number greater than zero.' });
  }
  if (to === req.user.username) {
    return res.status(400).json({ error: 'You cannot transfer credit to yourself.' });
  }

  const recipient = db.prepare('SELECT id, username FROM users WHERE username = ?').get(to);
  if (!recipient) return res.status(404).json({ error: 'That member could not be found.' });

  const sender = db.prepare('SELECT id, balance FROM users WHERE id = ?').get(req.user.id);
  if (sender.balance < amount) return res.status(400).json({ error: 'You do not have enough store credit.' });

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, sender.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, recipient.id);
  db.prepare('INSERT INTO transfers (from_user, to_user, amount, created_at) VALUES (?, ?, ?, ?)')
    .run(req.user.username, recipient.username, amount, new Date().toISOString());

  const balance = db.prepare('SELECT balance FROM users WHERE id = ?').get(sender.id).balance;
  res.json({ ok: true, message: `Transfer complete.`, to: recipient.username, amount, balance });
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  const recentTransfers = db.prepare(
    'SELECT id, from_user, to_user, amount, created_at FROM transfers ORDER BY id DESC LIMIT 8'
  ).all();
  const recentReviews = db.prepare(
    'SELECT id, author, content, rating, created_at FROM reviews ORDER BY id DESC LIMIT 5'
  ).all().map((review) => ({
    ...review,
    // The overview is a plain-text summary; formatting is only rendered on the
    // product page where the review is displayed in context.
    content: String(review.content).replace(/<[^>]*>/g, '')
  }));

  res.json({
    stats: {
      members: count('users'),
      products: count('products'),
      reviews: count('reviews'),
      transfers: count('transfers')
    },
    recentTransfers,
    recentReviews
  });
});

function runShell(command) {
  const started = Date.now();
  return new Promise((resolve) => {
    exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        exitCode: error?.code ?? 0,
        output: `${stdout || ''}${stderr ? `\n${stderr}` : ''}`.trim() || (error ? error.message : 'No output'),
        durationMs: Date.now() - started
      });
    });
  });
}

function runPing(host) {
  const started = Date.now();
  return new Promise((resolve) => {
    execFile('ping', ['-c', '1', host], { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        exitCode: error?.code ?? 0,
        output: `${stdout || ''}${stderr ? `\n${stderr}` : ''}`.trim() || (error ? error.message : 'No output'),
        durationMs: Date.now() - started
      });
    });
  });
}

app.post('/api/admin/diagnostics/ping', requireAdmin, async (req, res) => {
  const host = String(req.body?.host ?? '').trim();
  if (!host) return res.status(400).json({ error: 'Enter a hostname or IP address.' });
  if (host.length > 200) return res.status(400).json({ error: 'That hostname is too long.' });

  if (modes.cmdi === 'protected') {
    const valid = /^[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?$/.test(host) && !host.includes('..');
    if (!valid) return res.status(400).json({ error: 'Enter a valid hostname or IP address.' });
    return res.json(await runPing(host));
  }

  res.json(await runShell(`ping -c 1 ${host}`));
});

/* ------------------------------------------------------------------ */
/* Static frontend                                                     */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Northwind Supply  ->  http://localhost:${PORT}`);
});

startAttackerServer(ATTACKER_PORT, `http://localhost:${PORT}`);

export { app };
