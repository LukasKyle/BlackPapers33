const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const parseBooleanEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const safeString = (value, max = 256) => String(value || '').trim().slice(0, max);
const parseIsoToMs = (value) => {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : null;
};
const isStrongBootstrapPassword = (password) => {
  const value = String(password || '');
  return value.length >= 14
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /[0-9]/.test(value)
    && /[^A-Za-z0-9]/.test(value);
};

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const APP_ENV = String(process.env.APP_ENV || process.env.NODE_ENV || 'development').trim().toLowerCase();
const IS_RENDER = String(process.env.RENDER || '').trim().toLowerCase() === 'true';
const IS_PRODUCTION_LIKE = APP_ENV === 'production' || APP_ENV === 'staging' || IS_RENDER;
const PUBLIC_APP_URL = safeString(process.env.PUBLIC_APP_URL || '', 512);
const BACKEND_PUBLIC_URL = safeString(process.env.BACKEND_PUBLIC_URL || '', 512);
const ADMIN_BOOTSTRAP_EMAIL = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || '');
const ADMIN_BOOTSTRAP_PASSWORD = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
const ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP = parseBooleanEnv(process.env.ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP, false);
const ALLOW_DEV_SUBSCRIPTION_STUB = parseBooleanEnv(process.env.ALLOW_DEV_SUBSCRIPTION_STUB, false);
const MAX_JSON_BODY_BYTES = Number(process.env.MAX_JSON_BODY_BYTES || 64 * 1024);
const SESSION_COOKIE_NAME = safeString(process.env.SESSION_COOKIE_NAME || 'bp_session', 64) || 'bp_session';
const SESSION_COOKIE_SECURE = parseBooleanEnv(process.env.SESSION_COOKIE_SECURE, IS_PRODUCTION_LIKE);
const SESSION_COOKIE_SAME_SITE = safeString(
  process.env.SESSION_COOKIE_SAME_SITE || (IS_PRODUCTION_LIKE ? 'None' : 'Lax'),
  16
) || 'Lax';
const SESSION_IDLE_TTL_HOURS = Number(process.env.SESSION_IDLE_TTL_HOURS || 12);
const SESSION_MAX_TTL_DAYS = Number(process.env.SESSION_MAX_TTL_DAYS || 14);
const SESSION_ROTATION_MINUTES = Number(process.env.SESSION_ROTATION_MINUTES || 30);
const SESSION_PERSISTENT_LOGIN = parseBooleanEnv(process.env.SESSION_PERSISTENT_LOGIN, false);
const PERSISTENT_SESSION_TTL_DAYS = Number(process.env.PERSISTENT_SESSION_TTL_DAYS || 3650);
const SESSION_TOKEN_SECRET = String(process.env.SESSION_TOKEN_SECRET || '').trim();
const SESSION_IDLE_TTL_MS = SESSION_IDLE_TTL_HOURS * 60 * 60 * 1000;
const SESSION_MAX_TTL_MS = SESSION_MAX_TTL_DAYS * 24 * 60 * 60 * 1000;
const PERSISTENT_SESSION_TTL_MS = PERSISTENT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const EFFECTIVE_SESSION_IDLE_TTL_MS = SESSION_PERSISTENT_LOGIN ? PERSISTENT_SESSION_TTL_MS : SESSION_IDLE_TTL_MS;
const EFFECTIVE_SESSION_MAX_TTL_MS = SESSION_PERSISTENT_LOGIN ? PERSISTENT_SESSION_TTL_MS : SESSION_MAX_TTL_MS;
const SESSION_ROTATION_MS = SESSION_ROTATION_MINUTES * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH || 10);
const RATE_LIMIT_MAX_PUBLIC_WRITE = Number(process.env.RATE_LIMIT_MAX_PUBLIC_WRITE || 20);
const RATE_LIMIT_MAX_SUBSCRIPTION = Number(process.env.RATE_LIMIT_MAX_SUBSCRIPTION || 20);
const RATE_LIMIT_MAX_ADMIN = Number(process.env.RATE_LIMIT_MAX_ADMIN || 120);
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const REQUIRE_EMAIL_VERIFIED = parseBooleanEnv(process.env.REQUIRE_EMAIL_VERIFIED, false);
const EMAIL_PROVIDER = safeString(process.env.EMAIL_PROVIDER || 'console', 24).toLowerCase();
const EMAIL_FROM = safeString(process.env.EMAIL_FROM || 'Black Papers <no-reply@blackpapers.local>', 256);
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const EMAIL_VERIFY_TOKEN_TTL_HOURS = Number(process.env.EMAIL_VERIFY_TOKEN_TTL_HOURS || 24);
const PASSWORD_RESET_TOKEN_TTL_HOURS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_HOURS || 2);
const EMAIL_TOKEN_SECRET = String(process.env.EMAIL_TOKEN_SECRET || '').trim();
const HUBSPOT_PORTAL_ID = safeString(process.env.HUBSPOT_PORTAL_ID || '', 64);
const HUBSPOT_SIGNUP_FORM_GUID = safeString(process.env.HUBSPOT_SIGNUP_FORM_GUID || '', 128);
const HUBSPOT_PRIVATE_APP_TOKEN = String(
  process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN || ''
).trim();
const HUBSPOT_SYNC_TIMEOUT_MS = Number(process.env.HUBSPOT_SYNC_TIMEOUT_MS || 8000);
const HUBSPOT_SIGNUP_SYNC_ENABLED = Boolean(HUBSPOT_PORTAL_ID && HUBSPOT_SIGNUP_FORM_GUID);
const OAUTH_STATE_TTL_MINUTES = Number(process.env.OAUTH_STATE_TTL_MINUTES || 10);
const OAUTH_GOOGLE_CLIENT_ID = safeString(process.env.OAUTH_GOOGLE_CLIENT_ID || '', 256);
const OAUTH_GOOGLE_CLIENT_SECRET = String(process.env.OAUTH_GOOGLE_CLIENT_SECRET || '').trim();
const OAUTH_FACEBOOK_CLIENT_ID = safeString(process.env.OAUTH_FACEBOOK_CLIENT_ID || '', 256);
const OAUTH_FACEBOOK_CLIENT_SECRET = String(process.env.OAUTH_FACEBOOK_CLIENT_SECRET || '').trim();
const OAUTH_LINKEDIN_CLIENT_ID = safeString(process.env.OAUTH_LINKEDIN_CLIENT_ID || '', 256);
const OAUTH_LINKEDIN_CLIENT_SECRET = String(process.env.OAUTH_LINKEDIN_CLIENT_SECRET || '').trim();
const OAUTH_APPLE_CLIENT_ID = safeString(process.env.OAUTH_APPLE_CLIENT_ID || '', 256);
const OAUTH_APPLE_TEAM_ID = safeString(process.env.OAUTH_APPLE_TEAM_ID || '', 64);
const OAUTH_APPLE_KEY_ID = safeString(process.env.OAUTH_APPLE_KEY_ID || '', 64);
const OAUTH_APPLE_PRIVATE_KEY_BASE64 = String(process.env.OAUTH_APPLE_PRIVATE_KEY_BASE64 || '').trim();
const LEMON_SQUEEZY_API_KEY = String(process.env.LEMON_SQUEEZY_API_KEY || '').trim();
const LEMON_SQUEEZY_STORE_ID = safeString(process.env.LEMON_SQUEEZY_STORE_ID || '', 64);
const LEMON_SQUEEZY_WEBHOOK_SECRET = String(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '').trim();
const LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL = safeString(process.env.LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL || '', 512);
const LEMON_SQUEEZY_CHECKOUT_CANCEL_URL = safeString(process.env.LEMON_SQUEEZY_CHECKOUT_CANCEL_URL || '', 512);
const LEMON_VARIANT_ID_BOURSE = safeString(process.env.LEMON_VARIANT_ID_BOURSE || '', 64);
const LEMON_VARIANT_ID_CRYPTO = safeString(process.env.LEMON_VARIANT_ID_CRYPTO || '', 64);
const LEMON_VARIANT_ID_COMBO = safeString(process.env.LEMON_VARIANT_ID_COMBO || '', 64);
const LEMON_CHECKOUT_URL_BOURSE = safeString(process.env.LEMON_CHECKOUT_URL_BOURSE || '', 1024);
const LEMON_CHECKOUT_URL_CRYPTO = safeString(process.env.LEMON_CHECKOUT_URL_CRYPTO || '', 1024);
const LEMON_CHECKOUT_URL_COMBO = safeString(process.env.LEMON_CHECKOUT_URL_COMBO || '', 1024);
const LEMON_AFFILIATE_EXTERNAL_ENABLED = parseBooleanEnv(process.env.LEMON_AFFILIATE_EXTERNAL_ENABLED, false);
const PLAN_PRICE_BOURSE_EUR = Number(process.env.PLAN_PRICE_BOURSE_EUR || 29);
const PLAN_PRICE_CRYPTO_EUR = Number(process.env.PLAN_PRICE_CRYPTO_EUR || 29);
const PLAN_PRICE_COMBO_EUR = Number(process.env.PLAN_PRICE_COMBO_EUR || 49);
const AFFILIATE_CRYPTO_COMMISSION_RATE = Number(process.env.AFFILIATE_CRYPTO_COMMISSION_RATE || 0.5);
const STORE_DIR_MODE = 0o700;
const STORE_FILE_MODE = 0o600;
const CORS_ALLOWED_ORIGINS = String(ORIGIN || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const DEFAULT_PUBLIC_APP_URL = CORS_ALLOWED_ORIGINS.includes('*')
  ? 'http://localhost:5173'
  : (CORS_ALLOWED_ORIGINS[0] || 'http://localhost:5173');
const EFFECTIVE_PUBLIC_APP_URL = PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL;
const EFFECTIVE_BACKEND_PUBLIC_URL = BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;
const EFFECTIVE_LEMON_CHECKOUT_SUCCESS_URL = LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL || `${EFFECTIVE_PUBLIC_APP_URL}?checkout=success`;
const EFFECTIVE_LEMON_CHECKOUT_CANCEL_URL = LEMON_SQUEEZY_CHECKOUT_CANCEL_URL || `${EFFECTIVE_PUBLIC_APP_URL}?checkout=cancel`;
const LEMON_VARIANT_ID_BY_PLAN = {
  bourse: LEMON_VARIANT_ID_BOURSE,
  crypto: LEMON_VARIANT_ID_CRYPTO,
  combo: LEMON_VARIANT_ID_COMBO
};
const LEMON_CHECKOUT_URL_BY_PLAN = {
  bourse: LEMON_CHECKOUT_URL_BOURSE,
  crypto: LEMON_CHECKOUT_URL_CRYPTO,
  combo: LEMON_CHECKOUT_URL_COMBO
};
const LEMON_PLAN_BY_VARIANT_ID = Object.entries(LEMON_VARIANT_ID_BY_PLAN).reduce((acc, [plan, variantId]) => {
  if (variantId) acc[variantId] = plan;
  return acc;
}, {});
const LEMON_API_MODE = LEMON_SQUEEZY_API_KEY && LEMON_SQUEEZY_STORE_ID ? 'api' : 'url';
const rateLimitBuckets = new Map();
const oauthStateStore = new Map();
let nextRateLimitCleanupAt = 0;
const resolveSessionTokenSecret = () => {
  if (SESSION_TOKEN_SECRET) {
    return SESSION_TOKEN_SECRET;
  }
  if (IS_PRODUCTION_LIKE) {
    throw new Error('SESSION_TOKEN_SECRET is required in production/staging.');
  }
  const generated = crypto.randomBytes(48).toString('hex');
  console.warn('[SECURITY] SESSION_TOKEN_SECRET missing in local env. Generated ephemeral secret for this process only.');
  return generated;
};
const EFFECTIVE_SESSION_TOKEN_SECRET = resolveSessionTokenSecret();
const EFFECTIVE_EMAIL_TOKEN_SECRET = EMAIL_TOKEN_SECRET || EFFECTIVE_SESSION_TOKEN_SECRET;

const CONTENT_TYPES = new Set(['VIDEO', 'TRADE_SIGNAL', 'PORTFOLIO_UPDATE', 'ARTICLE']);
const REVIEW_STATUSES = new Set(['APPROVED', 'PENDING', 'REJECTED']);
const POST_PUBLICATION_STATUS = new Set(['DRAFT', 'PUBLISHED']);
const SUBSCRIPTION_PLANS = new Set(['crypto', 'bourse', 'combo']);
const SUBSCRIPTION_STATUS = new Set(['NONE', 'PENDING_VERIFICATION', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'ADMIN']);
const USER_SUBSCRIPTION_PLANS = new Set(['none', 'crypto', 'bourse', 'combo']);
const LEAD_STATUSES = new Set(['LEAD', 'REGISTERED', 'VIP_ACTIVE', 'ARCHIVED']);
const TRADE_MARKETS = new Set(['CRYPTO', 'BOURSE']);
const RSS_CACHE_TTL_MS = 15 * 60 * 1000;
const RSS_REQUEST_TIMEOUT_MS = Number(process.env.RSS_REQUEST_TIMEOUT_MS || 8000);
const MARKET_CACHE_TTL_MS = Number(process.env.MARKET_CACHE_TTL_MS || 60 * 1000);
const MARKET_REQUEST_TIMEOUT_MS = Number(process.env.MARKET_REQUEST_TIMEOUT_MS || 8000);
const VIP_ACTIVITY_WINDOW_MINUTES = Number(process.env.VIP_ACTIVITY_WINDOW_MINUTES || 15);
const X_FEED_MAX_ACCOUNTS = 40;
const TRADE_SNAPSHOT_LIMIT = 730;
const TRADE_SNAPSHOT_SUMMARY_LIMIT = 365;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_REGEX = /^\d{4}-\d{2}$/;
const STOCK_WATCHLIST = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'NFLX', name: 'Netflix' },
];
const CRYPTO_WATCHLIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
];
const GOOGLE_NEWS_RSS_SOURCES = [
  {
    name: 'Bloomberg',
    url: 'https://news.google.com/rss/search?q=site%3Abloomberg.com%20markets&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'BFM Business',
    url: 'https://news.google.com/rss/search?q=site%3Abfmbusiness.bfmtv.com&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'Les Echos',
    url: 'https://news.google.com/rss/search?q=site%3Alesechos.fr%20finance&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'Forbes',
    url: 'https://news.google.com/rss/search?q=site%3Aforbes.com%20finance&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'Yahoo Finance',
    url: 'https://news.google.com/rss/search?q=site%3Afinance.yahoo.com&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'Reuters',
    url: 'https://news.google.com/rss/search?q=site%3Areuters.com%20markets&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'CNBC',
    url: 'https://news.google.com/rss/search?q=site%3Acnbc.com%20markets&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'Investing.com',
    url: 'https://news.google.com/rss/search?q=site%3Ainvesting.com%20markets&hl=fr&gl=FR&ceid=FR%3Afr'
  },
  {
    name: 'CoinDesk',
    url: 'https://news.google.com/rss/search?q=site%3Acoindesk.com&hl=fr&gl=FR&ceid=FR%3Afr'
  }
];
let rssCache = {
  timestamp: 0,
  items: []
};
let stockQuotesCache = {
  timestamp: 0,
  mode: 'fallback',
  source: 'mock',
  quotes: []
};
let cryptoTickerCache = {
  timestamp: 0,
  mode: 'fallback',
  source: 'mock',
  items: []
};
const stockSparklineMemory = new Map();
const FALLBACK_MARKET_TICKER = {
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 68420, changePercent: 1.24 },
    { symbol: 'ETH', name: 'Ethereum', price: 3522, changePercent: 0.91 },
    { symbol: 'SOL', name: 'Solana', price: 148.3, changePercent: -0.41 },
    { symbol: 'XRP', name: 'XRP', price: 0.67, changePercent: 0.66 },
  ],
  stocks: [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 544.21, changePercent: 0.38 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 472.13, changePercent: 0.44 },
    { symbol: 'AAPL', name: 'Apple', price: 214.38, changePercent: 1.01 },
    { symbol: 'MSFT', name: 'Microsoft', price: 468.22, changePercent: 0.94 },
  ]
};
const DEFAULT_X_FEED_ACCOUNTS = [
  {
    id: 'x-fedwatch',
    name: 'Kobeissi Letter',
    handle: 'KobeissiLetter',
    focus: 'Macro / Equities',
    url: 'https://x.com/KobeissiLetter'
  },
  {
    id: 'x-bloomberg',
    name: 'Bloomberg Markets',
    handle: 'markets',
    focus: 'Markets News',
    url: 'https://x.com/markets'
  },
  {
    id: 'x-wsj',
    name: 'WSJ Markets',
    handle: 'WSJmarkets',
    focus: 'US Markets',
    url: 'https://x.com/WSJmarkets'
  },
  {
    id: 'x-coindesk',
    name: 'CoinDesk',
    handle: 'CoinDesk',
    focus: 'Crypto News',
    url: 'https://x.com/CoinDesk'
  },
  {
    id: 'x-theblock',
    name: 'The Block',
    handle: 'TheBlock__',
    focus: 'Crypto / Policy',
    url: 'https://x.com/TheBlock__'
  },
  {
    id: 'x-watcherguru',
    name: 'Watcher.Guru',
    handle: 'WatcherGuru',
    focus: 'Crypto / Macro Headlines',
    url: 'https://x.com/WatcherGuru'
  }
];
const FALLBACK_NEWS_FEED_ITEMS = [
  {
    id: 'fallback-bloomberg-1',
    source: 'Bloomberg',
    title: 'Les desks surveillent un dollar plus fragile avant les prochaines statistiques macro',
    url: 'https://www.bloomberg.com/',
    summary: 'Le flux reste prudent sur les actifs a risque, avec un biais plus constructif si le dollar continue de respirer.',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'fallback-bfm-1',
    source: 'BFM Business',
    title: 'Les marches europeens temporisent avant les annonces de banques centrales',
    url: 'https://www.bfmtv.com/economie/',
    summary: 'Les investisseurs restent selectifs sur les dossiers cycliques et privilegient les points d entree plus propres.',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'fallback-lesechos-1',
    source: 'Les Echos',
    title: 'Inflation, taux et actions: les niveaux a surveiller cette semaine',
    url: 'https://www.lesechos.fr/finance-marches',
    summary: 'Le marche attend surtout des confirmations macro avant d etendre franchement le mouvement.',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'fallback-forbes-1',
    source: 'Forbes',
    title: 'Pourquoi la gestion du risque reste le vrai moteur des performances durables',
    url: 'https://www.forbes.com/',
    summary: 'Le contexte rappelle qu une bonne execution vaut souvent plus qu une opinion brillante sans plan.',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'fallback-reuters-1',
    source: 'Reuters',
    title: 'Les traders reduisent leur exposition avant une session potentiellement volatile',
    url: 'https://www.reuters.com/markets/',
    summary: 'L attention se porte sur la liquidite, les rendements obligataires et les annonces de fin de session.',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
];
const MOCK_DAILY_TRADES = [
  { actif: 'EUR/USD', market: 'BOURSE', direction: 'Long', entree: 1.0850, sl: 1.0820, tp: 1.0920, taille: '1%', raison: 'RSI >50 + support 1.0840', heure: '2026-03-19 08:00' },
  { actif: 'BTC/USDT', market: 'CRYPTO', direction: 'Short', entree: 68420, sl: 69100, tp: 66800, taille: '0.75%', raison: 'Rejet resistance H1 + divergence baissiere', heure: '2026-03-19 09:20' },
  { actif: 'XAU/USD', market: 'BOURSE', direction: 'Long', entree: 3025.5, sl: 3013.2, tp: 3044.8, taille: '1.25%', raison: 'Breakout Londres + momentum sur l or', heure: '2026-03-19 10:05' },
  { actif: 'NAS100', market: 'BOURSE', direction: 'Long', entree: 20145, sl: 20040, tp: 20380, taille: '0.5%', raison: 'Reclaim VWAP + flux risk-on pre-open US', heure: '2026-03-19 14:35' },
];

const MOCK_MARKET_ANALYSIS = `## Biais du jour

- Le dollar ralentit legerement, ce qui soutient les actifs a risque.
- Le flux reste propre seulement sur retest et non sur poursuite impulsive.
- Les publications macro US de fin de session peuvent elargir fortement la volatilite.

## Zones a surveiller

- EUR/USD: 1.0840 comme zone pivot.
- BTC: 69k comme zone de liquidite vendeuse.
- Gold: momentum haussier conserve au-dessus de 3013.

## Discipline execution

- Ne pas chasser un move deja parti.
- Baisser la taille si le spread s elargit.
- Stop loss obligatoire sur chaque signal.
`;
const MOCK_MARKET_ANALYSIS_BOURSE = `## Biais Bourse du jour

- Les indices restent sensibles aux publications macro et aux taux US.
- On privilégie les entrées propres sur niveaux techniques, sans poursuite impulsive.
- La gestion du risque reste stricte : invalidation claire avant chaque exécution.
`;
const MOCK_MARKET_ANALYSIS_CRYPTO = `## Biais Crypto du jour

- BTC reste le baromètre principal de la session.
- Les alts sont plus volatiles : taille réduite si le spread s'élargit.
- Pas d'entrée sans plan clair (niveau d'invalidation + objectifs définis).
`;

const defaultDailyTrades = () => MOCK_DAILY_TRADES.map((trade) => ({ ...trade }));
const defaultMarketAnalysis = () => MOCK_MARKET_ANALYSIS;
const defaultMarketAnalyses = () => ({
  bourse: MOCK_MARKET_ANALYSIS_BOURSE,
  crypto: MOCK_MARKET_ANALYSIS_CRYPTO
});
const defaultTradeSnapshots = () => {
  const trades = defaultDailyTrades();
  const marketAnalysis = defaultMarketAnalysis();
  const marketAnalyses = defaultMarketAnalyses();
  const nowIso = new Date().toISOString();
  const firstTradeDate = String(trades[0]?.heure || '').match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  const dateKey = DATE_KEY_REGEX.test(firstTradeDate) ? firstTradeDate : nowIso.slice(0, 10);
  return [
    {
      id: `snapshot-${dateKey}-seed`,
      dateKey,
      monthKey: dateKey.slice(0, 7),
      publishedAt: nowIso,
      source: 'seed',
      trades,
      marketAnalysis,
      marketAnalyses
    }
  ];
};
const defaultXFeedAccounts = () => DEFAULT_X_FEED_ACCOUNTS.map((entry) => ({ ...entry }));
const defaultXFeed = () => ({
  mode: 'curated_manual',
  updatedAt: new Date().toISOString(),
  accounts: defaultXFeedAccounts()
});
const defaultLeads = () => ([]);
const defaultBillingProfile = () => ({
  provider: 'NONE',
  lemonCustomerId: null,
  lemonSubscriptionId: null,
  lemonOrderId: null,
  lemonVariantId: null,
  lemonProductId: null,
  lemonProductName: null,
  checkoutUrl: null,
  checkoutStartedAt: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  canceledAt: null,
  lastWebhookEvent: null,
  lastWebhookAt: null,
  lastPaidAmount: null,
  lastPaidCurrency: null,
  lastPaymentAt: null,
  lastPaymentChannel: null,
  lastAffiliateCommissionEventKey: null
});
const normalizeLeadStatus = (value) => {
  const normalized = safeString(value, 32).toUpperCase();
  return LEAD_STATUSES.has(normalized) ? normalized : 'LEAD';
};
const defaultLeadRecord = (email, source = 'unknown') => ({
  id: `lead-${crypto.randomUUID()}`,
  email: normalizeEmail(email),
  source: safeString(source, 64) || 'unknown',
  status: 'LEAD',
  userId: null,
  referralCode: null,
  referralOwnerEmail: null,
  subscriptionPlan: 'NONE',
  subscriptionStatus: 'NONE',
  lastEvent: 'captured',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
const sanitizeLeadRecordForStore = (lead, index = 0) => {
  const email = normalizeEmail(lead?.email);
  if (!email || !email.includes('@')) return null;
  const createdAt = safeString(lead?.createdAt, 64) || new Date().toISOString();
  const updatedAt = safeString(lead?.updatedAt, 64) || createdAt;
  return {
    id: safeString(lead?.id, 128) || `lead-${index + 1}-${crypto.randomUUID()}`,
    email,
    source: safeString(lead?.source, 64) || 'unknown',
    status: normalizeLeadStatus(lead?.status),
    userId: safeString(lead?.userId, 128) || null,
    referralCode: safeString(lead?.referralCode, 32) || null,
    referralOwnerEmail: normalizeEmail(lead?.referralOwnerEmail || '') || null,
    subscriptionPlan: normalizeSubscriptionPlan(lead?.subscriptionPlan, false),
    subscriptionStatus: normalizeSubscriptionStatus(lead?.subscriptionStatus, false),
    lastEvent: safeString(lead?.lastEvent, 80) || 'captured',
    createdAt,
    updatedAt
  };
};
const normalizeBillingProfile = (billing) => {
  const source = billing && typeof billing === 'object' && !Array.isArray(billing) ? billing : {};
  const parsedLastPaidAmount = Number(source.lastPaidAmount);
  const normalizedLastPaidAmount = Number.isFinite(parsedLastPaidAmount) && parsedLastPaidAmount > 0
    ? Number(parsedLastPaidAmount.toFixed(2))
    : null;
  const normalizedLastPaidCurrency = safeString(source.lastPaidCurrency, 12)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8);
  const normalizedLastPaymentChannel = safeString(source.lastPaymentChannel, 32).toUpperCase();
  return {
    provider: ['NONE', 'LEMON_SQUEEZY', 'MANUAL'].includes(String(source.provider || '').toUpperCase())
      ? String(source.provider || '').toUpperCase()
      : 'NONE',
    lemonCustomerId: safeString(source.lemonCustomerId, 128) || null,
    lemonSubscriptionId: safeString(source.lemonSubscriptionId, 128) || null,
    lemonOrderId: safeString(source.lemonOrderId, 128) || null,
    lemonVariantId: safeString(source.lemonVariantId, 128) || null,
    lemonProductId: safeString(source.lemonProductId, 128) || null,
    lemonProductName: safeString(source.lemonProductName, 160) || null,
    checkoutUrl: safeString(source.checkoutUrl, 1024) || null,
    checkoutStartedAt: safeString(source.checkoutStartedAt, 64) || null,
    currentPeriodStart: safeString(source.currentPeriodStart, 64) || null,
    currentPeriodEnd: safeString(source.currentPeriodEnd, 64) || null,
    canceledAt: safeString(source.canceledAt, 64) || null,
    lastWebhookEvent: safeString(source.lastWebhookEvent, 80) || null,
    lastWebhookAt: safeString(source.lastWebhookAt, 64) || null,
    lastPaidAmount: normalizedLastPaidAmount,
    lastPaidCurrency: normalizedLastPaidCurrency || null,
    lastPaymentAt: safeString(source.lastPaymentAt, 64) || null,
    lastPaymentChannel: ['CRYPTO_MANUAL', 'CARD_AUTO', 'UNKNOWN'].includes(normalizedLastPaymentChannel)
      ? normalizedLastPaymentChannel
      : null,
    lastAffiliateCommissionEventKey: safeString(source.lastAffiliateCommissionEventKey, 191) || null
  };
};
const sanitizeXFeedAccountForStore = (entry, index = 0) => {
  const name = safeString(entry?.name, 80);
  const handle = safeString(entry?.handle, 80).replace(/^@+/, '');
  const focus = safeString(entry?.focus, 120);
  const rawUrl = safeString(entry?.url, 2048);
  const url = isValidHttpUrl(rawUrl) ? rawUrl : (handle ? `https://x.com/${handle}` : '');
  if (!name || !handle || !url) return null;
  const id = safeString(entry?.id, 120) || `x-${handle.toLowerCase()}-${index + 1}`;
  return { id, name, handle, focus, url };
};

const MOCK_STOCK_QUOTES = [
  { symbol: 'AAPL', name: 'Apple', price: 214.38, change: 2.14, changePercent: 1.01, volume: '58.4M', marketCap: '3.2T', sparkline: [206, 208, 207, 210, 211, 213, 214] },
  { symbol: 'MSFT', name: 'Microsoft', price: 468.22, change: 4.35, changePercent: 0.94, volume: '21.7M', marketCap: '3.5T', sparkline: [454, 456, 458, 460, 463, 466, 468] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 142.91, change: -1.74, changePercent: -1.20, volume: '132.8M', marketCap: '3.4T', sparkline: [148, 147, 146, 145, 144, 143, 142] },
  { symbol: 'AMZN', name: 'Amazon', price: 201.44, change: 1.89, changePercent: 0.95, volume: '39.5M', marketCap: '2.1T', sparkline: [195, 196, 197, 198, 199, 200, 201] },
  { symbol: 'META', name: 'Meta', price: 611.73, change: 7.11, changePercent: 1.18, volume: '16.3M', marketCap: '1.6T', sparkline: [592, 595, 598, 602, 605, 608, 611] },
  { symbol: 'TSLA', name: 'Tesla', price: 188.67, change: -3.42, changePercent: -1.78, volume: '96.4M', marketCap: '601B', sparkline: [198, 196, 194, 193, 191, 190, 188] },
  { symbol: 'GOOGL', name: 'Alphabet', price: 174.05, change: 0.82, changePercent: 0.47, volume: '27.9M', marketCap: '2.1T', sparkline: [169, 170, 171, 171, 172, 173, 174] },
  { symbol: 'NFLX', name: 'Netflix', price: 997.84, change: 11.5, changePercent: 1.17, volume: '4.2M', marketCap: '430B', sparkline: [955, 962, 968, 975, 982, 990, 997] },
];

const isValidHttpUrl = (raw) => {
  try {
    const parsed = new URL(String(raw || ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeSubscriptionPlan = (value, allowAdmin = false) => {
  const plan = safeString(value, 32).toLowerCase();
  if (allowAdmin && plan === 'admin') return 'ADMIN';
  if (USER_SUBSCRIPTION_PLANS.has(plan) && plan !== 'none') return plan;
  return 'NONE';
};

const normalizeSubscriptionStatus = (value, isAdmin = false) => {
  if (isAdmin) return 'ADMIN';
  const status = safeString(value, 64).toUpperCase();
  if (SUBSCRIPTION_STATUS.has(status) && status !== 'ADMIN') {
    return status;
  }
  return 'NONE';
};

const sanitizeReferralCode = (value) => safeString(value, 32).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
const roundCurrencyAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Number(numeric.toFixed(2));
};
const parsePositiveCurrencyAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 1_000_000) return null;
  return Number(numeric.toFixed(2));
};
const sanitizeCurrencyCode = (value, fallback = 'EUR') => {
  const normalized = safeString(value, 12)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8);
  return normalized || fallback;
};
const resolvePlanReferencePriceEur = (planRaw) => {
  const plan = normalizeSubscriptionPlan(planRaw, false);
  if (plan === 'bourse') return PLAN_PRICE_BOURSE_EUR;
  if (plan === 'crypto') return PLAN_PRICE_CRYPTO_EUR;
  if (plan === 'combo') return PLAN_PRICE_COMBO_EUR;
  return 0;
};
const resolveReferralCommissionModel = (billingProvider) => {
  if (billingProvider === 'MANUAL') return 'CRYPTO_50_PERCENT_MANUAL';
  if (billingProvider === 'LEMON_SQUEEZY') {
    return LEMON_AFFILIATE_EXTERNAL_ENABLED ? 'LEMON_AFFILIATE_EXTERNAL' : 'LEMON_CARD_INTERNAL_DISABLED';
  }
  return 'NONE';
};
const resolveReferralPaymentChannel = (billingProfile) => {
  const channel = safeString(billingProfile?.lastPaymentChannel, 32).toUpperCase();
  if (['CRYPTO_MANUAL', 'CARD_AUTO', 'UNKNOWN'].includes(channel)) return channel;
  const provider = safeString(billingProfile?.provider, 32).toUpperCase();
  if (provider === 'MANUAL') return 'CRYPTO_MANUAL';
  if (provider === 'LEMON_SQUEEZY') return 'CARD_AUTO';
  return 'UNKNOWN';
};
const resolveReferralPaidAmount = (referredUser, billingProfile) => {
  const directAmount = parsePositiveCurrencyAmount(billingProfile?.lastPaidAmount);
  if (directAmount !== null) return directAmount;
  return roundCurrencyAmount(resolvePlanReferencePriceEur(referredUser?.subscriptionPlan));
};
const buildAffiliateCommissionEventKey = (referredUser, options = {}) => {
  const billing = normalizeBillingProfile(referredUser?.billing);
  const explicitEventKey = safeString(options?.eventKey, 191);
  if (explicitEventKey) return explicitEventKey;
  const anchorDate = safeString(
    billing.lastPaymentAt
      || referredUser?.subscriptionUpdatedAt
      || referredUser?.billing?.lastWebhookAt
      || referredUser?.createdAt,
    64
  ) || new Date().toISOString();
  const normalizedPlan = normalizeSubscriptionPlan(referredUser?.subscriptionPlan, false);
  const amount = resolveReferralPaidAmount(referredUser, billing);
  const source = safeString(options?.source, 48) || 'unknown';
  const userId = safeString(referredUser?.id, 128) || normalizeEmail(referredUser?.email || '');
  return safeString(`${source}:${userId}:${normalizedPlan}:${amount.toFixed(2)}:${anchorDate}`, 191);
};
const shouldAffiliateFollowUp = (referredUser, billingProvider) => {
  if (billingProvider !== 'MANUAL') return false;
  const status = normalizeSubscriptionStatus(referredUser?.subscriptionStatus, Boolean(referredUser?.isAdmin));
  return status !== 'ACTIVE';
};

const ensureUserReferralCode = (store, user, forceRegenerate = false) => {
  if (!user || typeof user !== 'object') return '';
  if (!user.affiliateProfile || typeof user.affiliateProfile !== 'object' || Array.isArray(user.affiliateProfile)) {
    user.affiliateProfile = defaultAffiliateProfile(user.email, Boolean(user.isAdmin));
  }

  const takenCodes = new Set(
    (Array.isArray(store?.users) ? store.users : [])
      .filter((candidate) => candidate && candidate.id !== user.id)
      .map((candidate) => sanitizeReferralCode(candidate?.affiliateProfile?.referralCode))
      .filter(Boolean)
  );

  const existingCode = forceRegenerate ? '' : sanitizeReferralCode(user.affiliateProfile.referralCode);
  if (existingCode && !takenCodes.has(existingCode)) {
    user.affiliateProfile.referralCode = existingCode;
    return existingCode;
  }

  const localPart = normalizeEmail(user.email).split('@')[0] || 'membre';
  const base = sanitizeReferralCode(localPart).slice(0, 12) || 'MEMBRE';
  const userSeed = safeString(user.id, 64).replace(/[^a-z0-9]/gi, '').toUpperCase();

  let attempt = 0;
  while (attempt < 128) {
    const suffix = crypto
      .createHash('sha256')
      .update(`${user.id}:${user.email}:${attempt}:${userSeed}`)
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();
    const candidate = sanitizeReferralCode(`${base}-${suffix}`).slice(0, 32);
    if (candidate && !takenCodes.has(candidate)) {
      user.affiliateProfile.referralCode = candidate;
      return candidate;
    }
    attempt += 1;
  }

  const fallback = sanitizeReferralCode(`${base}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).slice(0, 32) || `AFF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  user.affiliateProfile.referralCode = fallback;
  return fallback;
};

const findAffiliateOwnerByCode = (store, rawReferralCode) => {
  const referralCode = sanitizeReferralCode(rawReferralCode);
  if (!referralCode) return null;
  const users = Array.isArray(store?.users) ? store.users : [];
  return users.find((candidate) => sanitizeReferralCode(candidate?.affiliateProfile?.referralCode) === referralCode) || null;
};

const buildAffiliateReferralUrl = (referralCode) => {
  const safeCode = sanitizeReferralCode(referralCode);
  const base = EFFECTIVE_PUBLIC_APP_URL.replace(/\/+$/, '');
  if (!safeCode || !base) return '';
  return `${base}/?ref=${encodeURIComponent(safeCode)}`;
};

const isCancellationGracePeriodActive = (user, nowMs = Date.now()) => {
  if (!user || typeof user !== 'object') return false;
  const status = normalizeSubscriptionStatus(user.subscriptionStatus, Boolean(user.isAdmin));
  if (status !== 'CANCELED') return false;
  const periodEndMs = parseIsoToMs(user?.billing?.currentPeriodEnd);
  return periodEndMs !== null && periodEndMs > nowMs;
};

const resolveSubscriptionAccessEndsAt = (user, nowMs = Date.now()) => {
  if (!user || typeof user !== 'object') return null;
  if (Boolean(user.isAdmin) || Boolean(user.manualVipAccess)) return null;
  const status = normalizeSubscriptionStatus(user.subscriptionStatus, Boolean(user.isAdmin));
  const periodEnd = safeString(user?.billing?.currentPeriodEnd, 64) || null;
  const periodEndMs = parseIsoToMs(periodEnd);
  if (status === 'CANCELED' && periodEndMs !== null && periodEndMs > nowMs) {
    return new Date(periodEndMs).toISOString();
  }
  if (status === 'ACTIVE' || status === 'PAST_DUE') {
    return periodEndMs !== null ? new Date(periodEndMs).toISOString() : periodEnd;
  }
  return null;
};

const ensureSubscriptionStartedAt = (user, fallbackIso = new Date().toISOString()) => {
  if (!user || typeof user !== 'object') return;
  if (Boolean(user.isAdmin)) {
    user.subscriptionStartedAt = user.subscriptionStartedAt || user.createdAt || fallbackIso;
    return;
  }
  const plan = normalizeSubscriptionPlan(user.subscriptionPlan, false);
  if (plan === 'NONE') {
    user.subscriptionStartedAt = null;
    return;
  }
  if (!safeString(user.subscriptionStartedAt, 64)) {
    user.subscriptionStartedAt = user.createdAt || fallbackIso;
  }
};

const inferTradeMarketFromAsset = (actif) => {
  const symbol = safeString(actif, 32).toUpperCase();
  if (!symbol) return 'BOURSE';
  if (
    symbol.includes('BTC')
    || symbol.includes('ETH')
    || symbol.includes('USDT')
    || symbol.includes('SOL')
    || symbol.includes('XRP')
    || symbol.includes('ADA')
    || symbol.includes('BNB')
  ) {
    return 'CRYPTO';
  }
  return 'BOURSE';
};

const normalizeTradeMarket = (value, actif) => {
  const market = safeString(value, 16).toUpperCase();
  if (TRADE_MARKETS.has(market)) return market;
  return inferTradeMarketFromAsset(actif);
};

const inferSignalMarketFromPost = (post) => {
  if (!post || typeof post !== 'object') return 'BOURSE';
  const explicitMarket = safeString(post.market || post.signalMarket, 16).toUpperCase();
  if (TRADE_MARKETS.has(explicitMarket)) return explicitMarket;

  const tradeAsset = safeString(post.tradeDetails?.asset, 64);
  if (tradeAsset) {
    return inferTradeMarketFromAsset(tradeAsset);
  }

  const tagsText = Array.isArray(post.tags)
    ? post.tags.map((tag) => safeString(tag, 32)).join(' ')
    : safeString(post.tags, 256);
  const searchable = `${safeString(post.title, 160)} ${safeString(post.excerpt, 320)} ${tagsText}`.toUpperCase();
  if (/(BTC|ETH|USDT|SOL|XRP|ADA|BNB|CRYPTO|COIN|ALTCOIN)/.test(searchable)) {
    return 'CRYPTO';
  }
  return 'BOURSE';
};

const normalizeAuthProviders = (rawProviders) => {
  if (!rawProviders || typeof rawProviders !== 'object' || Array.isArray(rawProviders)) {
    return {};
  }
  const nextProviders = {};
  for (const [provider, providerUserId] of Object.entries(rawProviders)) {
    const normalizedProvider = safeString(provider, 24).toLowerCase();
    const normalizedProviderUserId = safeString(providerUserId, 191);
    if (!normalizedProvider || !normalizedProviderUserId) continue;
    if (!['google', 'facebook', 'linkedin', 'apple'].includes(normalizedProvider)) continue;
    nextProviders[normalizedProvider] = normalizedProviderUserId;
  }
  return nextProviders;
};

const lemonPlanVariantId = (plan) => LEMON_VARIANT_ID_BY_PLAN[safeString(plan, 32).toLowerCase()] || '';
const lemonPlanCheckoutUrl = (plan) => LEMON_CHECKOUT_URL_BY_PLAN[safeString(plan, 32).toLowerCase()] || '';
const isLemonPlanConfigured = (plan) => {
  const normalizedPlan = safeString(plan, 32).toLowerCase();
  return Boolean(lemonPlanVariantId(normalizedPlan) || lemonPlanCheckoutUrl(normalizedPlan));
};
const resolveLemonIntegrationState = () => ({
  mode: LEMON_API_MODE === 'api' ? 'api' : 'url',
  apiEnabled: Boolean(LEMON_SQUEEZY_API_KEY && LEMON_SQUEEZY_STORE_ID),
  webhookEnabled: Boolean(LEMON_SQUEEZY_WEBHOOK_SECRET),
  plans: {
    bourse: isLemonPlanConfigured('bourse'),
    crypto: isLemonPlanConfigured('crypto'),
    combo: isLemonPlanConfigured('combo')
  }
});

const applyUserAccessConsistency = (user) => {
  const nextUser = user;
  nextUser.email = normalizeEmail(nextUser.email);
  nextUser.manualVipAccess = Boolean(nextUser.isAdmin || nextUser.manualVipAccess);
  nextUser.emailVerified = Boolean(nextUser.isAdmin || nextUser.emailVerified);
  nextUser.authProviders = normalizeAuthProviders(nextUser.authProviders);
  nextUser.billing = normalizeBillingProfile(nextUser.billing);
  nextUser.subscriptionPlan = normalizeSubscriptionPlan(nextUser.subscriptionPlan, Boolean(nextUser.isAdmin));
  nextUser.subscriptionStatus = normalizeSubscriptionStatus(nextUser.subscriptionStatus, Boolean(nextUser.isAdmin));
  ensureSubscriptionStartedAt(
    nextUser,
    safeString(nextUser.subscriptionUpdatedAt, 64) || safeString(nextUser.createdAt, 64) || new Date().toISOString()
  );

  if (nextUser.isAdmin) {
    nextUser.isSubscribed = true;
    nextUser.subscriptionPlan = 'ADMIN';
    nextUser.subscriptionStatus = 'ADMIN';
    nextUser.manualVipAccess = true;
    nextUser.subscriptionStartedAt = nextUser.subscriptionStartedAt || nextUser.createdAt || new Date().toISOString();
    return nextUser;
  }

  if (nextUser.subscriptionPlan === 'NONE') {
    nextUser.isSubscribed = false;
    if (nextUser.subscriptionStatus === 'ACTIVE' || nextUser.subscriptionStatus === 'PAST_DUE' || nextUser.subscriptionStatus === 'CANCELED') {
      nextUser.subscriptionStatus = 'NONE';
    }
  } else if (nextUser.subscriptionStatus === 'ACTIVE' || isCancellationGracePeriodActive(nextUser)) {
    nextUser.isSubscribed = true;
  } else {
    nextUser.isSubscribed = false;
  }

  if (!nextUser.subscriptionStatus || nextUser.subscriptionStatus === 'ADMIN') {
    nextUser.subscriptionStatus = nextUser.isSubscribed ? 'ACTIVE' : 'NONE';
  }

  return nextUser;
};

const defaultAffiliateProfile = (email, isAdmin = false) => {
  if (isAdmin) {
    return {
      isAffiliate: true,
      referralCode: 'BLACKADMIN',
      referrals: [
        {
          id: 'ref-1',
          pseudo: 'trader.alpha@test.com',
          email: 'trader.alpha@test.com',
          subscriptionPlan: 'combo',
          subscriptionStatus: 'ACTIVE',
          subscriptionActive: true,
          paymentProvider: 'MANUAL',
          paymentChannel: 'CRYPTO_MANUAL',
          commissionModel: 'CRYPTO_50_PERCENT_MANUAL',
          commissionAmount: 24.5,
          commissionStatus: 'READY_TO_PAY',
          followUpRequired: false,
          paidAmount: 49,
          paidCurrency: 'EUR',
          lastPaymentAt: '2026-03-01T10:00:00.000Z',
          updatedAt: '2026-03-01T10:00:00.000Z',
          joinedAt: '2026-03-01T10:00:00.000Z'
        },
        {
          id: 'ref-2',
          pseudo: 'sarah.vip@test.com',
          email: 'sarah.vip@test.com',
          subscriptionPlan: 'crypto',
          subscriptionStatus: 'ACTIVE',
          subscriptionActive: true,
          paymentProvider: 'MANUAL',
          paymentChannel: 'CRYPTO_MANUAL',
          commissionModel: 'CRYPTO_50_PERCENT_MANUAL',
          commissionAmount: 14.5,
          commissionStatus: 'PAID',
          followUpRequired: false,
          paidAmount: 29,
          paidCurrency: 'EUR',
          lastPaymentAt: '2026-02-20T10:00:00.000Z',
          updatedAt: '2026-02-20T10:00:00.000Z',
          joinedAt: '2026-02-20T10:00:00.000Z'
        },
        {
          id: 'ref-3',
          pseudo: 'paul.lead@test.com',
          email: 'paul.lead@test.com',
          subscriptionPlan: 'bourse',
          subscriptionStatus: 'PENDING_VERIFICATION',
          subscriptionActive: false,
          paymentProvider: 'MANUAL',
          paymentChannel: 'CRYPTO_MANUAL',
          commissionModel: 'CRYPTO_50_PERCENT_MANUAL',
          commissionAmount: 0,
          commissionStatus: 'LOCKED',
          followUpRequired: true,
          paidAmount: 29,
          paidCurrency: 'EUR',
          lastPaymentAt: null,
          updatedAt: '2026-03-10T10:00:00.000Z',
          joinedAt: '2026-03-10T10:00:00.000Z'
        }
      ],
      commissionHistory: [
        {
          id: 'comm-1',
          amount: 14.5,
          sourceUser: 'sarah.vip@test.com',
          dateCreated: '2026-02-21',
          status: 'PAID',
          payoutMethod: 'FIAT'
        },
        {
          id: 'comm-2',
          amount: 24.5,
          sourceUser: 'trader.alpha@test.com',
          dateCreated: '2026-03-01',
          status: 'READY_TO_PAY',
          payoutMethod: 'CRYPTO'
        }
      ]
    };
  }

  return {
    isAffiliate: false,
    referralCode: String(email || '').split('@')[0].toUpperCase().slice(0, 10) || 'MEMBRE',
    referrals: [],
    commissionHistory: []
  };
};

const defaultPosts = () => ([
  {
    id: 'trade-123',
    type: 'TRADE_SIGNAL',
    title: 'Dossier #402 : Short Squeeze sur ETH ?',
    excerpt: 'Analyse complete du setup Ethereum avant les annonces CPI.',
    content: '',
    date: 'Aujourd\'hui, 09:30',
    isLocked: true,
    publicationStatus: 'PUBLISHED',
    tags: ['ETH', 'Scalping', 'High Risk'],
    tradeDetails: {
      asset: 'ETH/USDT',
      direction: 'LONG',
      macroContext: "L'inflation US (CPI) est attendue plus basse que prevu.",
      riskRewardRatio: 3.2,
      conviction: 'HIGH',
      scenarios: [
        { label: 'A', description: 'Cassure des 2100$ + retest -> visee 2250$', probability: 65 },
        { label: 'B', description: 'Rejet sous 2100$ et retour range 2050$', probability: 25 },
        { label: 'C', description: 'Invalidation sous 2020$', probability: 10 }
      ],
      levels: {
        entry: 2105,
        stopLoss: 2020,
        exit: 2280
      },
      isCompleted: true,
      executionTime: '14:45',
      entryReason: 'Cloture H4 au-dessus du VWAP journalier + divergence RSI validee.',
      exitReason: "TP1 touche. J'ai cloture 70% de la position avant la resistance psychologique.",
      mistake: 'Entree un peu tardive.',
      lesson: 'Ne pas hesiter quand le setup A+ est valide.',
      pnlPercentage: 8.5,
      emotionalState: 'CALM',
      scores: {
        execution: 9,
        result: 8
      }
    }
  },
  {
    id: 'p1',
    type: 'ARTICLE',
    title: 'Pourquoi j\'ai shorte le S&P500 cette semaine',
    excerpt: 'L\'analyse macro-economique montre des signes de faiblesse clairs.',
    content: 'Analyse detaillee du contexte macro et des niveaux clefs.',
    date: 'Hier',
    isLocked: false,
    publicationStatus: 'PUBLISHED',
    tags: ['Macro', 'SP500', 'Opinion']
  }
]);

const defaultReviews = () => ([
  {
    id: 'r1',
    author: 'CryptoMatrix',
    role: 'INFLUENCER',
    rating: 5,
    date: 'Il y a 2 jours',
    content: "J'ai audite les Black Papers. Transparence et discipline.",
    type: 'VIDEO',
    videoUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    status: 'APPROVED',
    platform: 'YouTube'
  },
  {
    id: 'r2',
    author: 'Thomas R.',
    role: 'VIP',
    rating: 5,
    date: 'Hier',
    content: "Rembourse en un seul trade sur SOL. La partie risk management m'a aide.",
    type: 'TEXT',
    status: 'APPROVED',
    pnlProof: true
  },
  {
    id: 'r3',
    author: 'Anon_User_22',
    role: 'USER',
    rating: 3,
    date: 'Aujourd\'hui',
    content: "Contenu top mais j'aimerais plus de lives video.",
    type: 'TEXT',
    status: 'PENDING'
  }
]);

const buildBootstrapAdminConfig = () => {
  if (ADMIN_BOOTSTRAP_PASSWORD) {
    if (IS_PRODUCTION_LIKE && !ADMIN_BOOTSTRAP_EMAIL) {
      throw new Error('ADMIN_BOOTSTRAP_EMAIL is required in production/staging.');
    }
    if (!isStrongBootstrapPassword(ADMIN_BOOTSTRAP_PASSWORD)) {
      throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be at least 14 chars with upper/lower/number/symbol.');
    }
    return {
      email: ADMIN_BOOTSTRAP_EMAIL || 'admin@example.com',
      password: ADMIN_BOOTSTRAP_PASSWORD,
      source: 'env'
    };
  }

  if (IS_PRODUCTION_LIKE) {
    return null;
  }

  if (!ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP) {
    return null;
  }

  const generatedPassword = crypto.randomBytes(24).toString('base64url');
  return {
    email: ADMIN_BOOTSTRAP_EMAIL || 'admin@example.com',
    password: generatedPassword,
    source: 'generated'
  };
};

const createStore = (bootstrapAdmin = null) => {
  const users = [];
  if (bootstrapAdmin) {
    const admin = createUser(bootstrapAdmin.email, bootstrapAdmin.password, {
      isAdmin: true,
      needsOnboarding: false
    });
    users.push(admin);
  }
  return {
    users,
    sessions: {},
    leads: defaultLeads(),
    posts: defaultPosts(),
    reviews: defaultReviews(),
    dailyTrades: defaultDailyTrades(),
    marketAnalysis: defaultMarketAnalysis(),
    marketAnalyses: defaultMarketAnalyses(),
    tradeSnapshots: defaultTradeSnapshots(),
    xFeed: defaultXFeed()
  };
};

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: STORE_DIR_MODE });
  try {
    fs.chmodSync(DATA_DIR, STORE_DIR_MODE);
  } catch {
    // Ignore chmod failures on platforms/filesystems that do not support POSIX modes.
  }
  if (!fs.existsSync(STORE_PATH)) {
    const bootstrapAdmin = buildBootstrapAdminConfig();
    if (IS_PRODUCTION_LIKE && !bootstrapAdmin) {
      throw new Error('Refusing to initialize store in production/staging without ADMIN_BOOTSTRAP_PASSWORD.');
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(createStore(bootstrapAdmin), null, 2), { encoding: 'utf8', mode: STORE_FILE_MODE });
    try {
      fs.chmodSync(STORE_PATH, STORE_FILE_MODE);
    } catch {
      // Ignore chmod failures on platforms/filesystems that do not support POSIX modes.
    }
    if (bootstrapAdmin?.source === 'generated') {
      console.warn(`[SECURITY] Local bootstrap admin created (${bootstrapAdmin.email}) with one-time generated password: ${bootstrapAdmin.password}`);
      console.warn('[SECURITY] Store this password securely and rotate it immediately for production-like environments.');
    }
  }
};

