import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';
import { GoogleGenAI, Modality } from '@google/genai';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// --- Local DB bootstrap (SQLite) ---
const dbPath = process.env.DND_DB_PATH || path.resolve(process.cwd(), 'dnd-local.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      chapter TEXT DEFAULT 'Chapter 1',
      map_state TEXT DEFAULT '{}',
      inventory TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS party_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      class_name TEXT,
      hp INTEGER DEFAULT 100,
      max_hp INTEGER DEFAULT 100,
      agility INTEGER DEFAULT 10,
      is_dead INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS game_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      turn_number INTEGER DEFAULT 0,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS turn_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      turn_number INTEGER NOT NULL,
      actor_name TEXT,
      action_summary TEXT,
      damage INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS dice_rolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      turn_log_id INTEGER,
      dice_type TEXT NOT NULL,
      roll_value INTEGER NOT NULL,
      modifier INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY(turn_log_id) REFERENCES turn_logs(id)
    );

    CREATE TABLE IF NOT EXISTS action_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      turn_log_id INTEGER,
      event_type TEXT NOT NULL,
      payload_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY(turn_log_id) REFERENCES turn_logs(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      owner_user_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY(owner_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'player',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(room_id, user_id),
      FOREIGN KEY(room_id) REFERENCES rooms(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_dm_note INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(room_id) REFERENCES rooms(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );



    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_campaign_user ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_turn_campaign ON turn_logs(campaign_id, turn_number);
    CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id, id DESC);
  `);

  // Lightweight migrations
  const cols = db.prepare("PRAGMA table_info(users)").all();
  const hasVerified = cols.some((c) => c.name === 'is_verified');
  if (!hasVerified) {
    db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_verify_email ON email_verification_codes(email, created_at DESC)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reset_email ON password_reset_codes(email, created_at DESC)');
}
initDb();

// --- Auth helpers ---
const APP_SECRET = process.env.DND_APP_SECRET || 'local-dev-secret-change-me';
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;
const CODE_TTL_MIN = Number(process.env.DND_CODE_TTL_MIN || 15);

function genNumericCode(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function nowIsoPlusMinutes(mins) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

async function sendSystemEmail({ to, subject, text }) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.DND_FROM_EMAIL || 'noreply@local.dnd';

  if (resendKey) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Email send failed: ${err}`);
    }
    return { provider: 'resend' };
  }

  // Local fallback: log only (dev mode)
  console.log('[EMAIL-FALLBACK]', { to, subject, text });
  return { provider: 'console' };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', APP_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', APP_SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload?.userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  req.user = payload;
  next();
}

function genInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dnd-gemini-backend', dbPath, timestamp: new Date().toISOString() });
});

// --- Auth APIs ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ ok: false, error: 'email,name,password required' });
    const normalizedEmail = String(email).toLowerCase().trim();
    const stmt = db.prepare('INSERT INTO users (email, name, password_hash, is_verified) VALUES (?, ?, ?, 0)');
    const result = stmt.run(normalizedEmail, String(name).trim(), hashPassword(String(password)));

    const code = genNumericCode(6);
    db.prepare('INSERT INTO email_verification_codes (email, code, expires_at, used) VALUES (?, ?, ?, 0)').run(normalizedEmail, code, nowIsoPlusMinutes(CODE_TTL_MIN));
    await sendSystemEmail({
      to: normalizedEmail,
      subject: 'Your D&D verification code',
      text: `Your verification code is: ${code}. It expires in ${CODE_TTL_MIN} minutes.`,
    });

    return res.json({ ok: true, userId: result.lastInsertRowid, verificationSent: true });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message.includes('UNIQUE') ? 'Email already exists' : e.message });
  }
});

