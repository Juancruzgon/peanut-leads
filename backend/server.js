require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const APOLLO_BASE = 'https://api.apollo.io/api/v1';
const DAILY_EMAIL_LIMIT = 50;
const JWT_SECRET = process.env.JWT_SECRET || 'peanut-leads-secret-change-in-production';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no configurado — usando clave por defecto. Configúrala en .env para producción.');
}

// In-memory daily email tracker (resets automatically each day)
let emailTracker = { date: null, count: 0 };

function getTracker() {
  const today = new Date().toDateString();
  if (emailTracker.date !== today) {
    emailTracker = { date: today, count: 0 };
  }
  return emailTracker;
}

const apolloHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.APOLLO_API_KEY,
  'Cache-Control': 'no-cache',
});

// ─── Auth ────────────────────────────────────────────────────────────────────

// POST /api/login — pública, no requiere token
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }
  if (username !== process.env.APP_USER || password !== process.env.APP_PASS) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Todas las rutas definidas DESPUÉS de este middleware requieren JWT válido
app.use('/api', (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Inicia sesión.' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
  }
});

// ─── Apollo endpoints ────────────────────────────────────────────────────────

// POST /api/search — Apollo People Search
app.post('/api/search', async (req, res) => {
  const { titles, industries, countries, page = 1, perPage = 25 } = req.body;

  if (!process.env.APOLLO_API_KEY) {
    return res.status(500).json({ error: 'APOLLO_API_KEY no configurada en el servidor.' });
  }

  const payload = { page, per_page: Math.min(perPage, 100) };
  if (titles?.length) payload.person_titles = titles;
  if (industries?.length) payload.organization_industries = industries;
  if (countries?.length) payload.person_locations = countries;

  try {
    const { data } = await axios.post(
      `${APOLLO_BASE}/mixed_people/search`,
      payload,
      { headers: apolloHeaders() }
    );

    const people = data.people || [];
    const pagination = data.pagination || {};

    const contacts = people.map((p) => ({
      id: p.id,
      name: p.name || null,
      firstName: p.first_name || null,
      lastName: p.last_name || null,
      title: p.title || null,
      company: p.organization?.name || p.employment_history?.[0]?.organization_name || null,
      industry: p.organization?.industry || null,
      location: [p.city, p.state, p.country].filter(Boolean).join(', ') || null,
      country: p.country || null,
      email: p.email || null,
      phone: p.sanitized_phone || null,
      linkedin: p.linkedin_url || null,
      emailStatus: p.email ? 'verified' : 'none',
    }));

    res.json({
      contacts,
      pagination: {
        total: pagination.total_entries || contacts.length,
        page: pagination.page || page,
        perPage: pagination.per_page || perPage,
        totalPages: pagination.total_pages || 1,
      },
    });
  } catch (err) {
    console.error('Apollo search error:', err.response?.data || err.message);
    const message = err.response?.data?.message || err.response?.data?.error || err.message;
    res.status(err.response?.status || 500).json({ error: message });
  }
});

// POST /api/enrich — Apollo People Bulk Match
app.post('/api/enrich', async (req, res) => {
  const { personIds } = req.body;

  if (!personIds?.length) {
    return res.status(400).json({ error: 'Se requiere un array personIds no vacío.' });
  }
  if (!process.env.APOLLO_API_KEY) {
    return res.status(500).json({ error: 'APOLLO_API_KEY no configurada en el servidor.' });
  }

  const CHUNK_SIZE = 10;
  const chunks = [];
  for (let i = 0; i < personIds.length; i += CHUNK_SIZE) {
    chunks.push(personIds.slice(i, i + CHUNK_SIZE));
  }

  try {
    const allMatches = [];
    for (const chunk of chunks) {
      const { data } = await axios.post(
        `${APOLLO_BASE}/people/bulk_match`,
        {
          details: chunk.map((id) => ({ id })),
          reveal_personal_emails: true,
          reveal_phone_number: true,
        },
        { headers: apolloHeaders() }
      );
      allMatches.push(...(data.matches || []));
    }

    const enriched = allMatches.map((p) => ({
      id: p.id,
      email: p.email || null,
      phone: p.sanitized_phone || null,
      emailStatus: p.email ? 'verified' : 'none',
    }));

    res.json({ enriched });
  } catch (err) {
    console.error('Apollo enrich error:', err.response?.data || err.message);
    const message = err.response?.data?.message || err.response?.data?.error || err.message;
    res.status(err.response?.status || 500).json({ error: message });
  }
});

// ─── Email endpoints ─────────────────────────────────────────────────────────

// GET /api/email-status — current daily count
app.get('/api/email-status', (req, res) => {
  const tracker = getTracker();
  res.json({ dailyCount: tracker.count, dailyLimit: DAILY_EMAIL_LIMIT });
});

// POST /api/send-email — send emails via GoDaddy SMTP (Nodemailer)
app.post('/api/send-email', async (req, res) => {
  const { contacts, subject, body } = req.body;

  if (!contacts?.length) {
    return res.status(400).json({ error: 'Se requieren contactos con email.' });
  }
  if (!subject?.trim()) {
    return res.status(400).json({ error: 'El asunto es obligatorio.' });
  }
  if (!body?.trim()) {
    return res.status(400).json({ error: 'El cuerpo del mensaje es obligatorio.' });
  }

  const missingSmtp = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter(
    (v) => !process.env[v]
  );
  if (missingSmtp.length) {
    return res.status(500).json({
      error: `Variables SMTP no configuradas en .env: ${missingSmtp.join(', ')}`,
    });
  }

  const tracker = getTracker();
  const remaining = DAILY_EMAIL_LIMIT - tracker.count;

  if (contacts.length > remaining) {
    return res.status(429).json({
      error: `Límite diario alcanzado. Podés enviar ${remaining} email${remaining !== 1 ? 's' : ''} más hoy (límite: ${DAILY_EMAIL_LIMIT}/día).`,
      dailyCount: tracker.count,
      dailyLimit: DAILY_EMAIL_LIMIT,
    });
  }

  const smtpPort = parseInt(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for SSL on 465, false for STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // GoDaddy SMTP compatibility
    },
  });

  const sent = [];
  const failed = [];

  for (const contact of contacts) {
    const personalizedBody = body
      .replace(/{nombre}/gi, contact.name || 'estimado/a')
      .replace(/{empresa}/gi, contact.company || '');

    // Convert plain text newlines to HTML paragraphs
    const htmlBody = personalizedBody
      .split('\n')
      .map((line) => (line.trim() ? `<p style="margin:0 0 12px">${line}</p>` : '<br>'))
      .join('');

    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Peanut Leads'}" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject,
        text: personalizedBody,
        html: htmlBody,
      });
      sent.push(contact.email);
      tracker.count++;
    } catch (err) {
      console.error(`Failed to send to ${contact.email}:`, err.message);
      failed.push({ email: contact.email, error: err.message });
    }
  }

  res.json({
    sent: sent.length,
    failed: failed.length,
    failedDetails: failed,
    dailyCount: tracker.count,
    dailyLimit: DAILY_EMAIL_LIMIT,
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Peanut Leads backend running on http://localhost:${PORT}`);
});