const readStore = () => {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  let mutated = false;
  if (!Array.isArray(store.users)) store.users = [];
  store.users = store.users.map((user) => {
    const nextUser = { ...user };
    const beforeFingerprint = JSON.stringify({
      email: nextUser.email,
      isSubscribed: nextUser.isSubscribed,
      isAdmin: nextUser.isAdmin,
      subscriptionPlan: nextUser.subscriptionPlan,
      subscriptionStatus: nextUser.subscriptionStatus,
      subscriptionUpdatedAt: nextUser.subscriptionUpdatedAt,
      subscriptionStartedAt: nextUser.subscriptionStartedAt,
      manualVipAccess: nextUser.manualVipAccess,
      emailVerified: nextUser.emailVerified,
      authProviders: nextUser.authProviders,
      referredByCode: nextUser.referredByCode,
      referredByUserId: nextUser.referredByUserId,
      referredByEmail: nextUser.referredByEmail,
      emailVerificationTokenHash: nextUser.emailVerificationTokenHash,
      emailVerificationExpiresAt: nextUser.emailVerificationExpiresAt,
      passwordResetTokenHash: nextUser.passwordResetTokenHash,
      passwordResetExpiresAt: nextUser.passwordResetExpiresAt,
      billing: nextUser.billing,
      onboardingCompletedAt: nextUser.onboardingCompletedAt
    });
    applyUserAccessConsistency(nextUser);
    if (!nextUser.createdAt) {
      nextUser.createdAt = new Date().toISOString();
      mutated = true;
    }
    if (nextUser.rememberToken) {
      delete nextUser.rememberToken;
      mutated = true;
    }
    if (typeof nextUser.emailVerificationTokenHash !== 'string') {
      nextUser.emailVerificationTokenHash = null;
      mutated = true;
    }
    if (typeof nextUser.emailVerificationExpiresAt !== 'string') {
      nextUser.emailVerificationExpiresAt = null;
      mutated = true;
    }
    if (typeof nextUser.passwordResetTokenHash !== 'string') {
      nextUser.passwordResetTokenHash = null;
      mutated = true;
    }
    if (typeof nextUser.passwordResetExpiresAt !== 'string') {
      nextUser.passwordResetExpiresAt = null;
      mutated = true;
    }
    if (typeof nextUser.emailVerifiedAt !== 'string') {
      nextUser.emailVerifiedAt = null;
      mutated = true;
    }
    const normalizedReferredByCode = sanitizeReferralCode(nextUser.referredByCode);
    if ((nextUser.referredByCode || null) !== (normalizedReferredByCode || null)) {
      nextUser.referredByCode = normalizedReferredByCode || null;
      mutated = true;
    }
    const normalizedReferredByUserId = safeString(nextUser.referredByUserId, 128) || null;
    if ((nextUser.referredByUserId || null) !== normalizedReferredByUserId) {
      nextUser.referredByUserId = normalizedReferredByUserId;
      mutated = true;
    }
    const normalizedReferredByEmail = normalizeEmail(nextUser.referredByEmail || '') || null;
    if ((nextUser.referredByEmail || null) !== normalizedReferredByEmail) {
      nextUser.referredByEmail = normalizedReferredByEmail;
      mutated = true;
    }
    if (typeof nextUser.subscriptionUpdatedAt !== 'string') {
      nextUser.subscriptionUpdatedAt = nextUser.createdAt || new Date().toISOString();
      mutated = true;
    }
    if (typeof nextUser.subscriptionStartedAt !== 'string' && nextUser.subscriptionStartedAt !== null) {
      nextUser.subscriptionStartedAt = nextUser.subscriptionPlan === 'NONE'
        ? null
        : (nextUser.subscriptionUpdatedAt || nextUser.createdAt || new Date().toISOString());
      mutated = true;
    }
    if (typeof nextUser.onboardingCompletedAt !== 'string') {
      nextUser.onboardingCompletedAt = nextUser.needsOnboarding ? null : (nextUser.subscriptionUpdatedAt || nextUser.createdAt || new Date().toISOString());
      mutated = true;
    }
    const normalizedBilling = normalizeBillingProfile(nextUser.billing);
    if (JSON.stringify(nextUser.billing || {}) !== JSON.stringify(normalizedBilling)) {
      nextUser.billing = normalizedBilling;
      mutated = true;
    }
    if (!nextUser.affiliateProfile || typeof nextUser.affiliateProfile !== 'object') {
      nextUser.affiliateProfile = defaultAffiliateProfile(nextUser.email, Boolean(nextUser.isAdmin));
      mutated = true;
    }
    if (!Array.isArray(nextUser.affiliateProfile.referrals)) {
      nextUser.affiliateProfile.referrals = [];
      mutated = true;
    }
    if (!Array.isArray(nextUser.affiliateProfile.commissionHistory)) {
      nextUser.affiliateProfile.commissionHistory = [];
      mutated = true;
    }
    if (typeof nextUser.affiliateProfile.isAffiliate !== 'boolean') {
      nextUser.affiliateProfile.isAffiliate = Boolean(nextUser.isAdmin);
      mutated = true;
    }
    if (!nextUser.affiliateProfile.referralCode) {
      nextUser.affiliateProfile.referralCode = defaultAffiliateProfile(nextUser.email, Boolean(nextUser.isAdmin)).referralCode;
      mutated = true;
    }
    if (nextUser.affiliateProfile.isAffiliate && !nextUser.manualVipAccess) {
      nextUser.manualVipAccess = true;
      mutated = true;
    }
    if (beforeFingerprint !== JSON.stringify({
      email: nextUser.email,
      isSubscribed: nextUser.isSubscribed,
      isAdmin: nextUser.isAdmin,
      subscriptionPlan: nextUser.subscriptionPlan,
      subscriptionStatus: nextUser.subscriptionStatus,
      subscriptionUpdatedAt: nextUser.subscriptionUpdatedAt,
      subscriptionStartedAt: nextUser.subscriptionStartedAt,
      manualVipAccess: nextUser.manualVipAccess,
      emailVerified: nextUser.emailVerified,
      authProviders: nextUser.authProviders,
      referredByCode: nextUser.referredByCode,
      referredByUserId: nextUser.referredByUserId,
      referredByEmail: nextUser.referredByEmail,
      emailVerificationTokenHash: nextUser.emailVerificationTokenHash,
      emailVerificationExpiresAt: nextUser.emailVerificationExpiresAt,
      passwordResetTokenHash: nextUser.passwordResetTokenHash,
      passwordResetExpiresAt: nextUser.passwordResetExpiresAt,
      billing: nextUser.billing,
      onboardingCompletedAt: nextUser.onboardingCompletedAt
    })) {
      mutated = true;
    }
    return nextUser;
  });
  const seenReferralCodes = new Set();
  store.users.forEach((user) => {
    if (!user || typeof user !== 'object') return;
    if (!user.affiliateProfile || typeof user.affiliateProfile !== 'object' || Array.isArray(user.affiliateProfile)) {
      user.affiliateProfile = defaultAffiliateProfile(user.email, Boolean(user.isAdmin));
      mutated = true;
    }
    const existingCode = sanitizeReferralCode(user.affiliateProfile.referralCode);
    if (!existingCode || seenReferralCodes.has(existingCode)) {
      ensureUserReferralCode(store, user, true);
      mutated = true;
    }
    const finalCode = sanitizeReferralCode(user.affiliateProfile.referralCode);
    if (finalCode) {
      seenReferralCodes.add(finalCode);
    }
  });
  const affiliateConsistencyBefore = JSON.stringify(
    store.users.map((user) => ({
      id: user.id,
      referredByCode: user.referredByCode || null,
      referredByUserId: user.referredByUserId || null,
      referredByEmail: user.referredByEmail || null,
      billing: normalizeBillingProfile(user.billing),
      referrals: Array.isArray(user?.affiliateProfile?.referrals) ? user.affiliateProfile.referrals : [],
      commissionHistory: Array.isArray(user?.affiliateProfile?.commissionHistory) ? user.affiliateProfile.commissionHistory : []
    }))
  );
  store.users.forEach((user) => {
    if (!user || typeof user !== 'object') return;
    if (!safeString(user.referredByCode, 32) && !safeString(user.referredByUserId, 128) && !safeString(user.referredByEmail, 160)) {
      return;
    }
    syncReferralAttributionForUser(store, user, {
      source: 'store_consistency_rebuild',
      recordCommissionEvent: false
    });
  });
  const affiliateConsistencyAfter = JSON.stringify(
    store.users.map((user) => ({
      id: user.id,
      referredByCode: user.referredByCode || null,
      referredByUserId: user.referredByUserId || null,
      referredByEmail: user.referredByEmail || null,
      billing: normalizeBillingProfile(user.billing),
      referrals: Array.isArray(user?.affiliateProfile?.referrals) ? user.affiliateProfile.referrals : [],
      commissionHistory: Array.isArray(user?.affiliateProfile?.commissionHistory) ? user.affiliateProfile.commissionHistory : []
    }))
  );
  if (affiliateConsistencyBefore !== affiliateConsistencyAfter) {
    mutated = true;
  }
  if (!store.sessions || typeof store.sessions !== 'object' || Array.isArray(store.sessions)) {
    store.sessions = {};
    mutated = true;
  } else {
    const normalizedSessions = {};
    const knownUserIds = new Set(store.users.map((user) => user.id));
    const nowMs = Date.now();
    for (const [sessionKey, sessionValue] of Object.entries(store.sessions)) {
      if (!sessionValue || typeof sessionValue !== 'object' || Array.isArray(sessionValue)) {
        mutated = true;
        continue;
      }

      const userId = safeString(sessionValue.userId, 128);
      const tokenHash = safeString(sessionValue.tokenHash || sessionKey, 128);
      if (!userId || !tokenHash || !knownUserIds.has(userId)) {
        mutated = true;
        continue;
      }

      const createdAt = safeString(sessionValue.createdAt, 64) || new Date().toISOString();
      const updatedAt = safeString(sessionValue.updatedAt, 64) || createdAt;
      const lastRotatedAt = safeString(sessionValue.lastRotatedAt, 64) || createdAt;
      const expiresAt = safeString(sessionValue.expiresAt, 64) || new Date(nowMs + EFFECTIVE_SESSION_IDLE_TTL_MS).toISOString();
      const absoluteExpiresAt = safeString(sessionValue.absoluteExpiresAt, 64) || new Date(nowMs + EFFECTIVE_SESSION_MAX_TTL_MS).toISOString();
      const revokedAt = safeString(sessionValue.revokedAt, 64) || null;
      const revokedReason = safeString(sessionValue.revokedReason, 64) || null;
      const expiresAtMs = Date.parse(expiresAt);
      const absoluteExpiresAtMs = Date.parse(absoluteExpiresAt);

      if (
        revokedAt
        || !Number.isFinite(expiresAtMs)
        || !Number.isFinite(absoluteExpiresAtMs)
        || (!SESSION_PERSISTENT_LOGIN && nowMs >= expiresAtMs)
        || (!SESSION_PERSISTENT_LOGIN && nowMs >= absoluteExpiresAtMs)
      ) {
        mutated = true;
        continue;
      }

      const normalized = {
        id: safeString(sessionValue.id, 64) || crypto.randomUUID(),
        userId,
        tokenHash,
        createdAt,
        updatedAt,
        lastRotatedAt,
        expiresAt,
        absoluteExpiresAt,
        revokedAt,
        revokedReason,
        ipAddress: safeString(sessionValue.ipAddress, 128) || null,
        userAgent: safeString(sessionValue.userAgent, 256) || null
      };

      normalizedSessions[tokenHash] = normalized;
      if (sessionKey !== tokenHash) {
        mutated = true;
      }
    }
    store.sessions = normalizedSessions;
  }
  if (!Array.isArray(store.leads)) {
    store.leads = defaultLeads();
    mutated = true;
  } else {
    const normalizedLeads = store.leads
      .map((lead, index) => sanitizeLeadRecordForStore(lead, index))
      .filter(Boolean)
      .slice(0, 10000);
    const knownUsersByEmail = new Map(store.users.map((user) => [normalizeEmail(user.email), user]));
    const enrichedLeads = normalizedLeads.map((lead) => {
      const maybeUser = knownUsersByEmail.get(lead.email);
      if (!maybeUser) return lead;
      const permissions = resolveUserPermissions(maybeUser);
      const nextStatus = permissions.vipAccess ? 'VIP_ACTIVE' : 'REGISTERED';
      const nextPlan = maybeUser.subscriptionPlan || 'NONE';
      const nextSubscriptionStatus = maybeUser.subscriptionStatus || 'NONE';
      const hasChanged = (
        lead.userId !== maybeUser.id
        || lead.status !== nextStatus
        || lead.subscriptionPlan !== nextPlan
        || lead.subscriptionStatus !== nextSubscriptionStatus
      );
      return {
        ...lead,
        userId: maybeUser.id,
        subscriptionPlan: nextPlan,
        subscriptionStatus: nextSubscriptionStatus,
        status: nextStatus,
        updatedAt: hasChanged ? new Date().toISOString() : lead.updatedAt
      };
    });
    if (JSON.stringify(store.leads) !== JSON.stringify(enrichedLeads)) {
      store.leads = enrichedLeads;
      mutated = true;
    }
  }
  if (!Array.isArray(store.posts)) {
    store.posts = defaultPosts();
    mutated = true;
  }
  if (!Array.isArray(store.reviews)) {
    store.reviews = defaultReviews();
    mutated = true;
  } else {
    const normalizedReviews = store.reviews
      .map((review, index) => {
        if (!review || typeof review !== 'object') return null;
        const nowIso = new Date().toISOString();
        const inferredCreatedAt = inferReviewCreatedAtFromLabel(review.date);
        const createdAt = safeString(review.createdAt, 64) || inferredCreatedAt || nowIso;
        return {
          ...review,
          id: safeString(review.id, 80) || `review-${index + 1}-${crypto.randomUUID()}`,
          status: sanitizeReviewStatus(review.status),
          createdAt,
          updatedAt: safeString(review.updatedAt, 64) || createdAt
        };
      })
      .filter(Boolean);
    if (JSON.stringify(store.reviews) !== JSON.stringify(normalizedReviews)) {
      store.reviews = normalizedReviews;
      mutated = true;
    }
  }
  if (!Array.isArray(store.dailyTrades)) {
    store.dailyTrades = defaultDailyTrades();
    mutated = true;
  } else {
    const normalizedTrades = store.dailyTrades.map((trade) => sanitizeDailyTrade(trade)).filter(Boolean);
    if (normalizedTrades.length !== store.dailyTrades.length) {
      mutated = true;
    }
    store.dailyTrades = normalizedTrades.length ? normalizedTrades : defaultDailyTrades();
  }
  if (typeof store.marketAnalysis !== 'string' || !store.marketAnalysis.trim()) {
    store.marketAnalysis = defaultMarketAnalysis();
    mutated = true;
  }
  const normalizedStoreMarketAnalyses = sanitizeMarketAnalyses(store.marketAnalyses, store.marketAnalysis);
  if (JSON.stringify(store.marketAnalyses || {}) !== JSON.stringify(normalizedStoreMarketAnalyses)) {
    store.marketAnalyses = normalizedStoreMarketAnalyses;
    mutated = true;
  }
  if (!Array.isArray(store.tradeSnapshots)) {
    store.tradeSnapshots = [];
    mutated = true;
  }
  const normalizedTradeSnapshots = store.tradeSnapshots
    .map((snapshot, index) => sanitizeTradeSnapshot(snapshot, index))
    .filter(Boolean);
  if (!normalizedTradeSnapshots.length) {
    normalizedTradeSnapshots.push({
      id: `snapshot-${crypto.randomUUID()}`,
      dateKey: inferTradeSnapshotDateKey(store.dailyTrades, new Date().toISOString()),
      monthKey: inferTradeSnapshotDateKey(store.dailyTrades, new Date().toISOString()).slice(0, 7),
      publishedAt: new Date().toISOString(),
      source: 'legacy_backfill',
      trades: store.dailyTrades,
      marketAnalysis: store.marketAnalysis,
      marketAnalyses: store.marketAnalyses
    });
  }
  const sortedTradeSnapshots = sortTradeSnapshotsDesc(normalizedTradeSnapshots).slice(0, TRADE_SNAPSHOT_LIMIT);
  if (JSON.stringify(store.tradeSnapshots) !== JSON.stringify(sortedTradeSnapshots)) {
    store.tradeSnapshots = sortedTradeSnapshots;
    mutated = true;
  }
  if (!store.xFeed || typeof store.xFeed !== 'object' || Array.isArray(store.xFeed)) {
    store.xFeed = defaultXFeed();
    mutated = true;
  } else {
    const previousFingerprint = JSON.stringify(store.xFeed);
    const mode = safeString(store.xFeed.mode, 32) || 'curated_manual';
    const updatedAtRaw = safeString(store.xFeed.updatedAt, 64);
    const updatedAtMs = Date.parse(updatedAtRaw);
    const accountsRaw = Array.isArray(store.xFeed.accounts) ? store.xFeed.accounts : [];
    const accounts = accountsRaw
      .map((entry, index) => sanitizeXFeedAccountForStore(entry, index))
      .filter(Boolean)
      .slice(0, X_FEED_MAX_ACCOUNTS);
    if (!accounts.length) {
      accounts.push(...defaultXFeedAccounts());
    }
    store.xFeed = {
      mode: mode || 'curated_manual',
      updatedAt: Number.isFinite(updatedAtMs) ? new Date(updatedAtMs).toISOString() : new Date().toISOString(),
      accounts
    };
    if (previousFingerprint !== JSON.stringify(store.xFeed)) {
      mutated = true;
    }
  }
  if (mutated) writeStore(store);
  return store;
};

