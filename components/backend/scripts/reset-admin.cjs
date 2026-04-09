#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const usage = () => {
  console.log('Usage: node backend/scripts/reset-admin.cjs --email=<admin@email> --password=<strong_password>');
};

const getArg = (name) => {
  const prefix = `--${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : '';
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const email = normalizeEmail(getArg('email'));
const password = String(getArg('password') || '');

if (!email || !email.includes('@') || password.length < 12) {
  usage();
  console.error('Error: invalid --email or weak --password (min 12 chars).');
  process.exit(1);
}

const storePath = path.join(__dirname, '..', 'data', 'store.json');
if (!fs.existsSync(storePath)) {
  console.error(`Error: store file not found at ${storePath}`);
  process.exit(1);
}

let store;
try {
  store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
} catch (error) {
  console.error(`Error: unable to parse store.json (${error.message})`);
  process.exit(1);
}

if (!store || typeof store !== 'object' || !Array.isArray(store.users)) {
  console.error('Error: invalid store format (users array missing).');
  process.exit(1);
}

const nowIso = new Date().toISOString();
const target = store.users.find((user) => normalizeEmail(user?.email) === email);

if (target) {
  target.passwordHash = hashPassword(password);
  target.isAdmin = true;
  target.isSubscribed = true;
  target.manualVipAccess = true;
  target.needsOnboarding = false;
  target.subscriptionPlan = 'ADMIN';
  target.subscriptionStatus = 'ADMIN';
  target.subscriptionUpdatedAt = nowIso;
  target.emailVerified = true;
  target.emailVerifiedAt = nowIso;
  target.emailVerificationTokenHash = null;
  target.emailVerificationExpiresAt = null;
  target.authProviders = target.authProviders && typeof target.authProviders === 'object' ? target.authProviders : {};
  target.billing = target.billing && typeof target.billing === 'object' ? target.billing : { provider: 'NONE' };
} else {
  store.users.unshift({
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    isSubscribed: true,
    isAdmin: true,
    manualVipAccess: true,
    needsOnboarding: false,
    subscriptionPlan: 'ADMIN',
    subscriptionStatus: 'ADMIN',
    subscriptionUpdatedAt: nowIso,
    emailVerified: true,
    emailVerifiedAt: nowIso,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    authProviders: {},
    affiliateProfile: { isAffiliate: true, referralCode: 'ADMIN', referrals: [], commissionHistory: [] },
    billing: { provider: 'NONE' },
    createdAt: nowIso
  });
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log(`Admin account ready: ${email}`);