app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const code = genNumericCode(6);
    db.prepare('INSERT INTO email_verification_codes (email, code, expires_at, used) VALUES (?, ?, ?, 0)').run(normalizedEmail, code, nowIsoPlusMinutes(CODE_TTL_MIN));
    await sendSystemEmail({
      to: normalizedEmail,
      subject: 'Your D&D verification code',
      text: `Your verification code is: ${code}. It expires in ${CODE_TTL_MIN} minutes.`,
    });
    return res.json({ ok: true, verificationSent: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Failed to send verification code' });
  }
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ ok: false, error: 'email,code required' });
  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare(`SELECT id, code, expires_at FROM email_verification_codes WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1`).get(normalizedEmail);
  if (!row) return res.status(400).json({ ok: false, error: 'No verification code found' });
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ ok: false, error: 'Verification code expired' });
  if (String(code).trim() !== String(row.code)) return res.status(400).json({ ok: false, error: 'Invalid verification code' });

  const tx = db.transaction(() => {
    db.prepare('UPDATE email_verification_codes SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(normalizedEmail);
  });
  tx();
  return res.json({ ok: true, verified: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) return res.json({ ok: true, sent: true }); // avoid account enumeration

    const code = genNumericCode(6);
    db.prepare('INSERT INTO password_reset_codes (email, code, expires_at, used) VALUES (?, ?, ?, 0)').run(normalizedEmail, code, nowIsoPlusMinutes(CODE_TTL_MIN));
    await sendSystemEmail({
      to: normalizedEmail,
      subject: 'Your D&D password reset code',
      text: `Your password reset code is: ${code}. It expires in ${CODE_TTL_MIN} minutes.`,
    });
    return res.json({ ok: true, sent: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Failed to send reset code' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) return res.status(400).json({ ok: false, error: 'email,code,newPassword required' });
  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare(`SELECT id, code, expires_at FROM password_reset_codes WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1`).get(normalizedEmail);
  if (!row) return res.status(400).json({ ok: false, error: 'No reset code found' });
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ ok: false, error: 'Reset code expired' });
  if (String(code).trim() !== String(row.code)) return res.status(400).json({ ok: false, error: 'Invalid reset code' });

  const tx = db.transaction(() => {
    db.prepare('UPDATE password_reset_codes SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hashPassword(String(newPassword)), normalizedEmail);
  });
  tx();
  return res.json({ ok: true, reset: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email,password required' });
  const user = db.prepare('SELECT id, email, name, password_hash, is_verified FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
  if (!user.is_verified) {
    return res.status(403).json({ ok: false, error: 'Email not verified. Please verify first.' });
  }
  const now = Math.floor(Date.now() / 1000);
  const token = signToken({ userId: user.id, email: user.email, name: user.name, iat: now, exp: now + TOKEN_TTL_SEC });
  return res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

// --- Campaign + save/continue APIs ---
app.post('/api/campaigns', requireAuth, (req, res) => {
  const { title = 'New Adventure', chapter = 'Chapter 1', mapState = {}, inventory = [], partyMembers = [] } = req.body || {};

  const tx = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO campaigns (user_id, title, chapter, map_state, inventory) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.userId, title, chapter, JSON.stringify(mapState), JSON.stringify(inventory));
    const campaignId = Number(result.lastInsertRowid);

    const insMember = db.prepare(
      'INSERT INTO party_members (campaign_id, name, class_name, hp, max_hp, agility, is_dead, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const m of partyMembers) {
      insMember.run(campaignId, m.name || 'Unknown', m.className || null, m.hp ?? 100, m.maxHp ?? 100, m.agility ?? 10, m.isDead ? 1 : 0, JSON.stringify(m.metadata || {}));
    }

    db.prepare('INSERT INTO game_states (campaign_id, turn_number, state_json) VALUES (?, ?, ?)').run(campaignId, 0, JSON.stringify({ chapter, mapState, inventory, partyMembers }));
    return campaignId;
  });

  const campaignId = tx();
  return res.json({ ok: true, campaignId });
});

app.get('/api/campaigns', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, title, chapter, status, updated_at FROM campaigns WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.userId);
  res.json({ ok: true, campaigns: rows });
});

app.get('/api/campaigns/continue/latest', requireAuth, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1').get(req.user.userId, 'active');
  if (!campaign) return res.status(404).json({ ok: false, error: 'No active campaign found' });
  const latestState = db.prepare('SELECT * FROM game_states WHERE campaign_id = ? ORDER BY id DESC LIMIT 1').get(campaign.id);
  const members = db.prepare('SELECT * FROM party_members WHERE campaign_id = ? ORDER BY id').all(campaign.id);
  res.json({
    ok: true,
    campaign: {
      ...campaign,
      map_state: JSON.parse(campaign.map_state || '{}'),
      inventory: JSON.parse(campaign.inventory || '[]'),
      partyMembers: members,
      latestState: latestState ? JSON.parse(latestState.state_json || '{}') : null,
    },
  });
});