const writeStore = (store) => {
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: STORE_FILE_MODE });
  fs.renameSync(tmpPath, STORE_PATH);
  try {
    fs.chmodSync(STORE_PATH, STORE_FILE_MODE);
  } catch {
    // Ignore chmod failures on platforms/filesystems that do not support POSIX modes.
  }
};

const validateRuntimeConfig = () => {
  if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
    throw new Error(`Invalid PORT value: ${PORT}`);
  }
  if (!CORS_ALLOWED_ORIGINS.length) {
    throw new Error('CORS_ORIGIN must define at least one origin or "*".');
  }
  if (CORS_ALLOWED_ORIGINS.includes('*') && CORS_ALLOWED_ORIGINS.length > 1) {
    throw new Error('CORS_ORIGIN cannot combine "*" with explicit origins.');
  }
  if (!Number.isInteger(MAX_JSON_BODY_BYTES) || MAX_JSON_BODY_BYTES < 1024 || MAX_JSON_BODY_BYTES > 1024 * 1024) {
    throw new Error(`Invalid MAX_JSON_BODY_BYTES value: ${MAX_JSON_BODY_BYTES}`);
  }
  if (!Number.isInteger(RSS_REQUEST_TIMEOUT_MS) || RSS_REQUEST_TIMEOUT_MS < 1000 || RSS_REQUEST_TIMEOUT_MS > 30000) {
    throw new Error(`Invalid RSS_REQUEST_TIMEOUT_MS value: ${RSS_REQUEST_TIMEOUT_MS}`);
  }
  if (!Number.isInteger(MARKET_REQUEST_TIMEOUT_MS) || MARKET_REQUEST_TIMEOUT_MS < 1000 || MARKET_REQUEST_TIMEOUT_MS > 30000) {
    throw new Error(`Invalid MARKET_REQUEST_TIMEOUT_MS value: ${MARKET_REQUEST_TIMEOUT_MS}`);
  }
  if (!Number.isInteger(MARKET_CACHE_TTL_MS) || MARKET_CACHE_TTL_MS < 5000 || MARKET_CACHE_TTL_MS > 30 * 60 * 1000) {
    throw new Error(`Invalid MARKET_CACHE_TTL_MS value: ${MARKET_CACHE_TTL_MS}`);
  }
  if (!Number.isInteger(VIP_ACTIVITY_WINDOW_MINUTES) || VIP_ACTIVITY_WINDOW_MINUTES < 1 || VIP_ACTIVITY_WINDOW_MINUTES > 240) {
    throw new Error(`Invalid VIP_ACTIVITY_WINDOW_MINUTES value: ${VIP_ACTIVITY_WINDOW_MINUTES}`);
  }
  if (SESSION_TOKEN_SECRET && SESSION_TOKEN_SECRET.length < 32) {
    throw new Error('SESSION_TOKEN_SECRET must be at least 32 characters when defined.');
  }
  if (IS_PRODUCTION_LIKE && ORIGIN === '*') {
    throw new Error('CORS_ORIGIN cannot be "*" in production/staging.');
  }
  if (IS_PRODUCTION_LIKE && CORS_ALLOWED_ORIGINS.includes('*')) {
    throw new Error('CORS_ORIGIN wildcard is forbidden in production/staging.');
  }
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,62}$/.test(SESSION_COOKIE_NAME)) {
    throw new Error(`Invalid SESSION_COOKIE_NAME value: ${SESSION_COOKIE_NAME}`);
  }
  if (!Number.isInteger(SESSION_IDLE_TTL_HOURS) || SESSION_IDLE_TTL_HOURS < 1 || SESSION_IDLE_TTL_HOURS > 168) {
    throw new Error(`Invalid SESSION_IDLE_TTL_HOURS value: ${SESSION_IDLE_TTL_HOURS}`);
  }
  if (!Number.isInteger(SESSION_MAX_TTL_DAYS) || SESSION_MAX_TTL_DAYS < 1 || SESSION_MAX_TTL_DAYS > 90) {
    throw new Error(`Invalid SESSION_MAX_TTL_DAYS value: ${SESSION_MAX_TTL_DAYS}`);
  }
  if (!Number.isInteger(SESSION_ROTATION_MINUTES) || SESSION_ROTATION_MINUTES < 5 || SESSION_ROTATION_MINUTES > 1440) {
    throw new Error(`Invalid SESSION_ROTATION_MINUTES value: ${SESSION_ROTATION_MINUTES}`);
  }
  if (!Number.isInteger(PERSISTENT_SESSION_TTL_DAYS) || PERSISTENT_SESSION_TTL_DAYS < 30 || PERSISTENT_SESSION_TTL_DAYS > 36500) {
    throw new Error(`Invalid PERSISTENT_SESSION_TTL_DAYS value: ${PERSISTENT_SESSION_TTL_DAYS}`);
  }
  if (!Number.isInteger(RATE_LIMIT_WINDOW_MS) || RATE_LIMIT_WINDOW_MS < 1000 || RATE_LIMIT_WINDOW_MS > 24 * 60 * 60 * 1000) {
    throw new Error(`Invalid RATE_LIMIT_WINDOW_MS value: ${RATE_LIMIT_WINDOW_MS}`);
  }
  if (!Number.isInteger(RATE_LIMIT_MAX_AUTH) || RATE_LIMIT_MAX_AUTH < 3 || RATE_LIMIT_MAX_AUTH > 200) {
    throw new Error(`Invalid RATE_LIMIT_MAX_AUTH value: ${RATE_LIMIT_MAX_AUTH}`);
  }
  if (!Number.isInteger(RATE_LIMIT_MAX_PUBLIC_WRITE) || RATE_LIMIT_MAX_PUBLIC_WRITE < 3 || RATE_LIMIT_MAX_PUBLIC_WRITE > 200) {
    throw new Error(`Invalid RATE_LIMIT_MAX_PUBLIC_WRITE value: ${RATE_LIMIT_MAX_PUBLIC_WRITE}`);
  }
  if (!Number.isInteger(RATE_LIMIT_MAX_SUBSCRIPTION) || RATE_LIMIT_MAX_SUBSCRIPTION < 3 || RATE_LIMIT_MAX_SUBSCRIPTION > 200) {
    throw new Error(`Invalid RATE_LIMIT_MAX_SUBSCRIPTION value: ${RATE_LIMIT_MAX_SUBSCRIPTION}`);
  }
  if (!Number.isInteger(RATE_LIMIT_MAX_ADMIN) || RATE_LIMIT_MAX_ADMIN < 10 || RATE_LIMIT_MAX_ADMIN > 1000) {
    throw new Error(`Invalid RATE_LIMIT_MAX_ADMIN value: ${RATE_LIMIT_MAX_ADMIN}`);
  }
  if (!isValidHttpUrl(EFFECTIVE_PUBLIC_APP_URL)) {
    throw new Error(`Invalid PUBLIC_APP_URL value: ${EFFECTIVE_PUBLIC_APP_URL}`);
  }
  if (!isValidHttpUrl(EFFECTIVE_BACKEND_PUBLIC_URL)) {
    throw new Error(`Invalid BACKEND_PUBLIC_URL value: ${EFFECTIVE_BACKEND_PUBLIC_URL}`);
  }
  if (!['console', 'resend'].includes(EMAIL_PROVIDER)) {
    throw new Error(`Invalid EMAIL_PROVIDER value: ${EMAIL_PROVIDER}`);
  }
  if (!Number.isInteger(EMAIL_VERIFY_TOKEN_TTL_HOURS) || EMAIL_VERIFY_TOKEN_TTL_HOURS < 1 || EMAIL_VERIFY_TOKEN_TTL_HOURS > 168) {
    throw new Error(`Invalid EMAIL_VERIFY_TOKEN_TTL_HOURS value: ${EMAIL_VERIFY_TOKEN_TTL_HOURS}`);
  }
  if (!Number.isInteger(PASSWORD_RESET_TOKEN_TTL_HOURS) || PASSWORD_RESET_TOKEN_TTL_HOURS < 1 || PASSWORD_RESET_TOKEN_TTL_HOURS > 24) {
    throw new Error(`Invalid PASSWORD_RESET_TOKEN_TTL_HOURS value: ${PASSWORD_RESET_TOKEN_TTL_HOURS}`);
  }
  if (!Number.isInteger(OAUTH_STATE_TTL_MINUTES) || OAUTH_STATE_TTL_MINUTES < 3 || OAUTH_STATE_TTL_MINUTES > 60) {
    throw new Error(`Invalid OAUTH_STATE_TTL_MINUTES value: ${OAUTH_STATE_TTL_MINUTES}`);
  }
  const lemonApiConfiguredPartially = Boolean(
    LEMON_SQUEEZY_API_KEY
    || LEMON_SQUEEZY_STORE_ID
    || LEMON_VARIANT_ID_BOURSE
    || LEMON_VARIANT_ID_CRYPTO
    || LEMON_VARIANT_ID_COMBO
  );
  if (lemonApiConfiguredPartially) {
    if (!LEMON_SQUEEZY_API_KEY || !LEMON_SQUEEZY_STORE_ID) {
      throw new Error('LEMON_SQUEEZY_API_KEY and LEMON_SQUEEZY_STORE_ID are both required when Lemon API mode is used.');
    }
    if (!LEMON_VARIANT_ID_BOURSE || !LEMON_VARIANT_ID_CRYPTO || !LEMON_VARIANT_ID_COMBO) {
      throw new Error('LEMON_VARIANT_ID_BOURSE, LEMON_VARIANT_ID_CRYPTO and LEMON_VARIANT_ID_COMBO are required for Lemon API mode.');
    }
  }
  const lemonUrlConfiguredPartially = Boolean(
    LEMON_CHECKOUT_URL_BOURSE
    || LEMON_CHECKOUT_URL_CRYPTO
    || LEMON_CHECKOUT_URL_COMBO
  );
  if (!lemonApiConfiguredPartially && lemonUrlConfiguredPartially) {
    if (!isValidHttpUrl(LEMON_CHECKOUT_URL_BOURSE) || !isValidHttpUrl(LEMON_CHECKOUT_URL_CRYPTO) || !isValidHttpUrl(LEMON_CHECKOUT_URL_COMBO)) {
      throw new Error('LEMON_CHECKOUT_URL_BOURSE/CRYPTO/COMBO must be valid HTTP URLs when URL mode is used.');
    }
  }
  if (IS_PRODUCTION_LIKE && (lemonApiConfiguredPartially || lemonUrlConfiguredPartially) && !LEMON_SQUEEZY_WEBHOOK_SECRET) {
    throw new Error('LEMON_SQUEEZY_WEBHOOK_SECRET is required in production/staging when Lemon Squeezy is configured.');
  }
  if (LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL && !isValidHttpUrl(LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL)) {
    throw new Error(`Invalid LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL value: ${LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL}`);
  }
  if (LEMON_SQUEEZY_CHECKOUT_CANCEL_URL && !isValidHttpUrl(LEMON_SQUEEZY_CHECKOUT_CANCEL_URL)) {
    throw new Error(`Invalid LEMON_SQUEEZY_CHECKOUT_CANCEL_URL value: ${LEMON_SQUEEZY_CHECKOUT_CANCEL_URL}`);
  }
  if (EMAIL_PROVIDER === 'resend' && !RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.');
  }
  if (EMAIL_PROVIDER === 'resend' && !EMAIL_FROM.includes('@')) {
    throw new Error('EMAIL_FROM must be a valid sender identity when EMAIL_PROVIDER=resend.');
  }
  const hubspotPartiallyConfigured = Boolean(HUBSPOT_PORTAL_ID || HUBSPOT_SIGNUP_FORM_GUID || HUBSPOT_PRIVATE_APP_TOKEN);
  if (hubspotPartiallyConfigured && (!HUBSPOT_PORTAL_ID || !HUBSPOT_SIGNUP_FORM_GUID)) {
    throw new Error('HUBSPOT_PORTAL_ID and HUBSPOT_SIGNUP_FORM_GUID are both required when HubSpot sync is configured.');
  }
  if (!Number.isFinite(HUBSPOT_SYNC_TIMEOUT_MS) || HUBSPOT_SYNC_TIMEOUT_MS < 2000 || HUBSPOT_SYNC_TIMEOUT_MS > 30000) {
    throw new Error(`Invalid HUBSPOT_SYNC_TIMEOUT_MS value: ${HUBSPOT_SYNC_TIMEOUT_MS}`);
  }
  const googleConfigured = Boolean(OAUTH_GOOGLE_CLIENT_ID || OAUTH_GOOGLE_CLIENT_SECRET);
  if (googleConfigured && (!OAUTH_GOOGLE_CLIENT_ID || !OAUTH_GOOGLE_CLIENT_SECRET)) {
    throw new Error('Both OAUTH_GOOGLE_CLIENT_ID and OAUTH_GOOGLE_CLIENT_SECRET are required.');
  }
  const facebookConfigured = Boolean(OAUTH_FACEBOOK_CLIENT_ID || OAUTH_FACEBOOK_CLIENT_SECRET);
  if (facebookConfigured && (!OAUTH_FACEBOOK_CLIENT_ID || !OAUTH_FACEBOOK_CLIENT_SECRET)) {
    throw new Error('Both OAUTH_FACEBOOK_CLIENT_ID and OAUTH_FACEBOOK_CLIENT_SECRET are required.');
  }
  const linkedInConfigured = Boolean(OAUTH_LINKEDIN_CLIENT_ID || OAUTH_LINKEDIN_CLIENT_SECRET);
  if (linkedInConfigured && (!OAUTH_LINKEDIN_CLIENT_ID || !OAUTH_LINKEDIN_CLIENT_SECRET)) {
    throw new Error('Both OAUTH_LINKEDIN_CLIENT_ID and OAUTH_LINKEDIN_CLIENT_SECRET are required.');
  }
  const appleConfigured = Boolean(
    OAUTH_APPLE_CLIENT_ID
    || OAUTH_APPLE_TEAM_ID
    || OAUTH_APPLE_KEY_ID
    || OAUTH_APPLE_PRIVATE_KEY_BASE64
  );
  if (appleConfigured && (!OAUTH_APPLE_CLIENT_ID || !OAUTH_APPLE_TEAM_ID || !OAUTH_APPLE_KEY_ID || !OAUTH_APPLE_PRIVATE_KEY_BASE64)) {
    throw new Error('Apple OAuth requires OAUTH_APPLE_CLIENT_ID, OAUTH_APPLE_TEAM_ID, OAUTH_APPLE_KEY_ID and OAUTH_APPLE_PRIVATE_KEY_BASE64.');
  }
  const sameSiteNormalized = SESSION_COOKIE_SAME_SITE.toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSiteNormalized)) {
    throw new Error(`Invalid SESSION_COOKIE_SAME_SITE value: ${SESSION_COOKIE_SAME_SITE}`);
  }
  if (sameSiteNormalized === 'none' && !SESSION_COOKIE_SECURE) {
    throw new Error('SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE=None.');
  }
  if (IS_PRODUCTION_LIKE && !SESSION_COOKIE_SECURE) {
    throw new Error('SESSION_COOKIE_SECURE must be true in production/staging.');
  }
  if (IS_PRODUCTION_LIKE && ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP) {
    throw new Error('ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP must be false in production/staging.');
  }
  if (IS_PRODUCTION_LIKE && ALLOW_DEV_SUBSCRIPTION_STUB) {
    throw new Error('ALLOW_DEV_SUBSCRIPTION_STUB is forbidden in production/staging.');
  }
  if (!Number.isFinite(PLAN_PRICE_BOURSE_EUR) || PLAN_PRICE_BOURSE_EUR <= 0 || PLAN_PRICE_BOURSE_EUR > 100000) {
    throw new Error(`Invalid PLAN_PRICE_BOURSE_EUR value: ${PLAN_PRICE_BOURSE_EUR}`);
  }
  if (!Number.isFinite(PLAN_PRICE_CRYPTO_EUR) || PLAN_PRICE_CRYPTO_EUR <= 0 || PLAN_PRICE_CRYPTO_EUR > 100000) {
    throw new Error(`Invalid PLAN_PRICE_CRYPTO_EUR value: ${PLAN_PRICE_CRYPTO_EUR}`);
  }
  if (!Number.isFinite(PLAN_PRICE_COMBO_EUR) || PLAN_PRICE_COMBO_EUR <= 0 || PLAN_PRICE_COMBO_EUR > 100000) {
    throw new Error(`Invalid PLAN_PRICE_COMBO_EUR value: ${PLAN_PRICE_COMBO_EUR}`);
  }
  if (!Number.isFinite(AFFILIATE_CRYPTO_COMMISSION_RATE) || AFFILIATE_CRYPTO_COMMISSION_RATE < 0 || AFFILIATE_CRYPTO_COMMISSION_RATE > 1) {
    throw new Error(`Invalid AFFILIATE_CRYPTO_COMMISSION_RATE value: ${AFFILIATE_CRYPTO_COMMISSION_RATE}`);
  }
};

