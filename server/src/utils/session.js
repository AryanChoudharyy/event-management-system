import crypto from 'crypto';

const SESSION_COOKIE = 'eventflow_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'eventflow-dev-session-secret';

const base64url = (value) => Buffer.from(value).toString('base64url');

const sign = (payload) =>
  crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

export const createSessionToken = ({ id, role }) => {
  const payload = base64url(JSON.stringify({ id, role }));
  return `${payload}.${sign(payload)}`;
};

export const readSessionToken = (token) => {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

export const getCookie = (req, name) => {
  const cookies = req.headers.cookie?.split(';') || [];
  const found = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : null;
};

export const setSessionCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
};

export const sessionCookieName = SESSION_COOKIE;