app.post('/api/campaigns/:id/state', requireAuth, (req, res) => {
  const campaignId = Number(req.params.id);
  const { turnNumber = 0, state = {}, chapter, mapState, inventory, partyMembers = [] } = req.body || {};

  const campaign = db.prepare('SELECT id, user_id FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign || campaign.user_id !== req.user.userId) return res.status(404).json({ ok: false, error: 'Campaign not found' });

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO game_states (campaign_id, turn_number, state_json) VALUES (?, ?, ?)').run(campaignId, turnNumber, JSON.stringify(state));

    db.prepare('UPDATE campaigns SET chapter = COALESCE(?, chapter), map_state = COALESCE(?, map_state), inventory = COALESCE(?, inventory), updated_at = datetime(\'now\') WHERE id = ?').run(
      chapter ?? null,
      mapState ? JSON.stringify(mapState) : null,
      inventory ? JSON.stringify(inventory) : null,
      campaignId
    );

    if (Array.isArray(partyMembers) && partyMembers.length > 0) {
      db.prepare('DELETE FROM party_members WHERE campaign_id = ?').run(campaignId);
      const ins = db.prepare('INSERT INTO party_members (campaign_id, name, class_name, hp, max_hp, agility, is_dead, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const m of partyMembers) {
        ins.run(campaignId, m.name || 'Unknown', m.className || null, m.hp ?? 100, m.maxHp ?? 100, m.agility ?? 10, m.isDead ? 1 : 0, JSON.stringify(m.metadata || {}));
      }
    }
  });

  tx();
  res.json({ ok: true });
});