const createSessionToken = () => crypto.randomBytes(32).toString('hex');
const hashSessionToken = (token) => crypto
  .createHmac('sha256', EFFECTIVE_SESSION_TOKEN_SECRET)
  .update(String(token || ''))
  .digest('hex');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
};

const createUser = (email, password, options = {}) => {
  const nowIso = new Date().toISOString();
  const hasInitialSubscription = Boolean(options.isAdmin || options.isSubscribed || normalizeSubscriptionPlan(options.subscriptionPlan, Boolean(options.isAdmin)) !== 'NONE');
  const user = {
    id: crypto.randomUUID(),
    email: normalizeEmail(email),
    passwordHash: hashPassword(password),
    isSubscribed: Boolean(options.isAdmin || options.isSubscribed),
    isAdmin: Boolean(options.isAdmin),
    manualVipAccess: Boolean(options.isAdmin || options.manualVipAccess),
    needsOnboarding: options.needsOnboarding !== false,
    subscriptionPlan: options.subscriptionPlan || (options.isAdmin ? 'ADMIN' : 'NONE'),
    subscriptionStatus: options.subscriptionStatus || (options.isAdmin ? 'ADMIN' : (options.isSubscribed ? 'ACTIVE' : 'NONE')),
    subscriptionUpdatedAt: nowIso,
    subscriptionStartedAt: hasInitialSubscription ? nowIso : null,
    emailVerified: Boolean(options.isAdmin || options.emailVerified),
    emailVerifiedAt: options.isAdmin || options.emailVerified ? nowIso : null,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    authProviders: normalizeAuthProviders(options.authProviders),
    referredByCode: sanitizeReferralCode(options.referredByCode || ''),
    referredByUserId: safeString(options.referredByUserId, 128) || null,
    referredByEmail: normalizeEmail(options.referredByEmail || '') || null,
    affiliateProfile: options.affiliateProfile || defaultAffiliateProfile(email, Boolean(options.isAdmin)),
    billing: normalizeBillingProfile(options.billing || defaultBillingProfile()),
    onboardingCompletedAt: options.needsOnboarding === false ? nowIso : null,
    createdAt: nowIso
  };
  return applyUserAccessConsistency(user);
};

const isOriginAllowed = (origin) => {
  const requestOrigin = safeString(origin, 512);
  if (!requestOrigin) return true;
  if (CORS_ALLOWED_ORIGINS.includes('*')) return true;
  return CORS_ALLOWED_ORIGINS.includes(requestOrigin);
};

const resolveCorsOrigin = (res) => {
  const requestOrigin = safeString(res.__requestOrigin, 512);
  if (!CORS_ALLOWED_ORIGINS.length) {
    return '';
  }
  if (CORS_ALLOWED_ORIGINS.includes('*')) {
    return requestOrigin || '*';
  }
  if (!requestOrigin) {
    return CORS_ALLOWED_ORIGINS[0] || '';
  }
  return CORS_ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : '';
};

const getClientIp = (req) => {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '');
  const forwardedIp = safeString(forwardedFor.split(',')[0], 128);
  if (forwardedIp) return forwardedIp;
  return safeString(req.socket?.remoteAddress, 128) || 'unknown';
};

const cleanupRateLimits = (nowMs) => {
  if (nowMs < nextRateLimitCleanupAt) return;
  for (const [key, value] of rateLimitBuckets.entries()) {
    if (!value || typeof value !== 'object' || nowMs >= value.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
  nextRateLimitCleanupAt = nowMs + RATE_LIMIT_CLEANUP_INTERVAL_MS;
};

const consumeRateLimit = (req, key, limit, windowMs) => {
  const nowMs = Date.now();
  cleanupRateLimits(nowMs);
  const bucketKey = `${key}:${getClientIp(req)}`;
  const existing = rateLimitBuckets.get(bucketKey);

  if (!existing || nowMs >= existing.resetAt) {
    const resetAt = nowMs + windowMs;
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000))
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000));
  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds
  };
};

const applyRateLimit = (req, res, policyKey, limit) => {
  const result = consumeRateLimit(req, policyKey, limit, RATE_LIMIT_WINDOW_MS);
  const headers = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000))
  };
  res.__rateLimitHeaders = { ...(res.__rateLimitHeaders || {}), ...headers };
  if (!result.allowed) {
    json(
      res,
      429,
      { error: 'too_many_requests', retryAfterSeconds: result.retryAfterSeconds },
      { 'Retry-After': String(result.retryAfterSeconds) }
    );
    return false;
  }
  return true;
};

const resolveRateLimitPolicy = (req, pathname) => {
  if (pathname.startsWith('/api/admin/')) {
    return { key: 'admin', limit: RATE_LIMIT_MAX_ADMIN };
  }
  if (req.method === 'POST' && (
    pathname === '/api/auth/login'
    || pathname === '/api/auth/signup'
    || pathname === '/api/auth/social'
    || pathname === '/api/auth/resend-verification'
    || pathname === '/api/auth/forgot-password'
    || pathname === '/api/auth/reset-password'
    || pathname === '/api/auth/delete-account'
  )) {
    return { key: 'auth', limit: RATE_LIMIT_MAX_AUTH };
  }
  if (req.method === 'POST' && pathname === '/api/subscription/verify') {
    return { key: 'subscription', limit: RATE_LIMIT_MAX_SUBSCRIPTION };
  }
  if (req.method === 'POST' && pathname === '/api/subscription/checkout') {
    return { key: 'subscription_checkout', limit: RATE_LIMIT_MAX_SUBSCRIPTION };
  }
  if (req.method === 'POST' && pathname === '/api/leads') {
    return { key: 'lead_capture', limit: RATE_LIMIT_MAX_PUBLIC_WRITE };
  }
  if (req.method === 'POST' && pathname === '/api/reviews') {
    return { key: 'review', limit: RATE_LIMIT_MAX_PUBLIC_WRITE };
  }
  return null;
};

const buildBaseSecurityHeaders = () => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Cache-Control': 'no-store'
  };
  if (IS_PRODUCTION_LIKE) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
};

const json = (res, status, body, extraHeaders = {}) => {
  const corsOrigin = resolveCorsOrigin(res);
  const securityHeaders = buildBaseSecurityHeaders();
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Vary': 'Origin',
    ...securityHeaders,
    ...(res.__rateLimitHeaders || {})
  };
  if (corsOrigin) {
    headers['Access-Control-Allow-Origin'] = corsOrigin;
  }
  if (corsOrigin && corsOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  res.writeHead(status, { ...headers, ...extraHeaders });
  if (status === 204) {
    res.end();
    return;
  }
  res.end(JSON.stringify(body));
};

const parseBody = async (req) => {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      return { __parseError: 'payload_too_large' };
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return { __parseError: 'invalid_json' };
  }
};

const parseBodyWithRaw = async (req) => {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      return { __parseError: 'payload_too_large' };
    }
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return { rawBody: '', body: {} };
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  try {
    return {
      rawBody,
      body: JSON.parse(rawBody)
    };
  } catch {
    return { __parseError: 'invalid_json' };
  }
};

const getBearerToken = (req) => {
  const raw = req.headers.authorization || '';
  if (!raw.startsWith('Bearer ')) return null;
  return raw.slice('Bearer '.length).trim();
};

const parseCookies = (cookieHeader) => {
  const parsed = {};
  const raw = String(cookieHeader || '');
  if (!raw) return parsed;
  raw.split(';').forEach((entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex <= 0) return;
    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    if (!key) return;
    try {
      parsed[key] = decodeURIComponent(value);
    } catch {
      parsed[key] = value;
    }
  });
  return parsed;
};

const getSessionTokenFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = safeString(cookies[SESSION_COOKIE_NAME], 256);
  if (cookieToken) return cookieToken;
  return getBearerToken(req);
};

const getCookieSameSiteValue = () => {
  const normalized = SESSION_COOKIE_SAME_SITE.toLowerCase();
  if (normalized === 'none') return 'None';
  if (normalized === 'strict') return 'Strict';
  return 'Lax';
};

const buildSessionCookie = (token, absoluteExpiresAt) => {
  const absoluteMs = Date.parse(String(absoluteExpiresAt || ''));
  const defaultMaxAgeSeconds = Math.floor(EFFECTIVE_SESSION_MAX_TTL_MS / 1000);
  const maxAgeSeconds = Number.isFinite(absoluteMs)
    ? Math.max(0, Math.floor((absoluteMs - Date.now()) / 1000))
    : defaultMaxAgeSeconds;
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${getCookieSameSiteValue()}`,
    `Max-Age=${maxAgeSeconds}`
  ];
  if (SESSION_COOKIE_SECURE) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
};

const buildClearSessionCookie = () => {
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${getCookieSameSiteValue()}`,
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0'
  ];
  if (SESSION_COOKIE_SECURE) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
};

const createSession = (store, user, req) => {
  const now = Date.now();
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const nowIso = new Date(now).toISOString();
  const session = {
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastRotatedAt: nowIso,
    expiresAt: new Date(now + EFFECTIVE_SESSION_IDLE_TTL_MS).toISOString(),
    absoluteExpiresAt: new Date(now + EFFECTIVE_SESSION_MAX_TTL_MS).toISOString(),
    revokedAt: null,
    revokedReason: null,
    ipAddress: safeString(req.socket?.remoteAddress, 128) || null,
    userAgent: safeString(req.headers['user-agent'], 256) || null
  };
  store.sessions[tokenHash] = session;
  return { token, session, tokenHash };
};

const isSessionExpired = (session, nowMs = Date.now()) => {
  if (SESSION_PERSISTENT_LOGIN) {
    return !session || Boolean(session.revokedAt);
  }
  const expiresAtMs = Date.parse(String(session?.expiresAt || ''));
  const absoluteExpiresAtMs = Date.parse(String(session?.absoluteExpiresAt || ''));
  if (!session || session.revokedAt) return true;
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(absoluteExpiresAtMs)) return true;
  return nowMs >= expiresAtMs || nowMs >= absoluteExpiresAtMs;
};

const resolveAuthContext = (store, req) => {
  const responseHeaders = {};
  const rawToken = getSessionTokenFromRequest(req);
  if (!rawToken) {
    return {
      user: null,
      session: null,
      tokenHash: null,
      storeChanged: false,
      responseHeaders
    };
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = store.sessions[tokenHash];
  if (!session || typeof session !== 'object') {
    responseHeaders['Set-Cookie'] = buildClearSessionCookie();
    return {
      user: null,
      session: null,
      tokenHash: null,
      storeChanged: false,
      responseHeaders
    };
  }

  const nowMs = Date.now();
  if (isSessionExpired(session, nowMs)) {
    delete store.sessions[tokenHash];
    responseHeaders['Set-Cookie'] = buildClearSessionCookie();
    return {
      user: null,
      session: null,
      tokenHash: null,
      storeChanged: true,
      responseHeaders
    };
  }

  const user = store.users.find((candidate) => candidate.id === session.userId) || null;
  if (!user) {
    delete store.sessions[tokenHash];
    responseHeaders['Set-Cookie'] = buildClearSessionCookie();
    return {
      user: null,
      session: null,
      tokenHash: null,
      storeChanged: true,
      responseHeaders
    };
  }

  let storeChanged = false;
  const nowIso = new Date(nowMs).toISOString();
  session.updatedAt = nowIso;
  session.expiresAt = new Date(nowMs + EFFECTIVE_SESSION_IDLE_TTL_MS).toISOString();
  if (SESSION_PERSISTENT_LOGIN) {
    session.absoluteExpiresAt = new Date(nowMs + EFFECTIVE_SESSION_MAX_TTL_MS).toISOString();
  }
  session.ipAddress = safeString(req.socket?.remoteAddress, 128) || null;
  session.userAgent = safeString(req.headers['user-agent'], 256) || null;
  storeChanged = true;

  let finalTokenHash = tokenHash;
  const lastRotatedAtMs = Date.parse(String(session.lastRotatedAt || session.createdAt || ''));
  if (!Number.isFinite(lastRotatedAtMs) || nowMs - lastRotatedAtMs >= SESSION_ROTATION_MS) {
    const nextToken = createSessionToken();
    const nextTokenHash = hashSessionToken(nextToken);
    delete store.sessions[tokenHash];
    session.tokenHash = nextTokenHash;
    session.lastRotatedAt = nowIso;
    store.sessions[nextTokenHash] = session;
    finalTokenHash = nextTokenHash;
    responseHeaders['Set-Cookie'] = buildSessionCookie(nextToken, session.absoluteExpiresAt);
    storeChanged = true;
  }

  return {
    user,
    session,
    tokenHash: finalTokenHash,
    storeChanged,
    responseHeaders
  };
};

const revokeAllSessionsForUser = (store, userId) => {
  if (!store?.sessions || typeof store.sessions !== 'object') return false;
  let changed = false;
  Object.entries(store.sessions).forEach(([tokenHash, session]) => {
    if (!session || typeof session !== 'object') return;
    if (safeString(session.userId, 128) !== safeString(userId, 128)) return;
    delete store.sessions[tokenHash];
    changed = true;
  });
  return changed;
};

const hasLinkedOAuthProvider = (user) => {
  const providers = user?.authProviders;
  if (!providers || typeof providers !== 'object' || Array.isArray(providers)) {
    return false;
  }
  return Object.values(providers).some((providerUserId) => Boolean(safeString(providerUserId, 191)));
};

const removeUserDataFromStore = (store, user) => {
  if (!store || !user || typeof user !== 'object') return false;
  const userId = safeString(user.id, 128);
  const normalizedEmail = normalizeEmail(user.email || '');
  if (!userId || !normalizedEmail) return false;

  let changed = false;
  const previousUsersCount = Array.isArray(store.users) ? store.users.length : 0;
  if (Array.isArray(store.users)) {
    store.users = store.users.filter((candidate) => safeString(candidate?.id, 128) !== userId);
    if (store.users.length !== previousUsersCount) changed = true;
  }

  if (revokeAllSessionsForUser(store, userId)) {
    changed = true;
  }

  if (Array.isArray(store.leads)) {
    const previousLeadsCount = store.leads.length;
    store.leads = store.leads.filter((lead) => {
      const leadUserId = safeString(lead?.userId, 128);
      const leadEmail = normalizeEmail(lead?.email || '');
      return leadUserId !== userId && leadEmail !== normalizedEmail;
    });
    if (store.leads.length !== previousLeadsCount) changed = true;
  }

  if (Array.isArray(store.users)) {
    store.users.forEach((candidate) => {
      if (!candidate || typeof candidate !== 'object') return;

      if (safeString(candidate.referredByUserId, 128) === userId) {
        candidate.referredByUserId = null;
        candidate.referredByEmail = null;
        candidate.referredByCode = null;
        changed = true;
      }

      const profile = candidate.affiliateProfile;
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return;

      if (Array.isArray(profile.referrals)) {
        const previousReferralsCount = profile.referrals.length;
        profile.referrals = profile.referrals.filter((referral) => {
          const referralEmail = normalizeEmail(referral?.email || referral?.pseudo || '');
          return referralEmail !== normalizedEmail;
        });
        if (profile.referrals.length !== previousReferralsCount) changed = true;
      }

      if (Array.isArray(profile.commissionHistory)) {
        const previousCommissionCount = profile.commissionHistory.length;
        profile.commissionHistory = profile.commissionHistory.filter((commission) => {
          const sourceNormalized = normalizeEmail(commission?.sourceUser || '');
          return sourceNormalized !== normalizedEmail;
        });
        if (profile.commissionHistory.length !== previousCommissionCount) changed = true;
      }
    });
  }

  return changed;
};

const requireAuthenticated = (store, req, res) => {
  const auth = resolveAuthContext(store, req);
  if (auth.storeChanged) {
    writeStore(store);
  }
  if (!auth.user) {
    json(res, 401, { error: 'unauthorized' }, auth.responseHeaders);
    return null;
  }
  return auth;
};

const sanitizeEmail = (email) => String(email || '').trim().toLowerCase();

const sanitizePassword = (password) => String(password || '');
const sanitizeText = (value, max = 5000) => String(value || '').trim().slice(0, max);
const sanitizeBoolean = (value) => Boolean(value);
const sanitizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeText(item, 32)).filter(Boolean).slice(0, 8);
  }
  return sanitizeText(value, 120)
    .split(',')
    .map((item) => sanitizeText(item, 32))
    .filter(Boolean)
    .slice(0, 8);
};
const sanitizeReviewStatus = (value) => {
  const status = sanitizeText(value, 16).toUpperCase();
  return REVIEW_STATUSES.has(status) ? status : 'PENDING';
};
const sanitizeContentType = (value) => {
  const type = sanitizeText(value, 32).toUpperCase();
  return CONTENT_TYPES.has(type) ? type : 'ARTICLE';
};
const sanitizePublicationStatus = (value) => {
  const status = sanitizeText(value, 16).toUpperCase();
  return POST_PUBLICATION_STATUS.has(status) ? status : 'PUBLISHED';
};
const sanitizeDailyTrade = (trade) => {
  if (!trade || typeof trade !== 'object') return null;
  const actif = sanitizeText(trade.actif, 32);
  const market = normalizeTradeMarket(trade.market, actif);
  const direction = sanitizeText(trade.direction, 8).toLowerCase() === 'short' ? 'Short' : 'Long';
  const entree = Number(trade.entree);
  const sl = Number(trade.sl);
  const tp = Number(trade.tp);
  const taille = sanitizeText(trade.taille, 16);
  const raison = sanitizeText(trade.raison, 240);
  const heure = sanitizeText(trade.heure, 64);
  if (!actif || !Number.isFinite(entree) || !Number.isFinite(sl) || !Number.isFinite(tp) || !taille || !raison || !heure) {
    return null;
  }
  return { actif, market, direction, entree, sl, tp, taille, raison, heure };
};

const sanitizeMarketAnalyses = (value, fallbackGlobalAnalysis = '') => {
  const defaults = defaultMarketAnalyses();
  const fallbackGlobal = sanitizeText(fallbackGlobalAnalysis, 12000);
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const bourse = sanitizeText(raw.bourse || raw.BOURSE, 12000);
  const crypto = sanitizeText(raw.crypto || raw.CRYPTO, 12000);
  return {
    bourse: bourse || fallbackGlobal || defaults.bourse,
    crypto: crypto || fallbackGlobal || defaults.crypto
  };
};

const normalizeDateKey = (value) => {
  const candidate = safeString(value, 16).slice(0, 10);
  if (!DATE_KEY_REGEX.test(candidate)) return '';
  const parsedMs = Date.parse(`${candidate}T00:00:00.000Z`);
  return Number.isFinite(parsedMs) ? candidate : '';
};

const normalizeMonthKey = (value) => {
  const candidate = safeString(value, 16).slice(0, 7);
  if (!MONTH_KEY_REGEX.test(candidate)) return '';
  const parsedMs = Date.parse(`${candidate}-01T00:00:00.000Z`);
  return Number.isFinite(parsedMs) ? candidate : '';
};

const dateKeyFromIso = (value, fallback = '') => {
  const parsedMs = Date.parse(String(value || ''));
  if (!Number.isFinite(parsedMs)) return normalizeDateKey(fallback);
  return new Date(parsedMs).toISOString().slice(0, 10);
};

const extractDateKeyFromTradeHour = (value) => {
  const matched = safeString(value, 64).match(/^(\d{4}-\d{2}-\d{2})/);
  if (!matched) return '';
  return normalizeDateKey(matched[1]);
};

const inferTradeSnapshotDateKey = (trades, fallbackIso = '') => {
  const candidates = Array.isArray(trades)
    ? trades
      .map((trade) => extractDateKeyFromTradeHour(trade?.heure))
      .filter(Boolean)
    : [];
  if (candidates.length) {
    return candidates.sort((a, b) => b.localeCompare(a))[0];
  }
  return dateKeyFromIso(fallbackIso, new Date().toISOString().slice(0, 10));
};

const sanitizeTradeSnapshot = (snapshot, index = 0) => {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const trades = Array.isArray(snapshot.trades)
    ? snapshot.trades.map((trade) => sanitizeDailyTrade(trade)).filter(Boolean).slice(0, 30)
    : [];
  const marketAnalysis = sanitizeText(snapshot.marketAnalysis, 12000) || defaultMarketAnalysis();
  const marketAnalyses = sanitizeMarketAnalyses(snapshot.marketAnalyses, marketAnalysis);
  const rawDateKey = normalizeDateKey(snapshot.dateKey || snapshot.date);
  const fallbackDateKey = inferTradeSnapshotDateKey(trades, snapshot.publishedAt || snapshot.updatedAt || new Date().toISOString());
  const dateKey = rawDateKey || fallbackDateKey;
  if (!dateKey) return null;
  const monthKey = normalizeMonthKey(snapshot.monthKey) || dateKey.slice(0, 7);
  const publishedAtIso = (() => {
    const parsedMs = Date.parse(String(snapshot.publishedAt || snapshot.updatedAt || ''));
    if (Number.isFinite(parsedMs)) return new Date(parsedMs).toISOString();
    return `${dateKey}T00:00:00.000Z`;
  })();
  const id = safeString(snapshot.id, 120) || `snapshot-${dateKey}-${index + 1}`;
  return {
    id,
    dateKey,
    monthKey,
    publishedAt: publishedAtIso,
    source: sanitizeText(snapshot.source, 32) || 'admin_patch',
    trades,
    marketAnalysis,
    marketAnalyses
  };
};

const sortTradeSnapshotsDesc = (snapshots) => (
  [...(Array.isArray(snapshots) ? snapshots : [])].sort((a, b) => {
    const dateCompare = safeString(b?.dateKey, 16).localeCompare(safeString(a?.dateKey, 16));
    if (dateCompare !== 0) return dateCompare;
    const publishedA = Date.parse(safeString(a?.publishedAt, 64));
    const publishedB = Date.parse(safeString(b?.publishedAt, 64));
    const safeA = Number.isFinite(publishedA) ? publishedA : 0;
    const safeB = Number.isFinite(publishedB) ? publishedB : 0;
    return safeB - safeA;
  })
);

const buildTradeSnapshotSummary = (snapshot) => ({
  id: safeString(snapshot?.id, 120),
  dateKey: safeString(snapshot?.dateKey, 16),
  monthKey: safeString(snapshot?.monthKey, 16),
  publishedAt: safeString(snapshot?.publishedAt, 64) || null,
  tradeCount: Array.isArray(snapshot?.trades) ? snapshot.trades.length : 0
});

const upsertTradeSnapshot = (store, rawSnapshot) => {
  if (!store || typeof store !== 'object') return null;
  if (!Array.isArray(store.tradeSnapshots)) {
    store.tradeSnapshots = [];
  }
  const sanitizedSnapshot = sanitizeTradeSnapshot(rawSnapshot, store.tradeSnapshots.length);
  if (!sanitizedSnapshot) return null;
  const existingIndex = store.tradeSnapshots.findIndex((entry) => safeString(entry?.dateKey, 16) === sanitizedSnapshot.dateKey);
  if (existingIndex >= 0) {
    const previous = store.tradeSnapshots[existingIndex];
    store.tradeSnapshots[existingIndex] = {
      ...sanitizedSnapshot,
      id: safeString(previous?.id, 120) || sanitizedSnapshot.id
    };
  } else {
    store.tradeSnapshots.push(sanitizedSnapshot);
  }
  store.tradeSnapshots = sortTradeSnapshotsDesc(store.tradeSnapshots).slice(0, TRADE_SNAPSHOT_LIMIT);
  return store.tradeSnapshots.find((entry) => safeString(entry?.dateKey, 16) === sanitizedSnapshot.dateKey) || sanitizedSnapshot;
};

const decodeXmlEntities = (value) => String(value || '')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const extractXmlTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeXmlEntities(match ? match[1].trim() : '');
};

const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const fetchWithTimeout = async (input, init = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const fetchTextWithTimeout = async (url, init = {}, timeoutMs = 8000) => {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }
  return response.text();
};

const fetchJsonWithTimeout = async (url, init = {}, timeoutMs = 8000) => {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }
  return response.json();
};

const parseDateToIso = (value, fallbackIso = new Date().toISOString()) => {
  const parsedMs = Date.parse(String(value || ''));
  if (!Number.isFinite(parsedMs)) return fallbackIso;
  return new Date(parsedMs).toISOString();
};

const inferReviewCreatedAtFromLabel = (label) => {
  const normalized = safeString(label, 64).toLowerCase();
  if (!normalized) return null;
  const now = Date.now();
  if (normalized.includes("aujourd")) {
    return new Date(now).toISOString();
  }
  if (normalized.includes('hier')) {
    return new Date(now - (24 * 60 * 60 * 1000)).toISOString();
  }
  const dayMatch = normalized.match(/(\d+)\s*jour/);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (Number.isFinite(days) && days >= 0) {
      return new Date(now - (days * 24 * 60 * 60 * 1000)).toISOString();
    }
  }
  const weekMatch = normalized.match(/(\d+)\s*semaine/);
  if (weekMatch) {
    const weeks = Number(weekMatch[1]);
    if (Number.isFinite(weeks) && weeks >= 0) {
      return new Date(now - (weeks * 7 * 24 * 60 * 60 * 1000)).toISOString();
    }
  }
  return null;
};

const formatCompactNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(numeric);
};

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const appendSparklinePoint = (symbol, point, fallback = []) => {
  const normalizedSymbol = safeString(symbol, 16).toUpperCase();
  const numericPoint = Number(point);
  if (!normalizedSymbol || !Number.isFinite(numericPoint)) {
    return Array.isArray(fallback) && fallback.length ? fallback.slice(-20) : [0];
  }

  const history = Array.isArray(stockSparklineMemory.get(normalizedSymbol))
    ? stockSparklineMemory.get(normalizedSymbol)
    : (Array.isArray(fallback) ? fallback.slice(-20) : []);
  const nextHistory = [...history, numericPoint].slice(-20);
  stockSparklineMemory.set(normalizedSymbol, nextHistory);
  return nextHistory;
};

const parseRssItems = (xml, source) => {
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  return itemMatches.slice(0, 8).map((rawItem, index) => {
    const title = extractXmlTag(rawItem, 'title');
    const link = extractXmlTag(rawItem, 'link');
    const description = stripHtml(extractXmlTag(rawItem, 'description'));
    const pubDate = extractXmlTag(rawItem, 'pubDate');
    return {
      id: `${source.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}-${Buffer.from(link || title).toString('base64').slice(0, 12)}`,
      source: source.name,
      title,
      url: link,
      summary: description,
      publishedAt: parseDateToIso(pubDate, new Date().toISOString())
    };
  }).filter((item) => item.title && item.url);
};

const loadNewsFeed = async () => {
  const now = Date.now();
  if (rssCache.items.length && now - rssCache.timestamp < RSS_CACHE_TTL_MS) {
    return rssCache.items;
  }

  const settled = await Promise.allSettled(
    GOOGLE_NEWS_RSS_SOURCES.map(async (source) => {
      const xml = await fetchTextWithTimeout(source.url, {
        headers: { 'User-Agent': 'BlackPapersBot/1.0' }
      }, RSS_REQUEST_TIMEOUT_MS);
      return parseRssItems(xml, source);
    })
  );

  const items = settled.flatMap((entry) => entry.status === 'fulfilled' ? entry.value : []);
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const key = item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const finalItems = unique.slice(0, 30);
  rssCache = {
    timestamp: now,
    items: finalItems.length ? finalItems : FALLBACK_NEWS_FEED_ITEMS
  };
  return rssCache.items;
};

const fetchStockQuotesFromYahoo = async () => {
  const symbols = STOCK_WATCHLIST.map((entry) => entry.symbol).join(',');
  const sourceName = 'yahoo_finance';
  const data = await fetchJsonWithTimeout(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
    {
      headers: { 'User-Agent': 'BlackPapersBot/1.0' }
    },
    MARKET_REQUEST_TIMEOUT_MS
  );
  const items = Array.isArray(data?.quoteResponse?.result) ? data.quoteResponse.result : [];
  const watchlistMap = new Map(STOCK_WATCHLIST.map((entry) => [entry.symbol, entry.name]));
  const mapped = items.map((item) => {
    const symbol = safeString(item?.symbol, 16).toUpperCase();
    const price = toNumberOrNull(item?.regularMarketPrice);
    if (!symbol || price === null) return null;
    const change = toNumberOrNull(item?.regularMarketChange) || 0;
    const changePercent = toNumberOrNull(item?.regularMarketChangePercent) || 0;
    const volumeNumeric = toNumberOrNull(item?.regularMarketVolume);
    const marketCapNumeric = toNumberOrNull(item?.marketCap);
    const fallbackSparkline = MOCK_STOCK_QUOTES.find((quote) => quote.symbol === symbol)?.sparkline || [price];
    const sparkline = appendSparklinePoint(symbol, price, fallbackSparkline);
    return {
      symbol,
      name: safeString(item?.shortName || item?.longName || watchlistMap.get(symbol) || symbol, 80),
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: volumeNumeric !== null ? formatCompactNumber(volumeNumeric) : 'N/A',
      marketCap: marketCapNumeric !== null ? formatCompactNumber(marketCapNumeric) : 'N/A',
      sparkline
    };
  }).filter(Boolean);

  if (!mapped.length) {
    throw new Error('stocks_empty_payload');
  }

  const ordered = STOCK_WATCHLIST
    .map((entry) => mapped.find((quote) => quote.symbol === entry.symbol))
    .filter(Boolean);

  return {
    quotes: ordered,
    source: sourceName,
    mode: 'live'
  };
};

const loadStockQuotes = async () => {
  const now = Date.now();
  if (Array.isArray(stockQuotesCache.quotes) && stockQuotesCache.quotes.length && now - stockQuotesCache.timestamp < MARKET_CACHE_TTL_MS) {
    return stockQuotesCache;
  }

  try {
    const live = await fetchStockQuotesFromYahoo();
    stockQuotesCache = {
      timestamp: now,
      mode: live.mode,
      source: live.source,
      quotes: live.quotes
    };
    return stockQuotesCache;
  } catch {
    const fallbackQuotes = MOCK_STOCK_QUOTES.map((quote) => {
      const sparkline = appendSparklinePoint(quote.symbol, quote.price, quote.sparkline);
      return {
        ...quote,
        sparkline
      };
    });
    stockQuotesCache = {
      timestamp: now,
      mode: 'fallback',
      source: 'static_fallback',
      quotes: fallbackQuotes
    };
    return stockQuotesCache;
  }
};

const fetchCryptoTickerFromCoinGecko = async () => {
  const ids = CRYPTO_WATCHLIST.map((entry) => entry.id).join(',');
  const data = await fetchJsonWithTimeout(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`,
    {
      headers: { 'User-Agent': 'BlackPapersBot/1.0' }
    },
    MARKET_REQUEST_TIMEOUT_MS
  );
  const items = CRYPTO_WATCHLIST.map((entry) => {
    const payload = data?.[entry.id] || {};
    const price = toNumberOrNull(payload.usd);
    const changePercent = toNumberOrNull(payload.usd_24h_change);
    if (price === null) return null;
    return {
      symbol: entry.symbol,
      name: entry.name,
      price: Number(price.toFixed(6)),
      changePercent: Number((changePercent || 0).toFixed(2))
    };
  }).filter(Boolean);
  if (!items.length) {
    throw new Error('crypto_empty_payload');
  }
  return {
    mode: 'live',
    source: 'coingecko',
    items
  };
};

const loadCryptoTicker = async () => {
  const now = Date.now();
  if (Array.isArray(cryptoTickerCache.items) && cryptoTickerCache.items.length && now - cryptoTickerCache.timestamp < MARKET_CACHE_TTL_MS) {
    return cryptoTickerCache;
  }

  try {
    const live = await fetchCryptoTickerFromCoinGecko();
    cryptoTickerCache = {
      timestamp: now,
      mode: live.mode,
      source: live.source,
      items: live.items
    };
    return cryptoTickerCache;
  } catch {
    cryptoTickerCache = {
      timestamp: now,
      mode: 'fallback',
      source: 'static_fallback',
      items: FALLBACK_MARKET_TICKER.crypto.map((item) => ({ ...item }))
    };
    return cryptoTickerCache;
  }
};

const getMarketTickerSnapshot = async () => {
  const [stocks, cryptoTicker] = await Promise.all([
    loadStockQuotes(),
    loadCryptoTicker()
  ]);
  const tickerStocks = (stocks?.quotes || []).slice(0, 10).map((item) => ({
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    changePercent: item.changePercent
  }));
  const tickerCrypto = (cryptoTicker?.items || []).slice(0, 10).map((item) => ({
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    changePercent: item.changePercent
  }));
  const mode = stocks.mode === 'live' && cryptoTicker.mode === 'live'
    ? 'live'
    : (stocks.mode === 'fallback' && cryptoTicker.mode === 'fallback' ? 'fallback' : 'partial');
  return {
    mode,
    sources: {
      stocks: stocks.source,
      crypto: cryptoTicker.source
    },
    stocks: tickerStocks.length ? tickerStocks : FALLBACK_MARKET_TICKER.stocks,
    crypto: tickerCrypto.length ? tickerCrypto : FALLBACK_MARKET_TICKER.crypto,
    updatedAt: new Date().toISOString()
  };
};

const buildLemonWebhookSignature = (rawBody) => crypto
  .createHmac('sha256', LEMON_SQUEEZY_WEBHOOK_SECRET)
  .update(String(rawBody || ''))
  .digest('hex');

const verifyLemonWebhookSignature = (rawBody, signatureHeader) => {
  if (!LEMON_SQUEEZY_WEBHOOK_SECRET) return false;
  const received = safeString(signatureHeader, 256);
  if (!received) return false;
  const normalizedReceived = received.includes('=')
    ? received.split('=').pop()
    : received;
  const expected = buildLemonWebhookSignature(rawBody);
  if (!normalizedReceived || !expected) return false;
  const receivedBuffer = Buffer.from(normalizedReceived, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const lemonStatusToInternalStatus = (statusRaw, eventNameRaw) => {
  const status = safeString(statusRaw, 64).toLowerCase();
  const eventName = safeString(eventNameRaw, 80).toLowerCase();
  if (eventName.includes('cancel') || eventName.includes('expired')) return 'CANCELED';
  if (eventName.includes('payment_failed') || eventName.includes('payment_refunded')) return 'PAST_DUE';
  if (['active', 'on_trial', 'paid'].includes(status)) return 'ACTIVE';
  if (['past_due', 'unpaid'].includes(status)) return 'PAST_DUE';
  if (['cancelled', 'canceled', 'expired'].includes(status)) return 'CANCELED';
  return 'PENDING_VERIFICATION';
};

const resolvePlanFromLemonVariantId = (variantIdRaw) => {
  const variantId = safeString(variantIdRaw, 64);
  if (!variantId) return null;
  return LEMON_PLAN_BY_VARIANT_ID[variantId] || null;
};

const extractLemonEventPayload = (payload) => {
  const data = payload?.data || {};
  const attributes = data?.attributes || {};
  const relationships = data?.relationships || {};
  const variantFromRelationship = safeString(relationships?.variant?.data?.id, 64);
  const productFromRelationship = safeString(relationships?.store?.data?.id, 64);
  const customData = attributes?.custom_data && typeof attributes.custom_data === 'object'
    ? attributes.custom_data
    : (payload?.meta?.custom_data && typeof payload.meta.custom_data === 'object' ? payload.meta.custom_data : {});

  const eventName = safeString(payload?.meta?.event_name, 80).toLowerCase();
  const userId = safeString(customData?.user_id, 128);
  const userEmail = normalizeEmail(customData?.user_email || attributes?.user_email || attributes?.customer_email || '');
  const variantId = safeString(
    attributes?.variant_id
      || attributes?.first_subscription_item?.variant_id
      || attributes?.first_order_item?.variant_id
      || variantFromRelationship,
    64
  );
  const planFromCustomData = normalizeSubscriptionPlan(customData?.plan, false);
  const planFromVariant = resolvePlanFromLemonVariantId(variantId);
  const plan = planFromVariant
    || (planFromCustomData !== 'NONE' ? planFromCustomData : null)
    || 'NONE';
  const internalStatus = lemonStatusToInternalStatus(attributes?.status, eventName);
  const amountCandidates = [
    attributes?.subtotal,
    attributes?.subtotal_usd,
    attributes?.total,
    attributes?.total_usd,
    attributes?.price,
    attributes?.first_order_item?.price,
    attributes?.first_subscription_item?.price
  ];
  let paidAmount = null;
  for (const candidate of amountCandidates) {
    const parsed = Number(candidate);
    if (!Number.isFinite(parsed) || parsed <= 0) continue;
    const normalized = Number.isInteger(parsed) && parsed >= 1000
      ? Number((parsed / 100).toFixed(2))
      : Number(parsed.toFixed(2));
    paidAmount = normalized;
    break;
  }
  const paidCurrency = sanitizeCurrencyCode(
    attributes?.currency
      || attributes?.currency_code
      || attributes?.billing_currency
      || attributes?.first_order_item?.currency
      || 'USD',
    'USD'
  );
  const isPaymentEvent = [
    'order_created',
    'subscription_created',
    'subscription_payment_success',
    'subscription_payment_recovered'
  ].includes(eventName);
  const paymentAt = safeString(
    attributes?.created_at
      || attributes?.updated_at
      || attributes?.renews_at,
    64
  ) || null;
  return {
    eventName,
    userId,
    userEmail,
    plan,
    status: internalStatus,
    lemonSubscriptionId: safeString(data?.id || attributes?.subscription_id, 128) || null,
    lemonCustomerId: safeString(attributes?.customer_id || attributes?.user_id, 128) || null,
    lemonOrderId: safeString(attributes?.order_id || attributes?.identifier, 128) || null,
    lemonVariantId: variantId || null,
    lemonProductId: safeString(attributes?.product_id || productFromRelationship, 128) || null,
    lemonProductName: safeString(attributes?.product_name || attributes?.variant_name, 160) || null,
    currentPeriodStart: safeString(
      attributes?.current_period_start
        || attributes?.trial_starts_at
        || attributes?.created_at
        || attributes?.updated_at,
      64
    ) || null,
    currentPeriodEnd: safeString(attributes?.renews_at || attributes?.ends_at || attributes?.trial_ends_at, 64) || null,
    canceledAt: safeString(attributes?.cancelled_at || attributes?.ends_at, 64) || null,
    paidAmount,
    paidCurrency,
    isPaymentEvent,
    paymentAt
  };
};

const applyLemonSubscriptionEventToUser = (user, lemonEvent) => {
  const nowIso = new Date().toISOString();
  user.billing = normalizeBillingProfile(user.billing);
  user.billing.provider = 'LEMON_SQUEEZY';
  user.billing.lemonCustomerId = lemonEvent.lemonCustomerId;
  user.billing.lemonSubscriptionId = lemonEvent.lemonSubscriptionId;
  user.billing.lemonOrderId = lemonEvent.lemonOrderId;
  user.billing.lemonVariantId = lemonEvent.lemonVariantId;
  user.billing.lemonProductId = lemonEvent.lemonProductId;
  user.billing.lemonProductName = lemonEvent.lemonProductName;
  user.billing.currentPeriodStart = lemonEvent.currentPeriodStart || user.billing.currentPeriodStart || nowIso;
  user.billing.currentPeriodEnd = lemonEvent.currentPeriodEnd;
  user.billing.canceledAt = lemonEvent.status === 'CANCELED' ? (lemonEvent.canceledAt || nowIso) : null;
  user.billing.lastWebhookEvent = lemonEvent.eventName || null;
  user.billing.lastWebhookAt = nowIso;
  user.billing.lastPaymentChannel = 'CARD_AUTO';
  if (parsePositiveCurrencyAmount(lemonEvent.paidAmount) !== null) {
    user.billing.lastPaidAmount = parsePositiveCurrencyAmount(lemonEvent.paidAmount);
    user.billing.lastPaidCurrency = sanitizeCurrencyCode(lemonEvent.paidCurrency || user.billing.lastPaidCurrency || 'USD', 'USD');
  } else if (lemonEvent.isPaymentEvent && parsePositiveCurrencyAmount(user.billing.lastPaidAmount) === null) {
    const fallbackPlanAmount = roundCurrencyAmount(resolvePlanReferencePriceEur(lemonEvent.plan || user.subscriptionPlan));
    user.billing.lastPaidAmount = fallbackPlanAmount > 0 ? fallbackPlanAmount : user.billing.lastPaidAmount;
    user.billing.lastPaidCurrency = sanitizeCurrencyCode(user.billing.lastPaidCurrency || 'USD', 'USD');
  }
  if (lemonEvent.isPaymentEvent) {
    user.billing.lastPaymentAt = lemonEvent.paymentAt || nowIso;
  }

  if (lemonEvent.plan && lemonEvent.plan !== 'NONE') {
    user.subscriptionPlan = lemonEvent.plan;
  }
  user.subscriptionStatus = lemonEvent.status;
  user.subscriptionUpdatedAt = nowIso;
  if (lemonEvent.status === 'ACTIVE') {
    user.subscriptionStartedAt = user.subscriptionStartedAt || user.billing.currentPeriodStart || nowIso;
  }
  applyUserAccessConsistency(user);
};

const lemonApiRequest = async (endpointPath, payload) => {
  if (!LEMON_SQUEEZY_API_KEY) {
    throw new Error('lemon_api_key_missing');
  }
  const response = await fetchWithTimeout(`https://api.lemonsqueezy.com/v1${endpointPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json'
    },
    body: JSON.stringify(payload)
  }, 12000);
  const jsonBody = await parseJsonSafely(response);
  if (!response.ok || !jsonBody) {
    throw new Error('lemon_api_request_failed');
  }
  return jsonBody;
};

const createLemonCheckout = async ({ user, plan, successUrl, cancelUrl }) => {
  const variantId = lemonPlanVariantId(plan);
  if (!variantId) {
    const checkoutUrl = lemonPlanCheckoutUrl(plan);
    if (!checkoutUrl) {
      throw new Error('lemon_plan_not_configured');
    }
    return {
      url: checkoutUrl,
      mode: 'url',
      checkoutId: null,
      variantId: null
    };
  }

  if (LEMON_API_MODE !== 'api') {
    const checkoutUrl = lemonPlanCheckoutUrl(plan);
    if (!checkoutUrl) {
      throw new Error('lemon_api_not_ready');
    }
    return {
      url: checkoutUrl,
      mode: 'url',
      checkoutId: null,
      variantId
    };
  }

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: user.email,
          custom: {
            user_id: user.id,
            user_email: user.email,
            plan
          }
        },
        product_options: {
          redirect_url: successUrl,
          receipt_button_text: 'Retour a Black Papers',
          receipt_link_url: successUrl
        },
        checkout_options: {
          embed: false,
          media: true,
          logo: true
        },
        preview: false
      },
      relationships: {
        store: { data: { type: 'stores', id: LEMON_SQUEEZY_STORE_ID } },
        variant: { data: { type: 'variants', id: variantId } }
      }
    }
  };
  if (cancelUrl) {
    payload.data.attributes.product_options.cancel_url = cancelUrl;
  }

  const response = await lemonApiRequest('/checkouts', payload);
  return {
    url: safeString(response?.data?.attributes?.url, 2048),
    mode: 'api',
    checkoutId: safeString(response?.data?.id, 128) || null,
    variantId
  };
};

const isSubscriptionActive = (user) => {
  if (!user || typeof user !== 'object') return false;
  const status = normalizeSubscriptionStatus(user.subscriptionStatus, Boolean(user.isAdmin));
  return status === 'ACTIVE' || status === 'ADMIN' || isCancellationGracePeriodActive(user);
};

const resolveUserPermissions = (user) => {
  if (!user) {
    return {
      vipAccess: false,
      canAccessCryptoSignals: false,
      canAccessBourseSignals: false,
      canAccessTraining: false
    };
  }

  if (Boolean(user.isAdmin) || Boolean(user.manualVipAccess)) {
    return {
      vipAccess: true,
      canAccessCryptoSignals: true,
      canAccessBourseSignals: true,
      canAccessTraining: true
    };
  }

  const plan = normalizeSubscriptionPlan(user.subscriptionPlan, Boolean(user.isAdmin));
  const active = isSubscriptionActive(user);
  if (!active) {
    return {
      vipAccess: false,
      canAccessCryptoSignals: false,
      canAccessBourseSignals: false,
      canAccessTraining: false
    };
  }

  const canAccessCryptoSignals = plan === 'combo' || plan === 'crypto';
  const canAccessBourseSignals = plan === 'combo' || plan === 'bourse';
  const vipAccess = canAccessCryptoSignals || canAccessBourseSignals;
  return {
    vipAccess,
    canAccessCryptoSignals,
    canAccessBourseSignals,
    canAccessTraining: vipAccess
  };
};

const hasPremiumAccess = (user) => resolveUserPermissions(user).vipAccess;

const computeLeadStatusFromUser = (user) => {
  if (!user) return 'LEAD';
  const permissions = resolveUserPermissions(user);
  return permissions.vipAccess ? 'VIP_ACTIVE' : 'REGISTERED';
};

const maybeRecordAffiliateCommission = (ownerUser, referredUser, referralRecord, options = {}) => {
  if (!ownerUser || !referredUser || !referralRecord) return;
  if (!options.recordCommissionEvent) return;
  if (referralRecord.commissionModel !== 'CRYPTO_50_PERCENT_MANUAL') return;
  if (!referralRecord.subscriptionActive || referralRecord.commissionAmount <= 0) return;
  if (!ownerUser.affiliateProfile || typeof ownerUser.affiliateProfile !== 'object' || Array.isArray(ownerUser.affiliateProfile)) {
    ownerUser.affiliateProfile = defaultAffiliateProfile(ownerUser.email, Boolean(ownerUser.isAdmin));
  }
  if (!Array.isArray(ownerUser.affiliateProfile.commissionHistory)) {
    ownerUser.affiliateProfile.commissionHistory = [];
  }

  const eventKey = buildAffiliateCommissionEventKey(referredUser, options);
  const alreadyExists = ownerUser.affiliateProfile.commissionHistory.some(
    (entry) => safeString(entry?.eventKey, 191) === eventKey
  );
  if (alreadyExists) return;

  const nowIso = new Date().toISOString();
  ownerUser.affiliateProfile.commissionHistory.unshift({
    id: `comm-${crypto.randomUUID()}`,
    amount: referralRecord.commissionAmount,
    sourceUser: safeString(referredUser.email, 120),
    dateCreated: nowIso.slice(0, 10),
    status: 'READY_TO_PAY',
    payoutMethod: 'CRYPTO',
    eventKey,
    source: safeString(options.source, 48) || 'manual_subscription_verify',
    relatedReferralId: referralRecord.id,
    createdAt: nowIso
  });
  ownerUser.affiliateProfile.commissionHistory = ownerUser.affiliateProfile.commissionHistory.slice(0, 300);

  referredUser.billing = normalizeBillingProfile(referredUser.billing);
  referredUser.billing.lastAffiliateCommissionEventKey = eventKey;
};

const upsertAffiliateReferralForOwner = (ownerUser, referredUser, options = {}) => {
  if (!ownerUser || !referredUser) return;
  if (!ownerUser.affiliateProfile || typeof ownerUser.affiliateProfile !== 'object' || Array.isArray(ownerUser.affiliateProfile)) {
    ownerUser.affiliateProfile = defaultAffiliateProfile(ownerUser.email, Boolean(ownerUser.isAdmin));
  }
  if (!Array.isArray(ownerUser.affiliateProfile.referrals)) {
    ownerUser.affiliateProfile.referrals = [];
  }
  ownerUser.affiliateProfile.isAffiliate = true;

  const referredEmail = normalizeEmail(referredUser.email);
  const existingIndex = ownerUser.affiliateProfile.referrals.findIndex(
    (item) => normalizeEmail(item?.email || item?.pseudo || '') === referredEmail
  );
  const permissions = resolveUserPermissions(referredUser);
  const billingProfile = normalizeBillingProfile(referredUser.billing);
  const normalizedPlan = normalizeSubscriptionPlan(referredUser.subscriptionPlan, false);
  const normalizedStatus = normalizeSubscriptionStatus(referredUser.subscriptionStatus, Boolean(referredUser.isAdmin));
  const paymentProvider = billingProfile.provider;
  const paymentChannel = resolveReferralPaymentChannel(billingProfile);
  const commissionModel = resolveReferralCommissionModel(paymentProvider);
  const paidAmount = resolveReferralPaidAmount(referredUser, billingProfile);
  const commissionAmount = permissions.vipAccess && commissionModel === 'CRYPTO_50_PERCENT_MANUAL'
    ? roundCurrencyAmount(paidAmount * AFFILIATE_CRYPTO_COMMISSION_RATE)
    : 0;
  const commissionStatus = permissions.vipAccess && commissionAmount > 0 ? 'READY_TO_PAY' : 'LOCKED';
  const nowIso = new Date().toISOString();
  const nextReferral = {
    id: existingIndex >= 0
      ? safeString(ownerUser.affiliateProfile.referrals[existingIndex]?.id, 64) || `ref-${crypto.randomUUID()}`
      : `ref-${crypto.randomUUID()}`,
    pseudo: safeString(referredUser.email, 80),
    email: referredEmail,
    subscriptionPlan: normalizedPlan,
    subscriptionStatus: normalizedStatus,
    subscriptionActive: Boolean(permissions.vipAccess),
    paymentProvider,
    paymentChannel,
    commissionModel,
    commissionAmount,
    commissionStatus,
    followUpRequired: shouldAffiliateFollowUp(referredUser, paymentProvider),
    paidAmount,
    paidCurrency: sanitizeCurrencyCode(billingProfile.lastPaidCurrency || 'EUR'),
    lastPaymentAt: safeString(billingProfile.lastPaymentAt, 64) || null,
    updatedAt: nowIso,
    joinedAt: existingIndex >= 0
      ? safeString(ownerUser.affiliateProfile.referrals[existingIndex]?.joinedAt, 64) || new Date().toISOString()
      : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    ownerUser.affiliateProfile.referrals[existingIndex] = {
      ...ownerUser.affiliateProfile.referrals[existingIndex],
      ...nextReferral
    };
  } else {
    ownerUser.affiliateProfile.referrals.unshift(nextReferral);
  }
  maybeRecordAffiliateCommission(ownerUser, referredUser, nextReferral, options);
};

const resolveReferralAttribution = (store, rawReferralCode, referredEmail = '') => {
  const referralCode = sanitizeReferralCode(rawReferralCode);
  if (!referralCode) return null;
  const owner = findAffiliateOwnerByCode(store, referralCode);
  if (!owner) return null;
  const normalizedReferredEmail = normalizeEmail(referredEmail);
  if (normalizedReferredEmail && normalizedReferredEmail === normalizeEmail(owner.email)) {
    return null;
  }

  const ownerReferralCode = ensureUserReferralCode(store, owner, false);
  owner.affiliateProfile.isAffiliate = true;
  return {
    owner,
    referralCode: ownerReferralCode,
    referralOwnerEmail: normalizeEmail(owner.email),
    sourceLabel: `affiliate_${ownerReferralCode.slice(0, 24)}`
  };
};

const syncReferralAttributionForUser = (store, user, options = {}) => {
  if (!store || !user || typeof user !== 'object') return;
  const ownerId = safeString(user.referredByUserId, 128);
  const ownerById = ownerId
    ? store.users.find((candidate) => candidate.id === ownerId)
    : null;
  const ownerByCode = !ownerById
    ? findAffiliateOwnerByCode(store, user.referredByCode)
    : null;
  const owner = ownerById || ownerByCode || null;
  if (!owner || owner.id === user.id) return;

  const ownerCode = ensureUserReferralCode(store, owner, false);
  user.referredByUserId = owner.id;
  user.referredByEmail = normalizeEmail(owner.email);
  user.referredByCode = ownerCode;
  upsertAffiliateReferralForOwner(owner, user, options);
};

const upsertLeadFromEmail = (store, email, source = 'unknown', linkedUser = null, options = {}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return null;
  }
  const referralCode = sanitizeReferralCode(options?.referralCode);
  const referralOwnerEmail = normalizeEmail(options?.referralOwnerEmail || '');
  if (!Array.isArray(store.leads)) {
    store.leads = defaultLeads();
  }
  const nowIso = new Date().toISOString();
  const user = linkedUser || store.users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail) || null;
  const existingIndex = store.leads.findIndex((lead) => normalizeEmail(lead.email) === normalizedEmail);
  if (existingIndex === -1) {
    const nextLead = defaultLeadRecord(normalizedEmail, source);
    if (user) {
      nextLead.userId = user.id;
      nextLead.subscriptionPlan = user.subscriptionPlan || 'NONE';
      nextLead.subscriptionStatus = user.subscriptionStatus || 'NONE';
      nextLead.status = computeLeadStatusFromUser(user);
      nextLead.lastEvent = user ? 'account_linked' : 'captured';
    }
    if (referralCode) {
      nextLead.referralCode = referralCode;
    }
    if (referralOwnerEmail) {
      nextLead.referralOwnerEmail = referralOwnerEmail;
    }
    nextLead.updatedAt = nowIso;
    store.leads.unshift(nextLead);
    store.leads = store.leads.slice(0, 10000);
    return nextLead;
  }

  const existing = sanitizeLeadRecordForStore(store.leads[existingIndex], existingIndex) || defaultLeadRecord(normalizedEmail, source);
  existing.source = existing.source || safeString(source, 64) || 'unknown';
  if (source && source !== 'unknown') {
    existing.source = safeString(source, 64);
  }
  if (referralCode) {
    existing.referralCode = referralCode;
  }
  if (referralOwnerEmail) {
    existing.referralOwnerEmail = referralOwnerEmail;
  }
  if (user) {
    existing.userId = user.id;
    existing.subscriptionPlan = user.subscriptionPlan || 'NONE';
    existing.subscriptionStatus = user.subscriptionStatus || 'NONE';
    existing.status = computeLeadStatusFromUser(user);
    existing.lastEvent = existing.status === 'VIP_ACTIVE' ? 'vip_activated' : 'account_linked';
  } else if (!existing.userId) {
    existing.status = 'LEAD';
    existing.lastEvent = 'captured';
  }
  existing.updatedAt = nowIso;
  store.leads[existingIndex] = existing;
  return existing;
};