// --- Turn/action/dice replay APIs ---
app.post('/api/campaigns/:id/turns', requireAuth, (req, res) => {
  const campaignId = Number(req.params.id);
  const { turnNumber, actorName, actionSummary, damage = 0, dice = [], events = [] } = req.body || {};
  if (turnNumber == null) return res.status(400).json({ ok: false, error: 'turnNumber required' });

  const campaign = db.prepare('SELECT id, user_id FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign || campaign.user_id !== req.user.userId) return res.status(404).json({ ok: false, error: 'Campaign not found' });

  const tx = db.transaction(() => {
    const turn = db
      .prepare('INSERT INTO turn_logs (campaign_id, turn_number, actor_name, action_summary, damage) VALUES (?, ?, ?, ?, ?)')
      .run(campaignId, turnNumber, actorName || null, actionSummary || null, damage || 0);
    const turnLogId = Number(turn.lastInsertRowid);

    const insDice = db.prepare('INSERT INTO dice_rolls (campaign_id, turn_log_id, dice_type, roll_value, modifier, total) VALUES (?, ?, ?, ?, ?, ?)');
    for (const d of dice) {
      insDice.run(campaignId, turnLogId, d.diceType || 'd20', d.rollValue ?? 0, d.modifier ?? 0, d.total ?? 0);
    }

    const insEvent = db.prepare('INSERT INTO action_events (campaign_id, turn_log_id, event_type, payload_json) VALUES (?, ?, ?, ?)');
    for (const e of events) {
      insEvent.run(campaignId, turnLogId, e.eventType || 'action', JSON.stringify(e.payload || {}));
    }

    return turnLogId;
  });

  const turnLogId = tx();
  res.json({ ok: true, turnLogId });
});

app.get('/api/campaigns/:id/replay', requireAuth, (req, res) => {
  const campaignId = Number(req.params.id);
  const campaign = db.prepare('SELECT id, user_id FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign || campaign.user_id !== req.user.userId) return res.status(404).json({ ok: false, error: 'Campaign not found' });

  const turns = db.prepare('SELECT * FROM turn_logs WHERE campaign_id = ? ORDER BY turn_number, id').all(campaignId);
  const dice = db.prepare('SELECT * FROM dice_rolls WHERE campaign_id = ? ORDER BY id').all(campaignId);
  const events = db.prepare('SELECT * FROM action_events WHERE campaign_id = ? ORDER BY id').all(campaignId);
  res.json({ ok: true, turns, dice, events });
});

// --- Rooms/multiplayer chat APIs ---
app.post('/api/rooms', requireAuth, (req, res) => {
  const { roomName = 'Campaign Room', campaignId = null } = req.body || {};
  let inviteCode = genInviteCode();
  while (db.prepare('SELECT 1 FROM rooms WHERE invite_code = ?').get(inviteCode)) inviteCode = genInviteCode();

  const tx = db.transaction(() => {
    const room = db.prepare('INSERT INTO rooms (campaign_id, owner_user_id, room_name, invite_code) VALUES (?, ?, ?, ?)').run(campaignId, req.user.userId, roomName, inviteCode);
    const roomId = Number(room.lastInsertRowid);
    db.prepare('INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)').run(roomId, req.user.userId, 'dm');
    return roomId;
  });

  const roomId = tx();
  res.json({ ok: true, roomId, inviteCode });
});

app.post('/api/rooms/join', requireAuth, (req, res) => {
  const { inviteCode } = req.body || {};
  if (!inviteCode) return res.status(400).json({ ok: false, error: 'inviteCode required' });
  const room = db.prepare('SELECT id FROM rooms WHERE invite_code = ?').get(String(inviteCode).trim().toUpperCase());
  if (!room) return res.status(404).json({ ok: false, error: 'Room not found' });

  db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)').run(room.id, req.user.userId, 'player');
  res.json({ ok: true, roomId: room.id });
});

app.get('/api/rooms/:id/messages', requireAuth, (req, res) => {
  const roomId = Number(req.params.id);
  const member = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, req.user.userId);
  if (!member) return res.status(403).json({ ok: false, error: 'Not a room member' });

  const messages = db
    .prepare(
      `SELECT m.id, m.message, m.is_dm_note, m.created_at, u.name AS sender_name
       FROM chat_messages m JOIN users u ON u.id = m.user_id
       WHERE m.room_id = ? ORDER BY m.id DESC LIMIT 100`
    )
    .all(roomId)
    .reverse();
  res.json({ ok: true, messages });
});

app.post('/api/rooms/:id/messages', requireAuth, (req, res) => {
  const roomId = Number(req.params.id);
  const { message, isDmNote = false } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });
  const member = db.prepare('SELECT role FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, req.user.userId);
  if (!member) return res.status(403).json({ ok: false, error: 'Not a room member' });
  if (isDmNote && member.role !== 'dm') return res.status(403).json({ ok: false, error: 'Only DM can post DM notes' });

  const result = db.prepare('INSERT INTO chat_messages (room_id, user_id, message, is_dm_note) VALUES (?, ?, ?, ?)').run(roomId, req.user.userId, String(message), isDmNote ? 1 : 0);
  res.json({ ok: true, messageId: result.lastInsertRowid });
});