const buildCrmOverview = (store) => {
  const users = Array.isArray(store?.users) ? store.users : [];
  const leads = Array.isArray(store?.leads) ? store.leads : [];
  const nonAdminUsers = users.filter((user) => !user.isAdmin);
  const vipUsers = nonAdminUsers.filter((user) => resolveUserPermissions(user).vipAccess);
  const onboardingPending = nonAdminUsers.filter((user) => Boolean(user.needsOnboarding)).length;
  const pendingVerification = nonAdminUsers.filter((user) => user.subscriptionStatus === 'PENDING_VERIFICATION').length;
  const canceled = nonAdminUsers.filter((user) => user.subscriptionStatus === 'CANCELED').length;

  const planBreakdown = nonAdminUsers.reduce((acc, user) => {
    const plan = normalizeSubscriptionPlan(user.subscriptionPlan, false);
    if (plan === 'NONE') return acc;
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const affiliates = nonAdminUsers
    .map((user) => {
      const affiliateProfile = user?.affiliateProfile && typeof user.affiliateProfile === 'object' && !Array.isArray(user.affiliateProfile)
        ? user.affiliateProfile
        : defaultAffiliateProfile(user?.email, false);
      const referralsRaw = Array.isArray(affiliateProfile.referrals) ? affiliateProfile.referrals : [];
      const referrals = referralsRaw
        .map((referral, index) => {
          const pseudo = sanitizeText(referral?.pseudo, 80);
          if (!pseudo) return null;
          const subscriptionPlan = normalizeSubscriptionPlan(referral?.subscriptionPlan, false);
          const subscriptionStatus = normalizeSubscriptionStatus(referral?.subscriptionStatus, false);
          const paymentProvider = ['NONE', 'MANUAL', 'LEMON_SQUEEZY'].includes(safeString(referral?.paymentProvider, 32).toUpperCase())
            ? safeString(referral?.paymentProvider, 32).toUpperCase()
            : 'NONE';
          const paymentChannel = ['CRYPTO_MANUAL', 'CARD_AUTO', 'UNKNOWN'].includes(safeString(referral?.paymentChannel, 32).toUpperCase())
            ? safeString(referral?.paymentChannel, 32).toUpperCase()
            : 'UNKNOWN';
          const commissionModel = safeString(referral?.commissionModel, 64) || resolveReferralCommissionModel(paymentProvider);
          const commissionAmount = Math.max(0, Number(referral?.commissionAmount || 0));
          const commissionStatus = ['LOCKED', 'READY_TO_PAY', 'PAID'].includes(String(referral?.commissionStatus || '').toUpperCase())
            ? String(referral?.commissionStatus).toUpperCase()
            : 'LOCKED';
          return {
            id: safeString(referral?.id, 64) || `ref-${index + 1}`,
            pseudo,
            subscriptionPlan,
            subscriptionStatus,
            subscriptionActive: Boolean(referral?.subscriptionActive),
            paymentProvider,
            paymentChannel,
            commissionModel,
            commissionAmount,
            commissionStatus,
            followUpRequired: Boolean(referral?.followUpRequired),
            paidAmount: Math.max(0, Number(referral?.paidAmount || 0)),
            paidCurrency: sanitizeCurrencyCode(referral?.paidCurrency || 'EUR'),
            lastPaymentAt: safeString(referral?.lastPaymentAt, 64) || null,
            updatedAt: safeString(referral?.updatedAt, 64) || null,
            joinedAt: safeString(referral?.joinedAt, 64) || null
          };
        })
        .filter(Boolean);

      if (!referrals.length) return null;
      const activeReferrals = referrals.filter((referral) => referral.subscriptionActive).length;
      const followUpRequiredCount = referrals.filter((referral) => referral.followUpRequired).length;
      const totalCommissionAmount = referrals.reduce((sum, referral) => sum + Number(referral.commissionAmount || 0), 0);
      return {
        ownerUserId: safeString(user?.id, 128) || null,
        ownerEmail: normalizeEmail(user?.email || ''),
        referralCode: sanitizeReferralCode(affiliateProfile.referralCode) || null,
        referralsCount: referrals.length,
        activeReferralsCount: activeReferrals,
        followUpRequiredCount,
        totalCommissionAmount: Number(totalCommissionAmount.toFixed(2)),
        referrals: referrals.slice(0, 500)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.referralsCount - a.referralsCount || b.activeReferralsCount - a.activeReferralsCount);

  return {
    funnel: {
      leadsCaptured: leads.length,
      registeredUsers: nonAdminUsers.length,
      vipActiveUsers: vipUsers.length,
      onboardingPending,
      pendingVerification,
      canceledUsers: canceled
    },
    plans: planBreakdown,
    affiliates,
    leads: leads
      .slice()
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      .slice(0, 500)
      .map(publicLead)
  };
};

const escapeCsvCell = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCrmLeadsCsv = (store) => {
  const overview = buildCrmOverview(store);
  const headers = [
    'email',
    'source',
    'referral_code',
    'referral_owner_email',
    'status',
    'subscription_plan',
    'subscription_status',
    'last_event',
    'created_at',
    'updated_at'
  ];
  const rows = overview.leads.map((lead) => ([
    lead.email,
    lead.source,
    lead.referralCode || '',
    lead.referralOwnerEmail || '',
    lead.status,
    lead.subscriptionPlan,
    lead.subscriptionStatus,
    lead.lastEvent,
    lead.createdAt,
    lead.updatedAt
  ]));
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
};

const maskEmailAddress = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return 'membre';
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;
  const visibleLocal = localPart.length <= 2
    ? `${localPart.charAt(0)}*`
    : `${localPart.slice(0, 2)}${'*'.repeat(Math.max(localPart.length - 2, 1))}`;
  const domainParts = domain.split('.');
  const domainRoot = domainParts[0] || 'mail';
  const domainSuffix = domainParts.slice(1).join('.') || 'com';
  const visibleDomain = domainRoot.length <= 2
    ? `${domainRoot.charAt(0)}*`
    : `${domainRoot.slice(0, 2)}${'*'.repeat(Math.max(domainRoot.length - 2, 1))}`;
  return `${visibleLocal}@${visibleDomain}.${domainSuffix}`;
};

const publicXFeedAccount = (entry, index = 0) => {
  const sanitized = sanitizeXFeedAccountForStore(entry, index);
  if (!sanitized) return null;
  return {
    id: sanitized.id,
    name: sanitized.name,
    handle: sanitized.handle,
    focus: sanitized.focus,
    url: sanitized.url
  };
};

const publicXFeed = (xFeed) => {
  const fallback = defaultXFeed();
  const source = xFeed && typeof xFeed === 'object' && !Array.isArray(xFeed) ? xFeed : fallback;
  const accountsRaw = Array.isArray(source.accounts) ? source.accounts : fallback.accounts;
  const accounts = accountsRaw.map((entry, index) => publicXFeedAccount(entry, index)).filter(Boolean).slice(0, X_FEED_MAX_ACCOUNTS);
  return {
    mode: safeString(source.mode, 32) || 'curated_manual',
    updatedAt: parseDateToIso(source.updatedAt, new Date().toISOString()),
    accounts: accounts.length ? accounts : fallback.accounts
  };
};

const buildVipActivitySnapshot = (store) => {
  const users = Array.isArray(store?.users) ? store.users : [];
  const sessions = store?.sessions && typeof store.sessions === 'object' ? Object.values(store.sessions) : [];
  const nowMs = Date.now();
  const activeWindowMs = Math.max(1, VIP_ACTIVITY_WINDOW_MINUTES) * 60 * 1000;
  const dayWindowMs = 24 * 60 * 60 * 1000;

  const vipUsers = users.filter((user) => resolveUserPermissions(user).vipAccess);
  const vipUserById = new Map(vipUsers.map((user) => [user.id, user]));

  const activeNow = new Set();
  const active24h = new Set();
  const recentActivityRaw = [];

  sessions.forEach((session) => {
    if (!session || typeof session !== 'object') return;
    if (isSessionExpired(session, nowMs)) return;
    const user = vipUserById.get(safeString(session.userId, 128));
    if (!user) return;
    const lastSeenMs = Date.parse(String(session.updatedAt || session.createdAt || ''));
    if (!Number.isFinite(lastSeenMs)) return;
    const delta = nowMs - lastSeenMs;
    if (delta <= activeWindowMs) {
      activeNow.add(user.id);
    }
    if (delta <= dayWindowMs) {
      active24h.add(user.id);
    }
    recentActivityRaw.push({
      userId: user.id,
      emailMasked: maskEmailAddress(user.email),
      subscriptionPlan: user.subscriptionPlan || 'NONE',
      lastSeenAt: new Date(lastSeenMs).toISOString()
    });
  });

  const recentByUser = new Map();
  recentActivityRaw
    .sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt))
    .forEach((entry) => {
      if (!recentByUser.has(entry.userId)) {
        recentByUser.set(entry.userId, entry);
      }
    });

  return {
    windowMinutes: VIP_ACTIVITY_WINDOW_MINUTES,
    totalVipMembers: vipUsers.length,
    activeNow: activeNow.size,
    active24h: active24h.size,
    recentActivity: Array.from(recentByUser.values()).slice(0, 8),
    updatedAt: new Date().toISOString()
  };
};

const publicReferral = (referral) => ({
  id: safeString(referral?.id, 64) || `ref-${crypto.randomUUID()}`,
  pseudo: sanitizeText(referral?.pseudo, 80),
  subscriptionPlan: sanitizeText(referral?.subscriptionPlan, 32) || 'NONE',
  subscriptionStatus: normalizeSubscriptionStatus(referral?.subscriptionStatus, false),
  subscriptionActive: Boolean(referral?.subscriptionActive),
  paymentProvider: ['NONE', 'MANUAL', 'LEMON_SQUEEZY'].includes(safeString(referral?.paymentProvider, 32).toUpperCase())
    ? safeString(referral?.paymentProvider, 32).toUpperCase()
    : 'NONE',
  paymentChannel: ['CRYPTO_MANUAL', 'CARD_AUTO', 'UNKNOWN'].includes(safeString(referral?.paymentChannel, 32).toUpperCase())
    ? safeString(referral?.paymentChannel, 32).toUpperCase()
    : 'UNKNOWN',
  commissionModel: safeString(referral?.commissionModel, 64) || resolveReferralCommissionModel(referral?.paymentProvider),
  commissionAmount: Math.max(0, Number(referral?.commissionAmount || 0)),
  commissionStatus: ['LOCKED', 'READY_TO_PAY', 'PAID'].includes(String(referral?.commissionStatus || '').toUpperCase())
    ? String(referral.commissionStatus).toUpperCase()
    : 'LOCKED',
  followUpRequired: Boolean(referral?.followUpRequired),
  paidAmount: roundCurrencyAmount(referral?.paidAmount),
  paidCurrency: sanitizeCurrencyCode(referral?.paidCurrency || 'EUR'),
  lastPaymentAt: safeString(referral?.lastPaymentAt, 64) || null,
  updatedAt: safeString(referral?.updatedAt, 64) || null,
  joinedAt: safeString(referral?.joinedAt, 64) || null
});

const publicCommission = (commission) => ({
  id: safeString(commission?.id, 64) || `comm-${crypto.randomUUID()}`,
  amount: Math.max(0, Number(commission?.amount || 0)),
  sourceUser: sanitizeText(commission?.sourceUser, 120),
  dateCreated: safeString(commission?.dateCreated, 64) || null,
  status: ['LOCKED', 'READY_TO_PAY', 'PAID'].includes(String(commission?.status || '').toUpperCase())
    ? String(commission.status).toUpperCase()
    : 'LOCKED',
  payoutMethod: sanitizeText(commission?.payoutMethod, 32) || 'N/A'
});

const publicAffiliateProfile = (affiliateProfile) => ({
  isAffiliate: Boolean(affiliateProfile?.isAffiliate),
  referralCode: sanitizeText(affiliateProfile?.referralCode, 32) || null,
  referrals: Array.isArray(affiliateProfile?.referrals)
    ? affiliateProfile.referrals.slice(0, 200).map(publicReferral)
    : [],
  commissionHistory: Array.isArray(affiliateProfile?.commissionHistory)
    ? affiliateProfile.commissionHistory.slice(0, 300).map(publicCommission)
    : []
});

const publicBilling = (billing) => {
  const normalized = normalizeBillingProfile(billing);
  return {
    provider: normalized.provider,
    lemonSubscriptionId: normalized.lemonSubscriptionId,
    lemonOrderId: normalized.lemonOrderId,
    lemonProductName: normalized.lemonProductName,
    currentPeriodStart: normalized.currentPeriodStart,
    currentPeriodEnd: normalized.currentPeriodEnd,
    canceledAt: normalized.canceledAt,
    lastWebhookEvent: normalized.lastWebhookEvent,
    lastWebhookAt: normalized.lastWebhookAt,
    lastPaidAmount: normalized.lastPaidAmount,
    lastPaidCurrency: normalized.lastPaidCurrency,
    lastPaymentAt: normalized.lastPaymentAt,
    lastPaymentChannel: normalized.lastPaymentChannel
  };
};

const publicLead = (lead) => ({
  id: safeString(lead?.id, 128),
  email: normalizeEmail(lead?.email),
  source: safeString(lead?.source, 64) || 'unknown',
  status: normalizeLeadStatus(lead?.status),
  userId: safeString(lead?.userId, 128) || null,
  referralCode: sanitizeReferralCode(lead?.referralCode),
  referralOwnerEmail: normalizeEmail(lead?.referralOwnerEmail || '') || null,
  subscriptionPlan: normalizeSubscriptionPlan(lead?.subscriptionPlan, false),
  subscriptionStatus: normalizeSubscriptionStatus(lead?.subscriptionStatus, false),
  lastEvent: safeString(lead?.lastEvent, 80) || 'captured',
  createdAt: safeString(lead?.createdAt, 64) || null,
  updatedAt: safeString(lead?.updatedAt, 64) || null
});

const buildSubscriptionLifecycle = (user, nowMs = Date.now()) => {
  const billing = normalizeBillingProfile(user?.billing);
  const currentPeriodEnd = safeString(billing.currentPeriodEnd, 64) || null;
  const currentPeriodEndMs = parseIsoToMs(currentPeriodEnd);
  const status = normalizeSubscriptionStatus(user?.subscriptionStatus, Boolean(user?.isAdmin));
  return {
    registeredAt: safeString(user?.createdAt, 64) || null,
    subscriptionStartedAt: safeString(user?.subscriptionStartedAt, 64) || null,
    currentPeriodStart: safeString(billing.currentPeriodStart, 64) || null,
    currentPeriodEnd,
    cancelRequestedAt: safeString(billing.canceledAt, 64) || null,
    accessEndsAt: resolveSubscriptionAccessEndsAt(user, nowMs),
    cancelAtPeriodEnd: status === 'CANCELED' && currentPeriodEndMs !== null && currentPeriodEndMs > nowMs
  };
};

const publicLemonConfig = () => {
  const state = resolveLemonIntegrationState();
  return {
    mode: state.mode,
    apiEnabled: state.apiEnabled,
    webhookEnabled: state.webhookEnabled,
    plans: state.plans
  };
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  isSubscribed: Boolean(user.isAdmin || user.isSubscribed),
  isAdmin: Boolean(user.isAdmin),
  manualVipAccess: Boolean(user.manualVipAccess),
  needsOnboarding: Boolean(user.needsOnboarding),
  emailVerified: Boolean(user.emailVerified),
  referredByCode: sanitizeReferralCode(user.referredByCode),
  referredByEmail: normalizeEmail(user.referredByEmail || '') || null,
  subscriptionPlan: user.subscriptionPlan || (user.isAdmin ? 'ADMIN' : 'NONE'),
  subscriptionStatus: user.subscriptionStatus || (user.isAdmin ? 'ADMIN' : (user.isSubscribed ? 'ACTIVE' : 'NONE')),
  subscriptionUpdatedAt: user.subscriptionUpdatedAt || null,
  subscriptionStartedAt: user.subscriptionStartedAt || null,
  createdAt: user.createdAt || null,
  permissions: resolveUserPermissions(user),
  subscriptionLifecycle: buildSubscriptionLifecycle(user),
  affiliateProfile: publicAffiliateProfile(user.affiliateProfile),
  billing: publicBilling(user.billing)
});

const adminUserSummary = (user) => ({
  id: user.id,
  email: user.email,
  isSubscribed: Boolean(user.isAdmin || user.isSubscribed),
  isAdmin: Boolean(user.isAdmin),
  manualVipAccess: Boolean(user.manualVipAccess),
  needsOnboarding: Boolean(user.needsOnboarding),
  emailVerified: Boolean(user.emailVerified),
  referredByCode: sanitizeReferralCode(user.referredByCode),
  referredByEmail: normalizeEmail(user.referredByEmail || '') || null,
  subscriptionPlan: user.subscriptionPlan || (user.isAdmin ? 'ADMIN' : 'NONE'),
  subscriptionStatus: user.subscriptionStatus || (user.isAdmin ? 'ADMIN' : (user.isSubscribed ? 'ACTIVE' : 'NONE')),
  subscriptionUpdatedAt: user.subscriptionUpdatedAt || null,
  subscriptionStartedAt: user.subscriptionStartedAt || null,
  permissions: resolveUserPermissions(user),
  subscriptionLifecycle: buildSubscriptionLifecycle(user),
  billing: publicBilling(user.billing),
  createdAt: user.createdAt || null
});

const publicPost = (post, permissions = {}) => {
  if (!post || typeof post !== 'object') return null;
  const canViewLocked = Boolean(permissions?.vipAccess);
  const normalized = {
    id: sanitizeText(post.id, 80),
    type: sanitizeContentType(post.type),
    title: sanitizeText(post.title, 160),
    excerpt: sanitizeText(post.excerpt, 320),
    date: sanitizeText(post.date, 64),
    isLocked: Boolean(post.isLocked),
    publicationStatus: sanitizePublicationStatus(post.publicationStatus),
    tags: sanitizeTags(post.tags),
    content: sanitizeText(post.content, 15000)
  };
  if (!normalized.id || !normalized.title || !normalized.excerpt) {
    return null;
  }
  if (normalized.publicationStatus === 'DRAFT') {
    return null;
  }
  const signalMarket = normalized.type === 'TRADE_SIGNAL' ? inferSignalMarketFromPost(post) : null;
  const canViewTradeSignal = signalMarket === 'CRYPTO'
    ? Boolean(permissions?.canAccessCryptoSignals)
    : Boolean(permissions?.canAccessBourseSignals);
  const canViewThisPost = normalized.type === 'TRADE_SIGNAL'
    ? canViewTradeSignal
    : canViewLocked;

  if (normalized.isLocked && !canViewThisPost) {
    return {
      ...normalized,
      content: '',
      tradeDetails: undefined
    };
  }
  return {
    ...normalized,
    tradeDetails: post.tradeDetails && typeof post.tradeDetails === 'object' ? post.tradeDetails : undefined
  };
};

const publicReview = (review) => ({
  id: sanitizeText(review?.id, 80),
  author: sanitizeText(review?.author, 80),
  role: sanitizeText(review?.role, 32) || 'USER',
  rating: Math.max(1, Math.min(5, Number(review?.rating || 5))),
  date: sanitizeText(review?.date, 64),
  content: sanitizeText(review?.content, 1500),
  analysis: sanitizeText(review?.analysis, 4000),
  type: sanitizeText(review?.type, 16).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT',
  videoUrl: sanitizeText(review?.videoUrl, 1024) || undefined,
  status: sanitizeReviewStatus(review?.status),
  platform: sanitizeText(review?.platform, 32) || undefined,
  pnlProof: Boolean(review?.pnlProof),
  createdAt: safeString(review?.createdAt, 64) || null,
  updatedAt: safeString(review?.updatedAt, 64) || null
});

const sortPosts = (posts) => [...posts].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
const sortReviews = (reviews) => [...reviews].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

const parseBodyOrFail = async (req, res, responseHeaders = {}) => {
  const body = await parseBody(req);
  if (body && body.__parseError === 'payload_too_large') {
    json(res, 413, { error: 'payload_too_large' }, responseHeaders);
    return null;
  }
  if (body && body.__parseError === 'invalid_json') {
    json(res, 400, { error: 'invalid_json' }, responseHeaders);
    return null;
  }
  return body;
};

const requireAdmin = (store, req, res) => {
  const auth = requireAuthenticated(store, req, res);
  if (!auth) {
    return null;
  }
  if (!auth.user.isAdmin) {
    json(res, 403, { error: 'forbidden' }, auth.responseHeaders);
    return null;
  }
  return auth;
};

const toBase64Url = (value) => Buffer.from(value)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const decodeJwtPayload = (jwtToken) => {
  const token = String(jwtToken || '');
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

const buildOAuthCallbackUrl = (provider) => `${EFFECTIVE_BACKEND_PUBLIC_URL}/api/auth/oauth/${provider}/callback`;

const oauthProviderStatus = () => ({
  google: Boolean(OAUTH_GOOGLE_CLIENT_ID && OAUTH_GOOGLE_CLIENT_SECRET),
  facebook: Boolean(OAUTH_FACEBOOK_CLIENT_ID && OAUTH_FACEBOOK_CLIENT_SECRET),
  linkedin: Boolean(OAUTH_LINKEDIN_CLIENT_ID && OAUTH_LINKEDIN_CLIENT_SECRET),
  apple: Boolean(OAUTH_APPLE_CLIENT_ID && OAUTH_APPLE_TEAM_ID && OAUTH_APPLE_KEY_ID && OAUTH_APPLE_PRIVATE_KEY_BASE64)
});

const cleanupOAuthStateStore = () => {
  const nowMs = Date.now();
  for (const [key, value] of oauthStateStore.entries()) {
    if (!value || nowMs >= value.expiresAt) {
      oauthStateStore.delete(key);
    }
  }
};

const createOAuthState = (provider, mode) => {
  cleanupOAuthStateStore();
  const state = crypto.randomBytes(20).toString('hex');
  oauthStateStore.set(state, {
    provider,
    mode,
    expiresAt: Date.now() + (OAUTH_STATE_TTL_MINUTES * 60 * 1000)
  });
  return state;
};

const consumeOAuthState = (state, provider) => {
  cleanupOAuthStateStore();
  const rawState = safeString(state, 200);
  if (!rawState) return null;
  const payload = oauthStateStore.get(rawState);
  oauthStateStore.delete(rawState);
  if (!payload || payload.provider !== provider || Date.now() >= payload.expiresAt) {
    return null;
  }
  return payload;
};

const buildOAuthAuthorizationUrl = (provider, state) => {
  const callbackUrl = buildOAuthCallbackUrl(provider);
  if (provider === 'google') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', OAUTH_GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }
  if (provider === 'facebook') {
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', OAUTH_FACEBOOK_CLIENT_ID);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'email,public_profile');
    url.searchParams.set('state', state);
    return url.toString();
  }
  if (provider === 'linkedin') {
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('client_id', OAUTH_LINKEDIN_CLIENT_ID);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', state);
    return url.toString();
  }
  if (provider === 'apple') {
    const url = new URL('https://appleid.apple.com/auth/authorize');
    url.searchParams.set('client_id', OAUTH_APPLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('scope', 'name email');
    url.searchParams.set('state', state);
    return url.toString();
  }
  return null;
};

const postFormUrlEncoded = async (url, payload, headers = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers
    },
    body: new URLSearchParams(payload)
  });
  const data = await parseJsonSafely(response);
  if (!response.ok || !data) {
    throw new Error('oauth_token_exchange_failed');
  }
  return data;
};

const createAppleClientSecret = () => {
  const privateKey = Buffer.from(OAUTH_APPLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'ES256', kid: OAUTH_APPLE_KEY_ID, typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({
    iss: OAUTH_APPLE_TEAM_ID,
    iat: nowSeconds,
    exp: nowSeconds + (5 * 60),
    aud: 'https://appleid.apple.com',
    sub: OAUTH_APPLE_CLIENT_ID
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  });
  return `${unsignedToken}.${toBase64Url(signature)}`;
};

const resolveOAuthProfile = async (provider, code) => {
  const callbackUrl = buildOAuthCallbackUrl(provider);
  if (provider === 'google') {
    const tokenData = await postFormUrlEncoded('https://oauth2.googleapis.com/token', {
      code,
      client_id: OAUTH_GOOGLE_CLIENT_ID,
      client_secret: OAUTH_GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    });
    const idPayload = decodeJwtPayload(tokenData.id_token);
    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await parseJsonSafely(userInfoRes);
    const providerUserId = safeString(idPayload?.sub || userInfo?.sub, 191);
    const email = normalizeEmail(userInfo?.email || idPayload?.email || '');
    const emailVerified = Boolean(
      userInfo?.email_verified
      || idPayload?.email_verified === true
      || idPayload?.email_verified === 'true'
    );
    const name = sanitizeText(userInfo?.name || idPayload?.name || '', 120) || null;
    if (!providerUserId || !email) throw new Error('oauth_profile_invalid');
    return { providerUserId, email, emailVerified, name };
  }

  if (provider === 'facebook') {
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', OAUTH_FACEBOOK_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', OAUTH_FACEBOOK_CLIENT_SECRET);
    tokenUrl.searchParams.set('redirect_uri', callbackUrl);
    tokenUrl.searchParams.set('code', code);
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await parseJsonSafely(tokenRes);
    if (!tokenRes.ok || !tokenData?.access_token) throw new Error('oauth_token_exchange_failed');

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email');
    profileUrl.searchParams.set('access_token', tokenData.access_token);
    const profileRes = await fetch(profileUrl);
    const profile = await parseJsonSafely(profileRes);
    const providerUserId = safeString(profile?.id, 191);
    const email = normalizeEmail(profile?.email || '');
    const name = sanitizeText(profile?.name || '', 120) || null;
    if (!providerUserId || !email) throw new Error('oauth_profile_invalid');
    return { providerUserId, email, emailVerified: true, name };
  }

  if (provider === 'linkedin') {
    const tokenData = await postFormUrlEncoded('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: OAUTH_LINKEDIN_CLIENT_ID,
      client_secret: OAUTH_LINKEDIN_CLIENT_SECRET
    });
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await parseJsonSafely(profileRes);
    const providerUserId = safeString(profile?.sub, 191);
    const email = normalizeEmail(profile?.email || '');
    const name = sanitizeText(
      profile?.name
        || `${profile?.given_name || ''} ${profile?.family_name || ''}`.trim(),
      120
    ) || null;
    if (!providerUserId || !email) throw new Error('oauth_profile_invalid');
    return { providerUserId, email, emailVerified: true, name };
  }

  if (provider === 'apple') {
    const tokenData = await postFormUrlEncoded('https://appleid.apple.com/auth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: OAUTH_APPLE_CLIENT_ID,
      client_secret: createAppleClientSecret()
    });
    const idPayload = decodeJwtPayload(tokenData.id_token);
    const providerUserId = safeString(idPayload?.sub, 191);
    const email = normalizeEmail(idPayload?.email || '');
    const emailVerified = Boolean(idPayload?.email_verified === true || idPayload?.email_verified === 'true');
    if (!providerUserId || !email) throw new Error('oauth_profile_invalid');
    return { providerUserId, email, emailVerified, name: null };
  }

  throw new Error('oauth_provider_unsupported');
};

const buildFrontendAuthRedirectUrl = (params = {}) => {
  const target = new URL(EFFECTIVE_PUBLIC_APP_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    target.searchParams.set(key, String(value));
  });
  return target.toString();
};

const redirectTo = (res, location, extraHeaders = {}) => {
  const securityHeaders = buildBaseSecurityHeaders();
  res.writeHead(302, {
    Location: location,
    ...securityHeaders,
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end();
};

const hashEmailVerificationToken = (token) => crypto
  .createHmac('sha256', EFFECTIVE_EMAIL_TOKEN_SECRET)
  .update(String(token || ''))
  .digest('hex');

const hashPasswordResetToken = (token) => crypto
  .createHmac('sha256', EFFECTIVE_EMAIL_TOKEN_SECRET)
  .update(`reset:${String(token || '')}`)
  .digest('hex');

const issueEmailVerificationToken = (user) => {
  const rawToken = crypto.randomBytes(40).toString('base64url');
  user.emailVerificationTokenHash = hashEmailVerificationToken(rawToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + (EMAIL_VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000)).toISOString();
  return rawToken;
};

const clearEmailVerificationToken = (user) => {
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
};

const issuePasswordResetToken = (user) => {
  const rawToken = crypto.randomBytes(40).toString('base64url');
  user.passwordResetTokenHash = hashPasswordResetToken(rawToken);
  user.passwordResetExpiresAt = new Date(Date.now() + (PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000)).toISOString();
  return rawToken;
};

const clearPasswordResetToken = (user) => {
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
};

const sendTransactionalEmail = async ({ to, subject, html, text }) => {
  const recipient = normalizeEmail(to);
  if (!recipient) return false;
  if (EMAIL_PROVIDER === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [recipient],
        subject,
        html,
        text
      })
    });
    if (!response.ok) {
      throw new Error('transactional_email_failed');
    }
    return true;
  }

  console.info(`[EMAIL:console] to=${recipient} subject="${subject}"`);
  console.info(`[EMAIL:console] text="${safeString(text, 500)}"`);
  return true;
};

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${EFFECTIVE_BACKEND_PUBLIC_URL}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendTransactionalEmail({
    to: user.email,
    subject: 'Confirmez votre email Black Papers',
    text: `Bonjour,\n\nConfirmez votre email via ce lien: ${verificationUrl}\n\nCe lien expire dans ${EMAIL_VERIFY_TOKEN_TTL_HOURS} heure(s).`,
    html: `<p>Bonjour,</p><p>Confirmez votre email en cliquant ici:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>Ce lien expire dans ${EMAIL_VERIFY_TOKEN_TTL_HOURS} heure(s).</p>`
  });
};

const buildStarterKitOnboardingEmailContent = () => {
  const starterKitUrl = `${EFFECTIVE_PUBLIC_APP_URL.replace(/\/+$/, '')}/starter-kit`;
  const module1Url = `${starterKitUrl}#module-1`;
  const module2Url = `${starterKitUrl}#module-2`;
  const starterVideoUrl = 'https://www.youtube.com/watch?v=8fH7Z5vFd0A';
  return {
    starterKitUrl,
    module1Url,
    module2Url,
    starterVideoUrl
  };
};

const sendWelcomeEmail = async (user) => {
  const content = buildStarterKitOnboardingEmailContent();
  await sendTransactionalEmail({
    to: user.email,
    subject: 'Bienvenue sur Black Papers - Starter Kit + onboarding',
    text: [
      'Bienvenue sur Black Papers.',
      '',
      'Voici votre onboarding de démarrage :',
      `- Module 1 (jargon du trading) : ${content.module1Url}`,
      `- Module 2 (choisir sa plateforme) : ${content.module2Url}`,
      `- Vidéo Starter Kit : ${content.starterVideoUrl}`,
      '',
      `Accès Starter Kit : ${content.starterKitUrl}`
    ].join('\n'),
    html: [
      '<p>Bienvenue sur <strong>Black Papers</strong>.</p>',
      '<p>Voici votre onboarding de démarrage :</p>',
      '<ul>',
      `<li><a href="${content.module1Url}">Module 1 : jargon du trading</a></li>`,
      `<li><a href="${content.module2Url}">Module 2 : choisir sa plateforme</a></li>`,
      `<li><a href="${content.starterVideoUrl}">Vidéo Starter Kit</a></li>`,
      '</ul>',
      `<p>Accès Starter Kit : <a href="${content.starterKitUrl}">${content.starterKitUrl}</a></p>`
    ].join('')
  });
};

const sendStarterKitEmail = async (email) => {
  const content = buildStarterKitOnboardingEmailContent();
  await sendTransactionalEmail({
    to: email,
    subject: 'Votre Starter Kit Black Papers + 2 modules offerts',
    text: [
      'Bonjour,',
      '',
      'Voici votre Starter Kit gratuit :',
      `${content.starterKitUrl}`,
      '',
      'Vous recevez aussi les 2 premiers modules :',
      `- Module 1 (jargon du trading) : ${content.module1Url}`,
      `- Module 2 (choisir sa plateforme) : ${content.module2Url}`,
      `- Vidéo Starter Kit : ${content.starterVideoUrl}`,
      '',
      'Vous pouvez commencer immédiatement, sans paiement.'
    ].join('\n'),
    html: [
      '<p>Bonjour,</p>',
      '<p>Voici votre accès gratuit au <strong>Starter Kit</strong> :</p>',
      `<p><a href="${content.starterKitUrl}">${content.starterKitUrl}</a></p>`,
      '<p>Vous recevez aussi les 2 premiers modules :</p>',
      '<ul>',
      `<li><a href="${content.module1Url}">Module 1 : jargon du trading</a></li>`,
      `<li><a href="${content.module2Url}">Module 2 : choisir sa plateforme</a></li>`,
      `<li><a href="${content.starterVideoUrl}">Vidéo Starter Kit</a></li>`,
      '</ul>',
      '<p>Vous pouvez commencer immédiatement, sans paiement.</p>'
    ].join('')
  });
};

const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${EFFECTIVE_PUBLIC_APP_URL.replace(/\/+$/, '')}/?reset_token=${encodeURIComponent(rawToken)}`;
  await sendTransactionalEmail({
    to: user.email,
    subject: 'Réinitialisez votre mot de passe Black Papers',
    text: `Bonjour,\n\nRéinitialisez votre mot de passe via ce lien: ${resetUrl}\n\nCe lien expire dans ${PASSWORD_RESET_TOKEN_TTL_HOURS} heure(s).`,
    html: `<p>Bonjour,</p><p>Réinitialisez votre mot de passe en cliquant ici:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans ${PASSWORD_RESET_TOKEN_TTL_HOURS} heure(s).</p>`
  });
};

const toHubSpotDateValue = (value) => {
  const parsedMs = Date.parse(String(value || ''));
  return String(Number.isFinite(parsedMs) ? parsedMs : Date.now());
};

const sendSignupToHubSpot = async (payload = {}) => {
  if (!HUBSPOT_SIGNUP_SYNC_ENABLED) {
    return { skipped: true, reason: 'hubspot_not_configured' };
  }

  const email = normalizeEmail(payload.email);
  if (!email || !email.includes('@')) {
    return { skipped: true, reason: 'invalid_email' };
  }

  const referredByEmail = normalizeEmail(payload.referredByEmail || '');
  const referralCode = sanitizeReferralCode(payload.referralCode);
  const referralOwnerEmail = normalizeEmail(payload.referralOwnerEmail || '');

  const fields = [
    { name: 'email', value: email },
    { name: 'signup_date', value: toHubSpotDateValue(payload.createdAt) }
  ];

  if (referredByEmail) fields.push({ name: 'referred_by_email', value: referredByEmail });
  if (referralCode) fields.push({ name: 'referral_code', value: referralCode });
  if (referralOwnerEmail) fields.push({ name: 'referral_owner_email', value: referralOwnerEmail });
  if (referralCode || referredByEmail || referralOwnerEmail) {
    fields.push({ name: 'contact_role', value: 'filleul' });
  }

  const hubspotUtk = safeString(payload.hutk, 512).replace(/[^A-Za-z0-9._-]/g, '');
  const pageUriRaw = safeString(payload.pageUri, 1024);
  const pageUri = isValidHttpUrl(pageUriRaw)
    ? pageUriRaw
    : `${EFFECTIVE_PUBLIC_APP_URL.replace(/\/+$/, '')}/signup`;
  const pageName = sanitizeText(payload.pageName || 'Signup', 120) || 'Signup';

  const context = { pageUri, pageName };
  if (hubspotUtk) {
    context.hutk = hubspotUtk;
  }

  const endpointBase = HUBSPOT_PRIVATE_APP_TOKEN
    ? 'https://api.hsforms.com/submissions/v3/integration/secure/submit'
    : 'https://api.hsforms.com/submissions/v3/integration/submit';
  const headers = { 'Content-Type': 'application/json' };
  if (HUBSPOT_PRIVATE_APP_TOKEN) {
    headers.Authorization = `Bearer ${HUBSPOT_PRIVATE_APP_TOKEN}`;
  }
  const submittedAt = Number(toHubSpotDateValue(payload.createdAt));

  const response = await fetchWithTimeout(
    `${endpointBase}/${HUBSPOT_PORTAL_ID}/${HUBSPOT_SIGNUP_FORM_GUID}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields, context, submittedAt })
    },
    HUBSPOT_SYNC_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`hubspot_submit_failed_${response.status}:${safeString(errorText, 240)}`);
  }

  return parseJsonSafely(response) || {};
};

const upsertOAuthUser = (store, provider, profile) => {
  const providerKey = safeString(provider, 24).toLowerCase();
  const providerUserId = safeString(profile.providerUserId, 191);
  const email = normalizeEmail(profile.email);
  if (!providerKey || !providerUserId || !email) {
    throw new Error('invalid_social_payload');
  }

  const userByProvider = store.users.find((candidate) => {
    const normalizedProviders = normalizeAuthProviders(candidate.authProviders);
    return normalizedProviders[providerKey] === providerUserId;
  }) || null;
  const userByEmail = store.users.find((candidate) => normalizeEmail(candidate.email) === email) || null;

  if (userByProvider && userByEmail && userByProvider.id !== userByEmail.id) {
    throw new Error('email_conflict');
  }

  let user = userByProvider || userByEmail;
  const created = !user;
  if (!user) {
    user = createUser(
      email,
      crypto.randomBytes(24).toString('base64url'),
      {
        needsOnboarding: true,
        emailVerified: Boolean(profile.emailVerified),
        authProviders: { [providerKey]: providerUserId }
      }
    );
    if (profile.emailVerified) {
      user.emailVerifiedAt = new Date().toISOString();
    }
    store.users.push(user);
  } else {
    user.authProviders = normalizeAuthProviders(user.authProviders);
    const existingProviderIdentity = user.authProviders[providerKey];
    if (existingProviderIdentity && existingProviderIdentity !== providerUserId) {
      throw new Error('provider_identity_conflict');
    }
    user.authProviders[providerKey] = providerUserId;
    if (profile.emailVerified && !user.emailVerified) {
      user.emailVerified = true;
      user.emailVerifiedAt = new Date().toISOString();
    }
    applyUserAccessConsistency(user);
  }

  upsertLeadFromEmail(store, user.email, `oauth_${providerKey}`, user);
  return { user, created };
};