// --- Existing Gemini endpoints ---
app.post('/api/story/next', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing prompt (string)' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ ok: true, text: response.text || '' });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

app.post('/api/game/command', async (req, res) => {
  try {
    const {
      command,
      payload,
      schema,
      systemInstruction,
      model = 'gemini-2.5-flash',
    } = req.body || {};

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing command (string)' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify({ command, payload }),
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(schema
          ? {
              responseMimeType: 'application/json',
              responseSchema: schema,
            }
          : {}),
      },
    });

    const text = (response.text || '').trim().replace(/^```json\s*|```\s*$/g, '');
    const data = text ? JSON.parse(text) : null;

    return res.json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

app.post('/api/live/session', async (req, res) => {
  let session;
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const {
      model = 'gemini-live-2.5-flash-preview',
      prompt = 'Reply with exactly: LIVE_OK',
      timeoutMs = 15000,
    } = req.body || {};

    const ai = new GoogleGenAI({ apiKey });

    const result = await new Promise(async (resolve, reject) => {
      let done = false;
      let connected = false;
      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          reject(new Error(`Live session timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      try {
        session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.TEXT],
          },
          callbacks: {
            onopen: () => {
              connected = true;
            },
            onmessage: (message) => {
              if (done) return;
              const parts = message?.serverContent?.modelTurn?.parts || [];
              const text = parts.map((p) => p?.text || '').join(' ').trim();
              done = true;
              clearTimeout(timeout);
              resolve({
                text: text || null,
                rawType: Object.keys(message || {}),
                hasServerContent: Boolean(message?.serverContent),
                connected,
              });
            },
            onerror: (err) => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              reject(err?.error || err || new Error('Unknown live session error'));
            },
            onclose: () => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              if (connected) {
                resolve({ text: null, rawType: [], hasServerContent: false, connected: true, note: 'connected_then_closed' });
              } else {
                reject(new Error('Live session closed before connection established'));
              }
            },
          },
        });

        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: prompt }] }],
          turnComplete: true,
        });
      } catch (err) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    return res.json({ ok: true, model, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown live session error',
    });
  } finally {
    if (session) {
      try {
        session.close();
      } catch {
        // ignore close errors
      }
    }
  }
});

app.get('/api/compliance/status', (_req, res) => {
  return res.json({
    ok: true,
    track: 'Creative Storyteller',
    deployment: {
      project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null,
      region: process.env.CLOUD_RUN_REGION || null,
      service: process.env.K_SERVICE || null,
    },
    requirements: {
      geminiModel: true,
      genaiSdkOrAdk: true,
      liveApiOrAdk: 'implemented_probe_endpoint',
      googleCloudBackend: 'deployed_cloud_run',
    },
  });
});

app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'onyx',
      model = 'gpt-4o-mini-tts',
      format = 'mp3',
      instructions = 'Speak in a calm, low, mysterious male narrator voice.',
      provider = process.env.TTS_PROVIDER || 'openai',
      fallbackProvider = process.env.TTS_FALLBACK_PROVIDER || 'openai',
      timeoutMs = 15000,
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing text (string)' });
    }

    const fetchWithTimeout = async (url, init, ms = 15000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    const tryOpenAI = async () => {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return { ok: false, status: 500, error: 'Server missing OPENAI_API_KEY' };
      }

      const response = await fetchWithTimeout('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          voice,
          input: text,
          format,
          instructions,
        }),
      }, timeoutMs);

      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: `OpenAI TTS failed: ${errText}` };
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return { ok: true, contentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg', audioBuffer };
    };

    const tryCosyVoice = async () => {
      const base = (process.env.COSYVOICE_BASE_URL || '').replace(/\/$/, '');
      if (!base) {
        return { ok: false, status: 500, error: 'Server missing COSYVOICE_BASE_URL' };
      }

      const endpoint = process.env.COSYVOICE_TTS_PATH || '/api/tts';
      const cosyVoiceName = process.env.COSYVOICE_VOICE || voice;
      const response = await fetchWithTimeout(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: cosyVoiceName,
          speaker: cosyVoiceName,
          format,
          stream: false,
        }),
      }, timeoutMs);

      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: `CosyVoice TTS failed: ${errText}` };
      }

      const contentType = response.headers.get('content-type') || (format === 'wav' ? 'audio/wav' : 'audio/mpeg');
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return { ok: true, contentType, audioBuffer };
    };

    const resolveProvider = async (name) => {
      if (name === 'cosyvoice') return tryCosyVoice();
      return tryOpenAI();
    };

    let result = await resolveProvider(String(provider || 'openai').toLowerCase());
    if (!result.ok && fallbackProvider && String(fallbackProvider).toLowerCase() !== String(provider).toLowerCase()) {
      const fallback = await resolveProvider(String(fallbackProvider).toLowerCase());
      if (fallback.ok) {
        result = fallback;
      }
    }

    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, error: result.error || 'TTS failed' });
    }

    res.setHeader('Content-Type', result.contentType || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(result.audioBuffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown TTS server error',
    });
  }
});

app.listen(port, () => {
  console.log(`dnd-gemini-backend listening on :${port}`);
});