const server = http.createServer(async (req, res) => {
  res.__requestOrigin = safeString(req.headers.origin, 512);
  res.__rateLimitHeaders = {};
  if (!req.url) return json(res, 400, { error: 'invalid_request' });
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (res.__requestOrigin && !isOriginAllowed(res.__requestOrigin)) {
    return json(res, 403, { error: 'cors_origin_denied' });
  }

  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'black-papers-api', lemon: publicLemonConfig() });
  }

  if (req.method === 'POST' && url.pathname === '/api/webhooks/lemon-squeezy') {
    const parsed = await parseBodyWithRaw(req);
    if (parsed?.__parseError === 'payload_too_large') {
      return json(res, 413, { error: 'payload_too_large' });
    }
    if (parsed?.__parseError === 'invalid_json') {
      return json(res, 400, { error: 'invalid_json' });
    }

    const signatureHeader = req.headers['x-signature'] || req.headers['X-Signature'];
    if (!verifyLemonWebhookSignature(parsed.rawBody, signatureHeader)) {
      return json(res, 401, { error: 'invalid_webhook_signature' });
    }

    const lemonEvent = extractLemonEventPayload(parsed.body || {});
    const store = readStore();
    const targetUser = lemonEvent.userId
      ? store.users.find((candidate) => candidate.id === lemonEvent.userId)
      : store.users.find((candidate) => normalizeEmail(candidate.email) === lemonEvent.userEmail);

    if (!targetUser) {
      return json(res, 202, { ok: true, ignored: true, reason: 'user_not_found' });
    }

    applyLemonSubscriptionEventToUser(targetUser, lemonEvent);
    syncReferralAttributionForUser(store, targetUser, {
      source: 'lemon_webhook',
      recordCommissionEvent: false
    });
    upsertLeadFromEmail(
      store,
      targetUser.email,
      'lemon_webhook',
      targetUser,
      {
        referralCode: targetUser.referredByCode || '',
        referralOwnerEmail: targetUser.referredByEmail || ''
      }
    );
    writeStore(store);
    return json(res, 200, { ok: true });
  }

  const rateLimitPolicy = resolveRateLimitPolicy(req, url.pathname);
  if (rateLimitPolicy && !applyRateLimit(req, res, rateLimitPolicy.key, rateLimitPolicy.limit)) {
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/content') {
    const store = readStore();
    const auth = resolveAuthContext(store, req);
    if (auth.storeChanged) {
      writeStore(store);
    }
    const permissions = resolveUserPermissions(auth.user);
    return json(res, 200, {
      posts: sortPosts(store.posts).slice(0, 200).map((post) => publicPost(post, permissions)).filter(Boolean),
      reviews: sortReviews(store.reviews)
        .filter((review) => sanitizeReviewStatus(review.status) === 'APPROVED')
        .slice(0, 200)
        .map(publicReview),
      permissions
    }, auth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/trades') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const permissions = resolveUserPermissions(auth.user);
    if (!permissions.vipAccess) return json(res, 403, { error: 'subscription_required' }, auth.responseHeaders);
    const requestedDateRaw = safeString(url.searchParams.get('date'), 16);
    const requestedMonthRaw = safeString(url.searchParams.get('month'), 16);
    const requestedDate = requestedDateRaw ? normalizeDateKey(requestedDateRaw) : '';
    const requestedMonth = requestedMonthRaw ? normalizeMonthKey(requestedMonthRaw) : '';
    if (requestedDateRaw && !requestedDate) {
      return json(res, 400, { error: 'invalid_date_query' }, auth.responseHeaders);
    }
    if (requestedMonthRaw && !requestedMonth) {
      return json(res, 400, { error: 'invalid_month_query' }, auth.responseHeaders);
    }

    if (!Array.isArray(store.tradeSnapshots) || !store.tradeSnapshots.length) {
      upsertTradeSnapshot(store, {
        dateKey: inferTradeSnapshotDateKey(store.dailyTrades, new Date().toISOString()),
        publishedAt: new Date().toISOString(),
        source: 'legacy_backfill',
        trades: Array.isArray(store.dailyTrades) ? store.dailyTrades : defaultDailyTrades(),
        marketAnalysis: typeof store.marketAnalysis === 'string' ? store.marketAnalysis : defaultMarketAnalysis()
      });
      writeStore(store);
    }

    const snapshots = sortTradeSnapshotsDesc(store.tradeSnapshots);
    const selectedSnapshot = requestedDate
      ? snapshots.find((entry) => entry.dateKey === requestedDate) || null
      : requestedMonth
        ? snapshots.find((entry) => entry.monthKey === requestedMonth) || null
        : snapshots[0] || null;

    const sourceTrades = Array.isArray(selectedSnapshot?.trades) ? selectedSnapshot.trades : [];
    const trades = sourceTrades.filter((trade) => {
      const market = normalizeTradeMarket(trade.market, trade.actif);
      if (market === 'CRYPTO') return permissions.canAccessCryptoSignals;
      return permissions.canAccessBourseSignals;
    });
    const groupedTrades = {
      bourse: trades.filter((trade) => normalizeTradeMarket(trade.market, trade.actif) === 'BOURSE'),
      crypto: trades.filter((trade) => normalizeTradeMarket(trade.market, trade.actif) === 'CRYPTO')
    };

    const archiveSummary = snapshots
      .slice(0, TRADE_SNAPSHOT_SUMMARY_LIMIT)
      .map(buildTradeSnapshotSummary);

    if (!selectedSnapshot) {
      return json(res, 200, {
        trades: [],
        marketAnalysis: '## Archive indisponible\n\n- Aucun signal sauvegarde pour cette date ou ce mois.',
        marketAnalyses: sanitizeMarketAnalyses(null, ''),
        groupedTrades: {
          bourse: [],
          crypto: []
        },
        permissions,
        updatedAt: new Date().toISOString(),
        snapshot: null,
        archive: {
          totalSnapshots: snapshots.length,
          availableSnapshots: archiveSummary
        },
        requestedDate: requestedDate || null,
        requestedMonth: requestedMonth || null
      }, auth.responseHeaders);
    }

    const marketAnalyses = sanitizeMarketAnalyses(selectedSnapshot.marketAnalyses, selectedSnapshot.marketAnalysis);
    const marketAnalysis = (() => {
      if (permissions.canAccessBourseSignals && !permissions.canAccessCryptoSignals) return marketAnalyses.bourse;
      if (!permissions.canAccessBourseSignals && permissions.canAccessCryptoSignals) return marketAnalyses.crypto;
      return `## Analyse Bourse\n\n${marketAnalyses.bourse}\n\n## Analyse Crypto\n\n${marketAnalyses.crypto}`;
    })();

    return json(res, 200, {
      trades,
      groupedTrades,
      marketAnalyses,
      marketAnalysis,
      permissions,
      updatedAt: safeString(selectedSnapshot.publishedAt, 64) || new Date().toISOString(),
      snapshot: {
        id: selectedSnapshot.id,
        dateKey: selectedSnapshot.dateKey,
        monthKey: selectedSnapshot.monthKey,
        publishedAt: selectedSnapshot.publishedAt,
        isHistorical: Boolean(requestedDate || requestedMonth)
      },
      archive: {
        totalSnapshots: snapshots.length,
        availableSnapshots: archiveSummary
      },
      requestedDate: requestedDate || null,
      requestedMonth: requestedMonth || null
    }, auth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/news-feed') {
    try {
      const items = await loadNewsFeed();
      const mode = items.length && !String(items[0].id || '').startsWith('fallback-') ? 'live' : 'fallback';
      return json(res, 200, {
        items,
        updatedAt: new Date().toISOString(),
        sources: GOOGLE_NEWS_RSS_SOURCES.map((source) => source.name),
        mode
      });
    } catch {
      return json(res, 200, {
        items: FALLBACK_NEWS_FEED_ITEMS,
        updatedAt: new Date().toISOString(),
        sources: GOOGLE_NEWS_RSS_SOURCES.map((source) => source.name),
        mode: 'fallback'
      });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/market-ticker') {
    try {
      const snapshot = await getMarketTickerSnapshot();
      return json(res, 200, snapshot);
    } catch {
      return json(res, 200, {
        mode: 'fallback',
        sources: {
          stocks: 'static_fallback',
          crypto: 'static_fallback'
        },
        stocks: FALLBACK_MARKET_TICKER.stocks,
        crypto: FALLBACK_MARKET_TICKER.crypto,
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/stocks') {
    try {
      const snapshot = await loadStockQuotes();
      return json(res, 200, {
        quotes: snapshot.quotes,
        mode: snapshot.mode,
        source: snapshot.source,
        updatedAt: new Date().toISOString()
      });
    } catch {
      return json(res, 200, {
        quotes: MOCK_STOCK_QUOTES,
        mode: 'fallback',
        source: 'static_fallback',
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/subscription/config') {
    const state = resolveLemonIntegrationState();
    return json(res, 200, {
      lemon: {
        ...publicLemonConfig(),
        successUrl: EFFECTIVE_LEMON_CHECKOUT_SUCCESS_URL,
        cancelUrl: EFFECTIVE_LEMON_CHECKOUT_CANCEL_URL
      },
      plans: Array.from(SUBSCRIPTION_PLANS),
      mode: state.mode
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/leads') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const email = normalizeEmail(body.email);
    const source = safeString(body.source, 64) || 'site_capture';
    const referralCode = sanitizeReferralCode(body.referralCode);
    if (!email || !email.includes('@')) {
      return json(res, 400, { error: 'invalid_email' });
    }
    const store = readStore();
    const referralAttribution = resolveReferralAttribution(store, referralCode, email);
    const lead = upsertLeadFromEmail(
      store,
      email,
      referralAttribution?.sourceLabel || source,
      null,
      {
        referralCode: referralAttribution?.referralCode || '',
        referralOwnerEmail: referralAttribution?.referralOwnerEmail || ''
      }
    );
    if (!lead) {
      return json(res, 400, { error: 'invalid_lead_payload' });
    }
    writeStore(store);
    sendStarterKitEmail(email).catch((error) => {
      console.warn(`[LEADS] starter kit email failed for ${email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
    });
    return json(res, 201, { ok: true, accepted: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/social/x-feed') {
    const store = readStore();
    return json(res, 200, {
      ...publicXFeed(store.xFeed),
      note: 'Flux X en mode curation manuelle. Synchronisation API officielle X non activee.'
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/vip/activity') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const permissions = resolveUserPermissions(auth.user);
    if (!permissions.vipAccess) {
      return json(res, 403, { error: 'subscription_required' }, auth.responseHeaders);
    }
    return json(res, 200, buildVipActivitySnapshot(store), auth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/affiliate/link') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const user = auth.user;
    const beforeCode = sanitizeReferralCode(user?.affiliateProfile?.referralCode);
    const beforeAffiliate = Boolean(user?.affiliateProfile?.isAffiliate);
    const referralCode = ensureUserReferralCode(store, user, false);
    user.affiliateProfile.isAffiliate = true;
    const hasChanged = beforeCode !== referralCode || beforeAffiliate !== user.affiliateProfile.isAffiliate;
    if (hasChanged) {
      writeStore(store);
    }
    return json(res, 200, {
      ok: true,
      referralCode,
      referralUrl: buildAffiliateReferralUrl(referralCode),
      crmSource: `affiliate_${referralCode.slice(0, 24)}`,
      ownerEmail: user.email
    }, auth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/affiliate/link') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const body = await parseBodyOrFail(req, res, auth.responseHeaders);
    if (!body) return;
    const forceRegenerate = sanitizeBoolean(body.regenerate);
    const user = auth.user;
    const referralCode = ensureUserReferralCode(store, user, forceRegenerate);
    user.affiliateProfile.isAffiliate = true;
    writeStore(store);
    return json(res, 200, {
      ok: true,
      referralCode,
      referralUrl: buildAffiliateReferralUrl(referralCode),
      crmSource: `affiliate_${referralCode.slice(0, 24)}`,
      ownerEmail: user.email
    }, auth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/oauth/providers') {
    const providers = oauthProviderStatus();
    return json(res, 200, {
      providers,
      callbackBaseUrl: EFFECTIVE_BACKEND_PUBLIC_URL
    });
  }

  const oauthStartMatch = req.method === 'GET' && url.pathname.match(/^\/api\/auth\/oauth\/(google|facebook|linkedin|apple)\/start$/);
  if (oauthStartMatch) {
    const provider = oauthStartMatch[1];
    const providers = oauthProviderStatus();
    if (!providers[provider]) {
      return json(res, 503, { error: 'oauth_provider_unavailable' });
    }
    const mode = safeString(url.searchParams.get('mode') || 'login', 16).toLowerCase() === 'signup' ? 'signup' : 'login';
    const state = createOAuthState(provider, mode);
    const authorizationUrl = buildOAuthAuthorizationUrl(provider, state);
    if (!authorizationUrl) {
      return json(res, 400, { error: 'oauth_provider_unsupported' });
    }
    return redirectTo(res, authorizationUrl);
  }

  const oauthCallbackMatch = req.method === 'GET' && url.pathname.match(/^\/api\/auth\/oauth\/(google|facebook|linkedin|apple)\/callback$/);
  if (oauthCallbackMatch) {
    const provider = oauthCallbackMatch[1];
    const providers = oauthProviderStatus();
    if (!providers[provider]) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'oauth_provider_unavailable',
        auth_provider: provider
      }));
    }

    const oauthError = safeString(url.searchParams.get('error'), 120);
    const oauthCode = safeString(url.searchParams.get('code'), 2048);
    const oauthState = safeString(url.searchParams.get('state'), 120);

    if (oauthError) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'oauth_cancelled',
        auth_provider: provider
      }));
    }
    if (!oauthCode) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'oauth_code_missing',
        auth_provider: provider
      }));
    }
    const statePayload = consumeOAuthState(oauthState, provider);
    if (!statePayload) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'oauth_state_invalid',
        auth_provider: provider
      }));
    }

    try {
      const store = readStore();
      const profile = await resolveOAuthProfile(provider, oauthCode);
      const { user, created } = upsertOAuthUser(store, provider, profile);

      if (profile.emailVerified) {
        clearEmailVerificationToken(user);
      } else {
        const rawVerificationToken = issueEmailVerificationToken(user);
        sendVerificationEmail(user, rawVerificationToken).catch((error) => {
          console.warn(`[AUTH] verification email delivery failed for ${user.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
        });
      }

      const createdSession = createSession(store, user, req);
      writeStore(store);

      if (created && user.emailVerified) {
        sendWelcomeEmail(user).catch((error) => {
          console.warn(`[AUTH] welcome email delivery failed for ${user.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
        });
      }

      return redirectTo(
        res,
        buildFrontendAuthRedirectUrl({
          auth_status: 'success',
          auth_mode: statePayload.mode,
          auth_provider: provider
        }),
        { 'Set-Cookie': buildSessionCookie(createdSession.token, createdSession.session.absoluteExpiresAt) }
      );
    } catch (error) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: safeString(error?.message, 120) || 'oauth_failed',
        auth_provider: provider
      }));
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/verify-email') {
    const rawToken = safeString(url.searchParams.get('token'), 512);
    if (!rawToken) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'verification_token_missing'
      }));
    }

    const store = readStore();
    const tokenHash = hashEmailVerificationToken(rawToken);
    const user = store.users.find((candidate) => candidate.emailVerificationTokenHash === tokenHash);
    if (!user) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'verification_invalid'
      }));
    }

    const expiresAtMs = Date.parse(String(user.emailVerificationExpiresAt || ''));
    if (!Number.isFinite(expiresAtMs) || Date.now() >= expiresAtMs) {
      return redirectTo(res, buildFrontendAuthRedirectUrl({
        auth_status: 'error',
        auth_error: 'verification_expired'
      }));
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    clearEmailVerificationToken(user);
    applyUserAccessConsistency(user);
    upsertLeadFromEmail(store, user.email, 'email_verified', user);

    const createdSession = createSession(store, user, req);
    writeStore(store);

    sendWelcomeEmail(user).catch((error) => {
      console.warn(`[AUTH] welcome email delivery failed for ${user.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
    });

    return redirectTo(
      res,
      buildFrontendAuthRedirectUrl({
        auth_status: 'email_verified'
      }),
      { 'Set-Cookie': buildSessionCookie(createdSession.token, createdSession.session.absoluteExpiresAt) }
    );
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const email = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);
    const referralCode = sanitizeReferralCode(body.referralCode);
    const hubspotContext = {
      hutk: safeString(body.hutk, 512),
      pageUri: safeString(body.pageUri, 1024),
      pageName: sanitizeText(body.pageName || 'Signup', 120) || 'Signup'
    };
    if (!email || !email.includes('@') || password.length < 8) {
      return json(res, 400, { error: 'invalid_credentials' });
    }

    const store = readStore();
    if (store.users.some((u) => u.email === email)) {
      return json(res, 409, { error: 'user_exists' });
    }

    const user = createUser(email, password, { isAdmin: false, needsOnboarding: true, emailVerified: false });
    const verificationToken = issueEmailVerificationToken(user);
    store.users.push(user);
    const referralAttribution = resolveReferralAttribution(store, referralCode, user.email);
    if (referralAttribution?.owner) {
      user.referredByCode = referralAttribution.referralCode;
      user.referredByUserId = referralAttribution.owner.id;
      user.referredByEmail = referralAttribution.referralOwnerEmail;
      upsertAffiliateReferralForOwner(referralAttribution.owner, user, {
        source: 'signup',
        recordCommissionEvent: false
      });
    }
    upsertLeadFromEmail(
      store,
      user.email,
      referralAttribution?.sourceLabel || 'signup',
      user,
      {
        referralCode: referralAttribution?.referralCode || '',
        referralOwnerEmail: referralAttribution?.referralOwnerEmail || ''
      }
    );
    const createdSession = createSession(store, user, req);
    writeStore(store);
    sendSignupToHubSpot({
      email: user.email,
      createdAt: user.createdAt,
      referredByEmail: user.referredByEmail,
      referralCode: user.referredByCode,
      referralOwnerEmail: referralAttribution?.referralOwnerEmail || user.referredByEmail,
      hutk: hubspotContext.hutk,
      pageUri: hubspotContext.pageUri,
      pageName: hubspotContext.pageName
    }).catch((error) => {
      console.warn(`[CRM] HubSpot signup sync failed for ${user.email}: ${safeString(error?.message, 160) || 'unknown_error'}`);
    });
    sendVerificationEmail(user, verificationToken).catch((error) => {
      console.warn(`[AUTH] verification email delivery failed for ${user.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
    });
    return json(
      res,
      201,
      {
        user: publicUser(user),
        emailVerificationRequired: true,
        session: {
          expiresAt: createdSession.session.expiresAt,
          absoluteExpiresAt: createdSession.session.absoluteExpiresAt
        }
      },
      { 'Set-Cookie': buildSessionCookie(createdSession.token, createdSession.session.absoluteExpiresAt) }
    );
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const email = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);
    const store = readStore();
    const user = store.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return json(res, 401, { error: 'invalid_credentials' });
    }
    if (REQUIRE_EMAIL_VERIFIED && !user.emailVerified) {
      return json(res, 403, { error: 'email_not_verified' });
    }
    upsertLeadFromEmail(store, user.email, 'login', user);
    const createdSession = createSession(store, user, req);
    writeStore(store);
    return json(
      res,
      200,
      {
        user: publicUser(user),
        session: {
          expiresAt: createdSession.session.expiresAt,
          absoluteExpiresAt: createdSession.session.absoluteExpiresAt
        }
      },
      { 'Set-Cookie': buildSessionCookie(createdSession.token, createdSession.session.absoluteExpiresAt) }
    );
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/forgot-password') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const email = sanitizeEmail(body.email);
    if (!email || !email.includes('@')) {
      return json(res, 200, { ok: true, sent: true });
    }

    const store = readStore();
    const user = store.users.find((candidate) => candidate.email === email) || null;
    if (!user) {
      return json(res, 200, { ok: true, sent: true });
    }

    const resetToken = issuePasswordResetToken(user);
    writeStore(store);
    sendPasswordResetEmail(user, resetToken).catch((error) => {
      console.warn(`[AUTH] password reset email delivery failed for ${user.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
    });

    return json(res, 200, { ok: true, sent: true });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/reset-password') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const rawToken = safeString(body.token, 512);
    const newPassword = sanitizePassword(body.newPassword || body.password);
    if (!rawToken || newPassword.length < 8) {
      return json(res, 400, { error: 'invalid_reset_payload' });
    }

    const store = readStore();
    const tokenHash = hashPasswordResetToken(rawToken);
    const user = store.users.find((candidate) => candidate.passwordResetTokenHash === tokenHash) || null;
    if (!user) {
      return json(res, 400, { error: 'reset_token_invalid' });
    }

    const expiresAtMs = Date.parse(String(user.passwordResetExpiresAt || ''));
    if (!Number.isFinite(expiresAtMs) || Date.now() >= expiresAtMs) {
      clearPasswordResetToken(user);
      writeStore(store);
      return json(res, 400, { error: 'reset_token_expired' });
    }

    if (verifyPassword(newPassword, user.passwordHash)) {
      return json(res, 400, { error: 'password_unchanged' });
    }

    user.passwordHash = hashPassword(newPassword);
    clearPasswordResetToken(user);
    applyUserAccessConsistency(user);
    revokeAllSessionsForUser(store, user.id);
    upsertLeadFromEmail(store, user.email, 'password_reset', user);

    const createdSession = createSession(store, user, req);
    writeStore(store);
    return json(
      res,
      200,
      {
        ok: true,
        user: publicUser(user),
        session: {
          expiresAt: createdSession.session.expiresAt,
          absoluteExpiresAt: createdSession.session.absoluteExpiresAt
        }
      },
      { 'Set-Cookie': buildSessionCookie(createdSession.token, createdSession.session.absoluteExpiresAt) }
    );
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/social') {
    return json(res, 410, { error: 'social_auth_legacy_disabled' });
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    return json(res, 200, {
      user: publicUser(auth.user),
      session: {
        expiresAt: auth.session.expiresAt,
        absoluteExpiresAt: auth.session.absoluteExpiresAt
      }
    }, auth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/resend-verification') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const store = readStore();
    const auth = resolveAuthContext(store, req);
    if (auth.storeChanged) {
      writeStore(store);
    }

    const requestedEmail = sanitizeEmail(body.email);
    const targetUser = auth.user || (requestedEmail ? store.users.find((candidate) => candidate.email === requestedEmail) : null);
    const isAuthenticated = Boolean(auth.user);

    if (!targetUser || targetUser.emailVerified) {
      if (isAuthenticated) {
        return json(
          res,
          200,
          { ok: true, alreadyVerified: Boolean(targetUser?.emailVerified), sent: false },
          auth.responseHeaders
        );
      }
      return json(res, 200, { ok: true, sent: true }, auth.responseHeaders);
    }

    const verificationToken = issueEmailVerificationToken(targetUser);
    writeStore(store);
    sendVerificationEmail(targetUser, verificationToken).catch((error) => {
      console.warn(`[AUTH] verification email delivery failed for ${targetUser.email}: ${safeString(error?.message, 120) || 'unknown_error'}`);
    });
    return json(res, 200, { ok: true, sent: true }, auth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/restore') {
    return json(res, 410, { error: 'restore_disabled' });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const store = readStore();
    const auth = resolveAuthContext(store, req);
    let storeChanged = auth.storeChanged;
    if (auth.tokenHash && store.sessions[auth.tokenHash]) {
      delete store.sessions[auth.tokenHash];
      storeChanged = true;
    }
    if (storeChanged) {
      writeStore(store);
    }
    return json(res, 200, { ok: true }, { 'Set-Cookie': buildClearSessionCookie() });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/delete-account') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    if (auth.user.isAdmin) {
      return json(res, 403, { error: 'admin_delete_forbidden' }, auth.responseHeaders);
    }

    const body = await parseBodyOrFail(req, res, auth.responseHeaders);
    if (!body) return;
    const confirmText = sanitizeText(body.confirmText, 32).toUpperCase();
    const confirmEmail = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);

    if (confirmText !== 'SUPPRIMER') {
      return json(res, 400, { error: 'delete_confirmation_invalid' }, auth.responseHeaders);
    }
    if (!confirmEmail || confirmEmail !== auth.user.email) {
      return json(res, 400, { error: 'delete_email_mismatch' }, auth.responseHeaders);
    }

    const oauthAccount = hasLinkedOAuthProvider(auth.user);
    if (!oauthAccount && !verifyPassword(password, auth.user.passwordHash)) {
      return json(res, 401, { error: 'invalid_credentials' }, auth.responseHeaders);
    }

    const deleted = removeUserDataFromStore(store, auth.user);
    if (!deleted) {
      return json(res, 500, { error: 'account_delete_failed' }, auth.responseHeaders);
    }
    writeStore(store);
    return json(res, 200, { ok: true, deleted: true }, { ...auth.responseHeaders, 'Set-Cookie': buildClearSessionCookie() });
  }

  if (req.method === 'POST' && url.pathname === '/api/subscription/checkout') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const user = auth.user;

    const requestedPlan = sanitizeText(body.planId, 32).toLowerCase();
    if (!SUBSCRIPTION_PLANS.has(requestedPlan)) {
      return json(res, 400, { error: 'invalid_plan' }, auth.responseHeaders);
    }

    const lemonState = resolveLemonIntegrationState();
    if (!lemonState.plans[requestedPlan]) {
      return json(res, 503, { error: 'lemon_plan_not_configured' }, auth.responseHeaders);
    }

    try {
      const checkout = await createLemonCheckout({
        user,
        plan: requestedPlan,
        successUrl: EFFECTIVE_LEMON_CHECKOUT_SUCCESS_URL,
        cancelUrl: EFFECTIVE_LEMON_CHECKOUT_CANCEL_URL
      });
      if (!checkout.url) {
        throw new Error('lemon_checkout_url_missing');
      }

      user.billing = normalizeBillingProfile(user.billing);
      user.billing.provider = 'LEMON_SQUEEZY';
      user.billing.checkoutUrl = checkout.url;
      user.billing.checkoutStartedAt = new Date().toISOString();
      user.billing.currentPeriodStart = user.billing.currentPeriodStart || new Date().toISOString();
      user.billing.lemonVariantId = checkout.variantId || user.billing.lemonVariantId || null;

      user.subscriptionPlan = requestedPlan;
      user.subscriptionStatus = user.isAdmin ? 'ADMIN' : 'PENDING_VERIFICATION';
      user.subscriptionUpdatedAt = new Date().toISOString();
      applyUserAccessConsistency(user);
      syncReferralAttributionForUser(store, user, {
        source: 'checkout_started',
        recordCommissionEvent: false
      });
      upsertLeadFromEmail(store, user.email, 'checkout_started', user, {
        referralCode: user.referredByCode || '',
        referralOwnerEmail: user.referredByEmail || ''
      });
      writeStore(store);

      return json(res, 200, {
        ok: true,
        checkoutUrl: checkout.url,
        mode: checkout.mode,
        status: user.subscriptionStatus,
        user: publicUser(user)
      }, auth.responseHeaders);
    } catch (error) {
      return json(res, 502, {
        error: safeString(error?.message, 120) || 'lemon_checkout_failed'
      }, auth.responseHeaders);
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/subscription/verify') {
    const body = await parseBodyOrFail(req, res);
    if (!body) return;
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const user = auth.user;

    const requestedPlan = sanitizeText(body.planId, 32).toLowerCase();
    if (!SUBSCRIPTION_PLANS.has(requestedPlan)) {
      return json(res, 400, { error: 'invalid_plan' });
    }

    const providedPaidAmount = parsePositiveCurrencyAmount(
      body?.paidAmount ?? body?.amountPaid ?? body?.amount ?? null
    );
    const providedPaidCurrency = sanitizeCurrencyCode(body?.paidCurrency || body?.currency || 'EUR');
    const nowIso = new Date().toISOString();
    const isDevStubActive = ALLOW_DEV_SUBSCRIPTION_STUB && !IS_PRODUCTION_LIKE;
    user.subscriptionPlan = normalizeSubscriptionPlan(requestedPlan, false);
    user.subscriptionUpdatedAt = nowIso;
    user.billing = normalizeBillingProfile(user.billing);
    user.billing.provider = 'MANUAL';
    user.billing.currentPeriodStart = user.billing.currentPeriodStart || nowIso;
    user.billing.lastWebhookEvent = 'manual_verification';
    user.billing.lastWebhookAt = nowIso;
    user.billing.lastPaymentChannel = 'CRYPTO_MANUAL';
    if (providedPaidAmount !== null) {
      user.billing.lastPaidAmount = providedPaidAmount;
      user.billing.lastPaidCurrency = providedPaidCurrency;
      user.billing.lastPaymentAt = nowIso;
      user.billing.lastAffiliateCommissionEventKey = buildAffiliateCommissionEventKey(user, {
        source: 'manual_subscription_verify',
        eventKey: `manual:${safeString(user.id, 128)}:${nowIso}:${providedPaidAmount.toFixed(2)}:${requestedPlan}`
      });
    }
    if (isDevStubActive) {
      user.subscriptionStatus = 'ACTIVE';
      user.billing.currentPeriodEnd = user.billing.currentPeriodEnd || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
      user.billing.canceledAt = null;
      user.subscriptionStartedAt = user.subscriptionStartedAt || user.billing.currentPeriodStart || nowIso;
      if (parsePositiveCurrencyAmount(user.billing.lastPaidAmount) === null) {
        const fallbackPaidAmount = roundCurrencyAmount(resolvePlanReferencePriceEur(requestedPlan));
        if (fallbackPaidAmount > 0) {
          user.billing.lastPaidAmount = fallbackPaidAmount;
          user.billing.lastPaidCurrency = providedPaidCurrency;
        }
      }
      user.billing.lastPaymentAt = user.billing.lastPaymentAt || nowIso;
      user.billing.lastAffiliateCommissionEventKey = buildAffiliateCommissionEventKey(user, {
        source: 'manual_subscription_verify'
      });
    } else {
      user.subscriptionStatus = user.isAdmin ? 'ADMIN' : 'PENDING_VERIFICATION';
    }
    applyUserAccessConsistency(user);
    const manualSubscriptionIsActive = normalizeSubscriptionStatus(user.subscriptionStatus, Boolean(user.isAdmin)) === 'ACTIVE';
    syncReferralAttributionForUser(store, user, {
      source: 'manual_subscription_verify',
      recordCommissionEvent: manualSubscriptionIsActive
    });
    upsertLeadFromEmail(store, user.email, 'manual_subscription_verify', user, {
      referralCode: user.referredByCode || '',
      referralOwnerEmail: user.referredByEmail || ''
    });
    writeStore(store);
    return json(res, 200, {
      ok: true,
      user: publicUser(user),
      status: user.subscriptionStatus,
      requiresManualValidation: !isDevStubActive
    }, auth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/onboarding/complete') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const user = auth.user;
    const permissions = resolveUserPermissions(user);
    if (!permissions.canAccessTraining) {
      return json(res, 403, { error: 'vip_required_for_training' }, auth.responseHeaders);
    }
    user.needsOnboarding = false;
    user.onboardingCompletedAt = new Date().toISOString();
    upsertLeadFromEmail(store, user.email, 'onboarding_completed', user);
    writeStore(store);
    return json(res, 200, { ok: true, user: publicUser(user) }, auth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/health') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    return json(res, 200, { ok: true, role: 'admin' }, adminAuth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/bootstrap') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    return json(res, 200, {
      users: store.users.slice(0, 500).map(adminUserSummary),
      posts: sortPosts(store.posts).slice(0, 500),
      reviews: sortReviews(store.reviews).slice(0, 500).map(publicReview),
      xFeed: publicXFeed(store.xFeed),
      crm: buildCrmOverview(store),
      lemon: publicLemonConfig()
    }, adminAuth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/crm/overview') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    return json(res, 200, buildCrmOverview(store), adminAuth.responseHeaders);
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/crm/leads.csv') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    const csv = buildCrmLeadsCsv(store);
    const headers = {
      ...buildBaseSecurityHeaders(),
      ...adminAuth.responseHeaders,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="black-papers-crm-leads.csv"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    };
    res.writeHead(200, headers);
    res.end(csv);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/social/x-feed') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    return json(res, 200, publicXFeed(store.xFeed), adminAuth.responseHeaders);
  }

  if (req.method === 'PATCH' && url.pathname === '/api/admin/social/x-feed') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const mode = safeString(body.mode, 32) || 'curated_manual';
    const accounts = Array.isArray(body.accounts)
      ? body.accounts.map((entry, index) => sanitizeXFeedAccountForStore(entry, index)).filter(Boolean).slice(0, X_FEED_MAX_ACCOUNTS)
      : [];

    if (!accounts.length) {
      return json(res, 400, { error: 'invalid_x_feed_payload' }, adminAuth.responseHeaders);
    }

    store.xFeed = {
      mode,
      updatedAt: new Date().toISOString(),
      accounts
    };
    writeStore(store);
    return json(res, 200, publicXFeed(store.xFeed), adminAuth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/users') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const email = sanitizeEmail(body.email);
    const password = sanitizePassword(body.password);
    if (!email || !email.includes('@') || password.length < 8) {
      return json(res, 400, { error: 'invalid_credentials' });
    }
    if (store.users.some((candidate) => candidate.email === email)) {
      return json(res, 409, { error: 'user_exists' });
    }

    const createdUser = createUser(email, password, {
      isAdmin: sanitizeBoolean(body.isAdmin),
      isSubscribed: sanitizeBoolean(body.isSubscribed),
      manualVipAccess: sanitizeBoolean(body.manualVipAccess),
      needsOnboarding: !sanitizeBoolean(body.skipOnboarding),
      emailVerified: sanitizeBoolean(body.emailVerified),
      subscriptionPlan: sanitizeText(body.subscriptionPlan, 32) || (sanitizeBoolean(body.isAdmin) ? 'ADMIN' : (sanitizeBoolean(body.isSubscribed) ? 'combo' : 'NONE')),
      subscriptionStatus: sanitizeText(body.subscriptionStatus, 32) || (sanitizeBoolean(body.isAdmin) ? 'ADMIN' : (sanitizeBoolean(body.isSubscribed) ? 'ACTIVE' : 'NONE'))
    });
    applyUserAccessConsistency(createdUser);
    store.users.push(createdUser);
    upsertLeadFromEmail(store, createdUser.email, 'admin_user_create', createdUser);
    writeStore(store);
    return json(res, 201, { user: adminUserSummary(createdUser), users: store.users.slice(0, 500).map(adminUserSummary) }, adminAuth.responseHeaders);
  }

  const adminUserAccessMatch = req.method === 'PATCH' && url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/access$/);
  if (adminUserAccessMatch) {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;
    const userId = adminUserAccessMatch[1];
    const targetUser = store.users.find((user) => user.id === userId);
    if (!targetUser) {
      return json(res, 404, { error: 'user_not_found' }, adminAuth.responseHeaders);
    }

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    targetUser.billing = normalizeBillingProfile(targetUser.billing);

    if (body.isAdmin !== undefined) {
      targetUser.isAdmin = sanitizeBoolean(body.isAdmin);
    }
    if (body.needsOnboarding !== undefined) {
      targetUser.needsOnboarding = sanitizeBoolean(body.needsOnboarding);
    }
    if (body.manualVipAccess !== undefined) {
      targetUser.manualVipAccess = sanitizeBoolean(body.manualVipAccess);
    }
    if (body.subscriptionPlan !== undefined) {
      targetUser.subscriptionPlan = sanitizeText(body.subscriptionPlan, 32);
    }
    if (body.subscriptionStatus !== undefined) {
      targetUser.subscriptionStatus = sanitizeText(body.subscriptionStatus, 32).toUpperCase();
    }
    if (body.isSubscribed !== undefined) {
      targetUser.isSubscribed = sanitizeBoolean(body.isSubscribed);
    }
    if (body.emailVerified !== undefined) {
      targetUser.emailVerified = sanitizeBoolean(body.emailVerified);
      targetUser.emailVerifiedAt = targetUser.emailVerified ? new Date().toISOString() : null;
      if (targetUser.emailVerified) {
        clearEmailVerificationToken(targetUser);
      }
    }
    if (body.subscriptionCurrentPeriodStart !== undefined) {
      targetUser.billing.currentPeriodStart = safeString(body.subscriptionCurrentPeriodStart, 64) || null;
    }
    if (body.subscriptionCurrentPeriodEnd !== undefined) {
      targetUser.billing.currentPeriodEnd = safeString(body.subscriptionCurrentPeriodEnd, 64) || null;
    }
    if (body.cancelRequestedAt !== undefined) {
      targetUser.billing.canceledAt = safeString(body.cancelRequestedAt, 64) || null;
    }
    if (body.billingPaidAmount !== undefined || body.paidAmount !== undefined) {
      const parsedPaidAmount = parsePositiveCurrencyAmount(
        body.billingPaidAmount !== undefined ? body.billingPaidAmount : body.paidAmount
      );
      targetUser.billing.lastPaidAmount = parsedPaidAmount;
    }
    if (body.billingPaidCurrency !== undefined || body.paidCurrency !== undefined) {
      targetUser.billing.lastPaidCurrency = sanitizeCurrencyCode(
        body.billingPaidCurrency !== undefined ? body.billingPaidCurrency : body.paidCurrency
      );
    }
    if (body.billingLastPaymentAt !== undefined || body.lastPaymentAt !== undefined) {
      targetUser.billing.lastPaymentAt = safeString(
        body.billingLastPaymentAt !== undefined ? body.billingLastPaymentAt : body.lastPaymentAt,
        64
      ) || null;
    }
    if (body.billingPaymentChannel !== undefined || body.paymentChannel !== undefined) {
      const requestedPaymentChannel = safeString(
        body.billingPaymentChannel !== undefined ? body.billingPaymentChannel : body.paymentChannel,
        32
      ).toUpperCase();
      targetUser.billing.lastPaymentChannel = ['CRYPTO_MANUAL', 'CARD_AUTO', 'UNKNOWN'].includes(requestedPaymentChannel)
        ? requestedPaymentChannel
        : targetUser.billing.lastPaymentChannel;
    }
    if (safeString(targetUser.subscriptionStatus, 32).toUpperCase() === 'ACTIVE') {
      targetUser.billing.canceledAt = null;
      targetUser.subscriptionStartedAt = targetUser.subscriptionStartedAt || targetUser.billing.currentPeriodStart || new Date().toISOString();
    }
    if (safeString(targetUser.subscriptionStatus, 32).toUpperCase() === 'CANCELED' && !targetUser.billing.canceledAt) {
      targetUser.billing.canceledAt = new Date().toISOString();
    }

    applyUserAccessConsistency(targetUser);
    targetUser.subscriptionUpdatedAt = new Date().toISOString();
    const shouldRecordManualCommission = normalizeBillingProfile(targetUser.billing).provider === 'MANUAL'
      && normalizeSubscriptionStatus(targetUser.subscriptionStatus, Boolean(targetUser.isAdmin)) === 'ACTIVE';
    if (shouldRecordManualCommission) {
      const normalizedBilling = normalizeBillingProfile(targetUser.billing);
      if (!normalizedBilling.lastPaymentAt) {
        normalizedBilling.lastPaymentAt = new Date().toISOString();
      }
      if (parsePositiveCurrencyAmount(normalizedBilling.lastPaidAmount) === null) {
        const fallbackAmount = roundCurrencyAmount(resolvePlanReferencePriceEur(targetUser.subscriptionPlan));
        normalizedBilling.lastPaidAmount = fallbackAmount > 0 ? fallbackAmount : normalizedBilling.lastPaidAmount;
      }
      normalizedBilling.lastPaymentChannel = normalizedBilling.lastPaymentChannel || 'CRYPTO_MANUAL';
      normalizedBilling.lastAffiliateCommissionEventKey = buildAffiliateCommissionEventKey(targetUser, {
        source: 'admin_user_update'
      });
      targetUser.billing = normalizedBilling;
    }
    syncReferralAttributionForUser(store, targetUser, {
      source: 'admin_user_update',
      recordCommissionEvent: shouldRecordManualCommission
    });
    upsertLeadFromEmail(store, targetUser.email, 'admin_user_update', targetUser, {
      referralCode: targetUser.referredByCode || '',
      referralOwnerEmail: targetUser.referredByEmail || ''
    });
    writeStore(store);
    return json(res, 200, {
      ok: true,
      user: adminUserSummary(targetUser),
      users: store.users.slice(0, 500).map(adminUserSummary)
    }, adminAuth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/posts') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const title = sanitizeText(body.title, 160);
    const excerpt = sanitizeText(body.excerpt, 320);
    const content = sanitizeText(body.content, 15000);
    const type = sanitizeContentType(body.type);
    const tags = sanitizeTags(body.tags);
    const publicationStatus = sanitizePublicationStatus(body.publicationStatus);
    if (!title || !excerpt) {
      return json(res, 400, { error: 'invalid_post_payload' });
    }

    const post = {
      id: `post-${crypto.randomUUID()}`,
      title,
      excerpt,
      content,
      type,
      tags,
      isLocked: sanitizeBoolean(body.isLocked),
      publicationStatus,
      date: sanitizeText(body.date, 64) || new Date().toLocaleDateString('fr-FR'),
      tradeDetails: body.tradeDetails && typeof body.tradeDetails === 'object' ? body.tradeDetails : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.posts.unshift(post);
    writeStore(store);
    return json(res, 201, { post, posts: sortPosts(store.posts) }, adminAuth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/posts/auto-rss-drafts') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const requestedLimit = Number(body.limit || 5);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(20, Math.floor(requestedLimit))) : 5;
    const publishNow = sanitizeBoolean(body.publishNow);

    const feedItems = await loadNewsFeed();
    const existingSourceUrls = new Set(
      store.posts
        .map((post) => safeString(post?.autoSourceUrl, 2048))
        .filter(Boolean)
    );
    const createdPosts = [];

    for (const item of feedItems) {
      if (createdPosts.length >= limit) break;
      const sourceUrl = safeString(item?.url, 2048);
      const title = sanitizeText(item?.title, 160);
      const excerpt = sanitizeText(item?.summary || item?.title, 320);
      if (!sourceUrl || !title || !excerpt) continue;
      if (existingSourceUrls.has(sourceUrl)) continue;

      const post = {
        id: `post-auto-rss-${crypto.randomUUID()}`,
        title,
        excerpt,
        content: [
          `${excerpt}`,
          '',
          `Source: ${sanitizeText(item?.source, 80)} - ${sourceUrl}`
        ].join('\n'),
        type: 'ARTICLE',
        tags: ['AUTO_RSS', sanitizeText(item?.source, 24).replace(/\s+/g, '_').toUpperCase()].filter(Boolean),
        isLocked: false,
        publicationStatus: publishNow ? 'PUBLISHED' : 'DRAFT',
        autoSourceUrl: sourceUrl,
        autoSourceName: sanitizeText(item?.source, 80),
        autoPublishedAt: parseDateToIso(item?.publishedAt, new Date().toISOString()),
        date: new Date().toLocaleDateString('fr-FR'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.posts.unshift(post);
      existingSourceUrls.add(sourceUrl);
      createdPosts.push(post);
    }

    if (createdPosts.length) {
      writeStore(store);
    }

    return json(res, 200, {
      ok: true,
      created: createdPosts.length,
      published: publishNow,
      createdPosts,
      posts: sortPosts(store.posts)
    }, adminAuth.responseHeaders);
  }

  if (req.method === 'PATCH' && url.pathname === '/api/admin/trades') {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const nextTrades = Array.isArray(body.trades)
      ? body.trades.map(sanitizeDailyTrade).filter(Boolean).slice(0, 30)
      : [];
    const nextAnalysis = sanitizeText(body.marketAnalysis, 12000);
    const requestedBourseAnalysis = sanitizeText(
      body?.marketAnalyses && typeof body.marketAnalyses === 'object' ? body.marketAnalyses.bourse : body.marketAnalysisBourse,
      12000
    );
    const requestedCryptoAnalysis = sanitizeText(
      body?.marketAnalyses && typeof body.marketAnalyses === 'object' ? body.marketAnalyses.crypto : body.marketAnalysisCrypto,
      12000
    );
    const hasExplicitMarketAnalyses = Boolean(requestedBourseAnalysis || requestedCryptoAnalysis);
    const requestedSnapshotDate = normalizeDateKey(body.snapshotDate);

    if (!nextTrades.length && !nextAnalysis && !hasExplicitMarketAnalyses) {
      return json(res, 400, { error: 'invalid_trades_payload' });
    }

    const effectiveTrades = nextTrades.length
      ? nextTrades
      : (Array.isArray(store.dailyTrades) ? store.dailyTrades : defaultDailyTrades());
    const effectiveAnalysis = nextAnalysis
      || (typeof store.marketAnalysis === 'string' ? store.marketAnalysis : defaultMarketAnalysis());
    const effectiveMarketAnalyses = (() => {
      if (hasExplicitMarketAnalyses) {
        return sanitizeMarketAnalyses(
          {
            bourse: requestedBourseAnalysis,
            crypto: requestedCryptoAnalysis
          },
          effectiveAnalysis
        );
      }
      if (nextAnalysis) {
        return sanitizeMarketAnalyses(
          {
            bourse: nextAnalysis,
            crypto: nextAnalysis
          },
          effectiveAnalysis
        );
      }
      return sanitizeMarketAnalyses(store.marketAnalyses, effectiveAnalysis);
    })();

    if (nextTrades.length) {
      store.dailyTrades = nextTrades;
    }
    if (nextAnalysis) {
      store.marketAnalysis = nextAnalysis;
    }
    if (nextAnalysis || hasExplicitMarketAnalyses) {
      store.marketAnalyses = effectiveMarketAnalyses;
    }

    const snapshotDateKey = requestedSnapshotDate
      || inferTradeSnapshotDateKey(effectiveTrades, new Date().toISOString())
      || new Date().toISOString().slice(0, 10);
    const snapshot = upsertTradeSnapshot(store, {
      dateKey: snapshotDateKey,
      publishedAt: new Date().toISOString(),
      source: 'admin_patch',
      trades: effectiveTrades,
      marketAnalysis: effectiveAnalysis,
      marketAnalyses: effectiveMarketAnalyses
    });

    writeStore(store);
    return json(res, 200, {
      trades: store.dailyTrades,
      marketAnalysis: store.marketAnalysis,
      marketAnalyses: store.marketAnalyses,
      updatedAt: new Date().toISOString(),
      snapshot: snapshot ? {
        id: snapshot.id,
        dateKey: snapshot.dateKey,
        monthKey: snapshot.monthKey,
        publishedAt: snapshot.publishedAt
      } : null,
      archive: {
        totalSnapshots: Array.isArray(store.tradeSnapshots) ? store.tradeSnapshots.length : 0,
        availableSnapshots: sortTradeSnapshotsDesc(store.tradeSnapshots)
          .slice(0, TRADE_SNAPSHOT_SUMMARY_LIMIT)
          .map(buildTradeSnapshotSummary)
      }
    }, adminAuth.responseHeaders);
  }

  const postMatch = req.method === 'PATCH' && url.pathname.match(/^\/api\/admin\/posts\/([^/]+)$/);
  if (postMatch) {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const postId = postMatch[1];
    const post = store.posts.find((item) => item.id === postId);
    if (!post) {
      return json(res, 404, { error: 'post_not_found' });
    }

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const title = sanitizeText(body.title, 160);
    const excerpt = sanitizeText(body.excerpt, 320);
    const content = sanitizeText(body.content, 15000);
    const date = sanitizeText(body.date, 64);
    const type = body.type !== undefined ? sanitizeContentType(body.type) : undefined;
    const tags = body.tags !== undefined ? sanitizeTags(body.tags) : undefined;
    const isLocked = body.isLocked !== undefined ? sanitizeBoolean(body.isLocked) : undefined;
    const publicationStatus = body.publicationStatus !== undefined ? sanitizePublicationStatus(body.publicationStatus) : undefined;

    if (!title || !excerpt) {
      return json(res, 400, { error: 'invalid_post_payload' });
    }

    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    if (type) post.type = type;
    if (tags) post.tags = tags;
    if (typeof isLocked === 'boolean') post.isLocked = isLocked;
    if (publicationStatus) post.publicationStatus = publicationStatus;
    if (date) post.date = date;
    post.updatedAt = new Date().toISOString();

    writeStore(store);
    return json(res, 200, { post, posts: sortPosts(store.posts) }, adminAuth.responseHeaders);
  }

  if (req.method === 'POST' && url.pathname === '/api/reviews') {
    const store = readStore();
    const auth = requireAuthenticated(store, req, res);
    if (!auth) return;
    const permissions = resolveUserPermissions(auth.user);
    if (!permissions.vipAccess) {
      return json(res, 403, { error: 'subscription_required_for_reviews' }, auth.responseHeaders);
    }

    const body = await parseBodyOrFail(req, res, auth.responseHeaders);
    if (!body) return;
    const author = sanitizeText(body.author, 80);
    const content = sanitizeText(body.content, 1500);
    const analysis = sanitizeText(body.analysis, 4000);
    const type = sanitizeText(body.type, 16).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT';
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
    if (!author || !content) {
      return json(res, 400, { error: 'invalid_review_payload' }, auth.responseHeaders);
    }
    const safeVideoUrl = type === 'VIDEO' ? sanitizeText(body.videoUrl, 1024) : '';
    if (type === 'VIDEO' && safeVideoUrl && !isValidHttpUrl(safeVideoUrl)) {
      return json(res, 400, { error: 'invalid_video_url' }, auth.responseHeaders);
    }

    const review = {
      id: `review-${crypto.randomUUID()}`,
      author,
      role: 'VIP',
      rating,
      date: 'A l\'instant',
      content,
      analysis,
      type,
      videoUrl: type === 'VIDEO' ? safeVideoUrl : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.reviews.unshift(review);
    writeStore(store);
    return json(res, 201, { review: publicReview(review) }, auth.responseHeaders);
  }

  const reviewMatch = req.method === 'PATCH' && url.pathname.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if (reviewMatch) {
    const store = readStore();
    const adminAuth = requireAdmin(store, req, res);
    if (!adminAuth) return;

    const body = await parseBodyOrFail(req, res, adminAuth.responseHeaders);
    if (!body) return;
    const status = sanitizeReviewStatus(body.status);
    const reviewId = reviewMatch[1];
    const review = store.reviews.find((item) => item.id === reviewId);
    if (!review) {
      return json(res, 404, { error: 'review_not_found' });
    }
    review.status = status;
    review.updatedAt = new Date().toISOString();
    writeStore(store);
    return json(res, 200, { review: publicReview(review), reviews: sortReviews(store.reviews).map(publicReview) }, adminAuth.responseHeaders);
  }

  return json(res, 404, { error: 'not_found' });
});

validateRuntimeConfig();
ensureStore();

server.listen(PORT, () => {
  console.log(`Black Papers API listening on port ${PORT}`);
});
