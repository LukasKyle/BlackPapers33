
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Unlock, TrendingUp, TrendingDown, Youtube, BookOpen, Wallet, Menu, X, Terminal, Eye, ShieldCheck, Shield, FileKey, LogIn, User, Hash, Copy, AlertTriangle, Check, ArrowRight, Bitcoin, BarChart3, Layers, Bot, Radio, Send, Siren, Zap, Globe, Play, Mic, Target, Crosshair, Handshake, Calculator, DollarSign, Link as LinkIcon, PieChart, Users, Heart, Repeat, MessageCircle, Share2, ExternalLink, HelpCircle, GraduationCap, Building2, Briefcase, Database, Search, Filter, MoreHorizontal, Calendar, CreditCard, LayoutGrid, List, Settings, CheckCircle2, ChevronRight, Plus, Minus, Brain, ThumbsUp, ThumbsDown, Activity, Award, Book, Lightbulb, Scale, Star, Video, MessageSquare, Clock, QrCode, RefreshCcw, Mail } from 'lucide-react';
import { NewsSection } from './components/NewsSection';
import { PortfolioChart } from './components/PortfolioChart';
import { AutoNewsFeed } from './components/AutoNewsFeed';
import { LiveStocksTable } from './components/LiveStocksTable';
import { SignalsPage } from './components/SignalsPage';
import { ContentType, Post, ExternalRSSNews, CRMContact, CourseModule, QuizQuestion, Review, AffiliateCommission, AcademyLevel, Trade } from './types';
import { generateAIContent, fetchExternalRSS } from './services/geminiService';

// --- TYPES ---
interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface AdminUser {
  id: string;
  email: string;
  isSubscribed: boolean;
  isAdmin: boolean;
  manualVipAccess?: boolean;
  needsOnboarding: boolean;
  emailVerified?: boolean;
  referredByCode?: string | null;
  referredByEmail?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionUpdatedAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionLifecycle?: {
    registeredAt?: string | null;
    subscriptionStartedAt?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelRequestedAt?: string | null;
    accessEndsAt?: string | null;
    cancelAtPeriodEnd?: boolean;
  };
  permissions?: {
    vipAccess: boolean;
    canAccessCryptoSignals: boolean;
    canAccessBourseSignals: boolean;
    canAccessTraining: boolean;
  };
  createdAt?: string | null;
  billing?: {
    provider?: string;
    lemonSubscriptionId?: string | null;
    lemonOrderId?: string | null;
    lemonProductName?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    canceledAt?: string | null;
    lastWebhookEvent?: string | null;
    lastWebhookAt?: string | null;
  };
  affiliateProfile?: {
    isAffiliate: boolean;
    referralCode?: string | null;
    referrals: Array<{
      id: string;
      pseudo: string;
      email?: string;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      subscriptionActive: boolean;
      paymentProvider?: string;
      paymentChannel?: string;
      commissionModel?: string;
      commissionAmount: number;
      commissionStatus: 'LOCKED' | 'READY_TO_PAY' | 'PAID';
      followUpRequired?: boolean;
      paidAmount?: number;
      paidCurrency?: string;
      lastPaymentAt?: string | null;
      updatedAt?: string | null;
      joinedAt?: string;
    }>;
    commissionHistory: AffiliateCommission[];
  };
}

interface SessionUser extends AdminUser {}
type OAuthProvider = 'google' | 'facebook' | 'apple' | 'linkedin';

interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

interface MarketTickerSnapshot {
  mode: 'live' | 'partial' | 'fallback';
  sources?: {
    stocks?: string;
    crypto?: string;
  };
  stocks: MarketTickerItem[];
  crypto: MarketTickerItem[];
  updatedAt: string;
}

interface XFeedAccount {
  id: string;
  name: string;
  handle: string;
  focus?: string;
  url: string;
}

interface XFeedSnapshot {
  mode: string;
  updatedAt: string;
  note?: string;
  accounts: XFeedAccount[];
}

interface VipActivitySnapshot {
  windowMinutes: number;
  totalVipMembers: number;
  activeNow: number;
  active24h: number;
  recentActivity: Array<{
    userId: string;
    emailMasked: string;
    subscriptionPlan: string;
    lastSeenAt: string;
  }>;
  updatedAt: string;
}

interface LemonSubscriptionConfig {
  lemon: {
    mode: 'api' | 'url';
    apiEnabled: boolean;
    webhookEnabled: boolean;
    plans: {
      bourse: boolean;
      crypto: boolean;
      combo: boolean;
    };
    successUrl: string;
    cancelUrl: string;
  };
  plans: string[];
  mode: 'api' | 'url';
}

interface CrmLead {
  id: string;
  email: string;
  source: string;
  referralCode?: string;
  referralOwnerEmail?: string | null;
  status: 'LEAD' | 'REGISTERED' | 'VIP_ACTIVE' | 'ARCHIVED';
  userId: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  lastEvent: string;
  createdAt: string;
  updatedAt: string;
}

interface CrmOverview {
  funnel: {
    leadsCaptured: number;
    registeredUsers: number;
    vipActiveUsers: number;
    onboardingPending: number;
    pendingVerification: number;
    canceledUsers: number;
  };
  plans: Record<string, number>;
  affiliates?: Array<{
    ownerUserId: string | null;
    ownerEmail: string;
    referralCode: string | null;
    referralsCount: number;
    activeReferralsCount: number;
    followUpRequiredCount?: number;
    totalCommissionAmount: number;
    referrals: Array<{
      id: string;
      pseudo: string;
      subscriptionPlan: string;
      subscriptionStatus?: string;
      subscriptionActive: boolean;
      paymentProvider?: string;
      paymentChannel?: string;
      commissionModel?: string;
      commissionAmount: number;
      commissionStatus: 'LOCKED' | 'READY_TO_PAY' | 'PAID';
      followUpRequired?: boolean;
      paidAmount?: number;
      paidCurrency?: string;
      lastPaymentAt?: string | null;
      updatedAt?: string | null;
      joinedAt: string | null;
    }>;
  }>;
  leads: CrmLead[];
}

const SUBSCRIPTION_PLANS: Plan[] = [
  { id: 'crypto', name: 'Signaux Crypto', price: 29, description: 'Analyses et signaux axes crypto' },
  { id: 'bourse', name: 'Signaux Bourse', price: 29, description: 'Analyses et signaux axes indices/actions' },
  { id: 'combo', name: 'Pack Complet', price: 49, description: 'Crypto + Bourse' }
];

const MAX_REFERRAL_CODE_LENGTH = 32;
const MAX_VIDEO_URL_LENGTH = 1024;
const normalizeApiBaseUrl = (value: string): string => String(value || '').trim().replace(/\/+$/, '');
const inferRenderApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const host = String(window.location.hostname || '').toLowerCase();
  if (!host.endsWith('.onrender.com')) return '';

  const explicitRenderServiceUrl = normalizeApiBaseUrl((import.meta as any).env?.VITE_RENDER_API_SERVICE_URL || '');
  if (explicitRenderServiceUrl) return explicitRenderServiceUrl;

  const renderApiServiceName = String((import.meta as any).env?.VITE_RENDER_API_SERVICE_NAME || '').trim();
  if (renderApiServiceName) return `https://${renderApiServiceName}.onrender.com`;

  if (host.startsWith('black-papers-web.')) {
    return `${window.location.protocol}//${host.replace('black-papers-web.', 'black-papers-api.')}`;
  }
  return '';
};

const API_BASE_URL = (() => {
  const explicit = normalizeApiBaseUrl((import.meta as any).env?.VITE_API_BASE_URL || '');
  if (explicit) return explicit;
  return inferRenderApiBaseUrl();
})();
const LEAD_STORAGE_KEY = 'bp_lead_email';

const sanitizeReferralCode = (raw: string): string => {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_REFERRAL_CODE_LENGTH);
};

const isSafeExternalUrl = (rawUrl: string): boolean => {
  if (!rawUrl || rawUrl.length > MAX_VIDEO_URL_LENGTH) return false;
  try {
    const parsed = new URL(rawUrl);
    const blockedHosts = new Set(['localhost', '127.0.0.1', '::1']);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !blockedHosts.has(parsed.hostname);
  } catch {
    return false;
  }
};

const buildApiUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};
const apiFetch = (path: string, init: RequestInit = {}) => {
  return fetch(buildApiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers || {})
    }
  });
};

const getCookieValue = (name: string): string => {
  if (typeof document === 'undefined') return '';
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match || !match[1]) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const getFriendlyAuthError = (code: string): string => {
  switch (code) {
    case 'invalid_credentials':
      return "Email ou mot de passe incorrect.";
    case 'user_exists':
      return "Un compte existe déjà avec cet email.";
    case 'email_conflict':
      return "Cet email est déjà lié à un autre compte.";
    case 'invalid_social_payload':
      return "Les informations de connexion sociale sont invalides.";
    case 'social_auth_disabled':
      return "La connexion sociale est temporairement indisponible pour des raisons de sécurité.";
    case 'social_auth_legacy_disabled':
      return "Ancien endpoint social désactivé. Utilisez les boutons OAuth.";
    case 'oauth_provider_unavailable':
      return "Ce provider social n'est pas encore configuré côté serveur.";
    case 'oauth_state_invalid':
      return "Session OAuth expirée ou invalide. Relancez la connexion sociale.";
    case 'oauth_cancelled':
      return "Connexion sociale annulée.";
    case 'oauth_failed':
      return "Connexion sociale impossible pour le moment.";
    case 'email_not_verified':
      return "Email non vérifié. Vérifiez votre boîte mail puis réessayez.";
    case 'verification_expired':
      return "Lien de vérification expiré. Demandez un nouvel email.";
    case 'verification_invalid':
      return "Lien de vérification invalide.";
    case 'invalid_reset_payload':
      return "Données de réinitialisation invalides.";
    case 'reset_token_invalid':
      return "Lien de réinitialisation invalide.";
    case 'reset_token_expired':
      return "Lien de réinitialisation expiré. Demandez un nouveau lien.";
    case 'password_unchanged':
      return "Choisissez un mot de passe différent de l'ancien.";
    case 'delete_confirmation_invalid':
      return "Confirmation invalide. Tapez exactement SUPPRIMER.";
    case 'delete_email_mismatch':
      return "L'email de confirmation ne correspond pas à votre compte.";
    case 'admin_delete_forbidden':
      return "Suppression d'un compte admin désactivée ici. Utilisez la procédure admin dédiée.";
    case 'account_delete_failed':
      return "Suppression du compte impossible pour le moment.";
    case 'session_cookie_blocked':
      return "Connexion refusée par le navigateur : cookie de session non accepté. Vérifiez la configuration backend (SameSite=None + Secure en HTTPS, CORS autorisé).";
    default:
      return "Authentification indisponible pour le moment. Réessayez dans quelques instants.";
  }
};

const buildOAuthCallbackHints = (callbackBaseUrl: string) => {
  const base = String(callbackBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return [];
  return [
    `Google: ${base}/api/auth/oauth/google/callback`,
    `Facebook: ${base}/api/auth/oauth/facebook/callback`,
    `Apple: ${base}/api/auth/oauth/apple/callback`,
    `LinkedIn: ${base}/api/auth/oauth/linkedin/callback`
  ];
};

const formatPlanLabel = (planId?: string | null): string => {
  switch ((planId || '').toLowerCase()) {
    case 'crypto':
      return 'Signaux Crypto';
    case 'bourse':
      return 'Signaux Bourse';
    case 'combo':
      return 'Pack Complet';
    case 'admin':
      return 'Acces Administrateur Total';
    case 'none':
    default:
      return 'Aucun abonnement';
  }
};

const formatSubscriptionStatusLabel = (status?: string | null): string => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Actif';
    case 'PENDING_VERIFICATION':
      return 'En attente';
    case 'PAST_DUE':
      return 'Paiement en retard';
    case 'CANCELED':
      return 'Annule';
    case 'ADMIN':
      return 'Admin';
    case 'NONE':
    default:
      return 'Aucun';
  }
};

const normalizeRequestedPlan = (value?: string | null): 'bourse' | 'crypto' | 'combo' => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'bourse') return 'bourse';
  if (normalized === 'crypto') return 'crypto';
  return 'combo';
};

const normalizeEmailSearch = (value?: string | null): string => String(value || '').trim().toLowerCase();

const getSubscriptionApiErrorMessage = (code: string): string => {
  switch (code) {
    case 'invalid_plan':
      return "Plan d'abonnement invalide.";
    case 'lemon_plan_not_configured':
      return "Ce plan n'est pas encore configuré dans Lemon Squeezy.";
    case 'lemon_api_not_ready':
      return "Configuration Lemon Squeezy incomplète côté serveur.";
    case 'lemon_checkout_failed':
      return "Impossible de créer la session de paiement Lemon.";
    case 'lemon_checkout_url_missing':
      return "URL de checkout Lemon absente côté serveur.";
    case 'auth_required':
      return 'Connectez-vous avant de démarrer le paiement.';
    default:
      return "Le paiement n'a pas pu être démarré pour le moment.";
  }
};

const isPostPublished = (post?: Partial<Post> | null): boolean => {
  return String(post?.publicationStatus || 'PUBLISHED').toUpperCase() !== 'DRAFT';
};

const formatDateLabel = (value?: string | null): string => {
  if (!value) return 'Non disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatMoney = (value: number): string => {
  if (!Number.isFinite(value)) return '--';
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  }
  if (Math.abs(value) >= 1) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6 });
};

const formatRelativeTime = (isoDate: string): string => {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return "A l'instant";
  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.round(deltaMs / 60000);
  if (deltaMinutes < 1) return "A l'instant";
  if (deltaMinutes < 60) return `il y a ${deltaMinutes} min`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `il y a ${deltaHours} h`;
  const deltaDays = Math.round(deltaHours / 24);
  return `il y a ${deltaDays} j`;
};

const formatCommissionStatus = (status: 'LOCKED' | 'READY_TO_PAY' | 'PAID'): string => {
  switch (status) {
    case 'PAID':
      return 'Payee';
    case 'READY_TO_PAY':
      return 'A verser';
    case 'LOCKED':
    default:
      return 'En attente';
  }
};

const formatPaymentProviderLabel = (provider?: string | null): string => {
  switch ((provider || '').toUpperCase()) {
    case 'MANUAL':
      return 'Crypto manuel';
    case 'LEMON_SQUEEZY':
      return 'Carte (Lemon)';
    default:
      return 'Non renseigne';
  }
};

const formatCommissionModelLabel = (model?: string | null): string => {
  switch ((model || '').toUpperCase()) {
    case 'CRYPTO_50_PERCENT_MANUAL':
      return '50% (crypto)';
    case 'LEMON_AFFILIATE_EXTERNAL':
      return 'Externe Lemon';
    case 'LEMON_CARD_INTERNAL_DISABLED':
      return 'Carte sans partage interne';
    default:
      return 'Aucun';
  }
};

const formatFollowUpLabel = (followUpRequired?: boolean, provider?: string | null): string => {
  if (followUpRequired) return 'Oui';
  if ((provider || '').toUpperCase() === 'LEMON_SQUEEZY') return 'Non (auto)';
  return 'Non';
};

const DEFAULT_PERMISSIONS = {
  vipAccess: false,
  canAccessCryptoSignals: false,
  canAccessBourseSignals: false,
  canAccessTraining: false
};

const getUserPermissions = (user: SessionUser | null) => {
  if (!user?.permissions) return DEFAULT_PERMISSIONS;
  return {
    vipAccess: Boolean(user.permissions.vipAccess),
    canAccessCryptoSignals: Boolean(user.permissions.canAccessCryptoSignals),
    canAccessBourseSignals: Boolean(user.permissions.canAccessBourseSignals),
    canAccessTraining: Boolean(user.permissions.canAccessTraining)
  };
};

// --- MOCK DATA INITIAL ---
const INITIAL_POSTS: Post[] = [
  {
    id: 'trade-123',
    type: ContentType.TRADE_SIGNAL,
    title: 'Signal VIP du jour (aperçu)',
    excerpt: 'Le détail complet (entry, SL, TP, scénario) est accessible uniquement via abonnement actif validé côté serveur.',
    content: '',
    date: 'Aujourd\'hui, 09:30',
    isLocked: true,
    tags: ['VIP', 'Signal', 'Locked']
  },
  {
    id: 'p1',
    type: ContentType.ARTICLE,
    title: 'Pourquoi j\'ai shorté le S&P500 cette semaine',
    excerpt: 'L\'analyse macro-économique montre des signes de faiblesse clairs. Voici mon raisonnement détaillé...',
    content: '...',
    date: 'Hier',
    isLocked: false,
    tags: ['Macro', 'SP500', 'Opinion']
  }
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'CryptoMatrix',
    role: 'INFLUENCER',
    platform: 'YouTube',
    rating: 5,
    date: 'Il y a 2 jours',
    createdAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
    content: "J'ai audité les Black Papers. C'est l'un des rares services qui montre ses pertes. La transparence est totale.",
    type: 'VIDEO',
    videoUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', // Mock thumbnail
    status: 'APPROVED'
  },
  {
    id: 'r2',
    author: 'Thomas R.',
    role: 'VIP',
    rating: 5,
    date: 'Hier',
    createdAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
    content: "Remboursé en un seul trade sur SOL. La Black Academy m'a enfin fait comprendre le Risk Management.",
    analysis: "Point fort: structure des signaux claire. Point à améliorer: plus de revues vidéo hebdomadaires.",
    type: 'TEXT',
    status: 'APPROVED',
    pnlProof: true
  },
  {
    id: 'r3',
    author: 'Sarah L.',
    role: 'USER',
    rating: 4,
    date: 'Il y a 1 semaine',
    createdAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
    content: "Approche très pro. Pas de promesses de devenir riche, juste du vrai trading.",
    type: 'TEXT',
    status: 'APPROVED'
  },
  {
    id: 'r4',
    author: 'WhaleHunter_99',
    role: 'INFLUENCER',
    platform: 'Twitter',
    rating: 5,
    date: 'Il y a 3 jours',
    createdAt: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(),
    content: "Le setup sur BTC hier était chirurgical. Merci pour l'alpha.",
    type: 'TEXT',
    status: 'APPROVED'
  },
  {
    id: 'r5',
    author: 'Anon_User_22',
    role: 'USER',
    rating: 3,
    date: 'Aujourd\'hui',
    createdAt: new Date().toISOString(),
    content: "Contenu top mais j'aimerais plus de lives vidéo.",
    type: 'TEXT',
    status: 'PENDING'
  }
];

const MOCK_CRM_DATA: CRMContact[] = [
  { id: 'u1', identifier: '0049 2381 9928', status: 'ACTIVE', plan: 'FULL', joinedDate: '2023-09-12', affiliateSource: 'TRADERPRO', totalSpent: 450, lastLogin: '2h ago', paymentMethod: 'LEMON_SQUEEZY', paymentStatus: 'PAID' },
  { id: 'u2', identifier: 'jean.dupont@gmail.com', status: 'ACTIVE', plan: 'CRYPTO', joinedDate: '2023-10-01', totalSpent: 30, lastLogin: '1d ago', paymentMethod: 'CRYPTO_GATEWAY', paymentStatus: 'PAID' },
  { id: 'u3', identifier: '0012 8847 1120', status: 'EXPIRED', plan: 'NONE', joinedDate: '2023-08-15', affiliateSource: 'YOUTUBE_ADS', totalSpent: 150, lastLogin: '15d ago', notes: 'Payment failed', paymentMethod: 'LEMON_SQUEEZY', paymentStatus: 'LATE' },
  { id: 'u4', identifier: 'crypto_king_99', status: 'ACTIVE', plan: 'FULL', joinedDate: '2023-10-26', totalSpent: 50, lastLogin: 'Just now', paymentMethod: 'CRYPTO_GATEWAY', paymentStatus: 'LATE' }, // Late crypto payer
  { id: 'u5', identifier: '0099 1122 3344', status: 'BANNED', plan: 'FULL', joinedDate: '2023-01-20', totalSpent: 1200, lastLogin: '30d ago', notes: 'Shared account credentials', paymentMethod: 'LEMON_SQUEEZY', paymentStatus: 'PAID' },
  { id: 'u6', identifier: 'alice.m@proton.me', status: 'ACTIVE', plan: 'BOURSE', joinedDate: '2023-09-28', affiliateSource: 'PARTNER_XYZ', totalSpent: 60, lastLogin: '5h ago', paymentMethod: 'LEMON_SQUEEZY', paymentStatus: 'PAID' },
];

const MOCK_OPPORTUNITIES = [
  { id: 'op1', title: 'Partenariat Influenceur X', value: 5000, stage: 'NEGOTIATION', contact: '0049 2381 9928' },
  { id: 'op2', title: 'Abonnement Corporate', value: 1200, stage: 'NEW', contact: 'jean.dupont@gmail.com' },
  { id: 'op3', title: 'Sponsoring Podcast', value: 500, stage: 'WON', contact: 'alice.m@proton.me' },
  { id: 'op4', title: 'Lead Whale TRC20', value: 10000, stage: 'CONTACTED', contact: 'Unknown' },
];

const ACADEMY_STORAGE_KEY = 'bp_academy_progress_v2';

const GLOSSARY_TERMS = [
  { term: 'Long', definition: 'Position prise pour profiter d une hausse du prix.' },
  { term: 'Short', definition: 'Position prise pour profiter d une baisse du prix.' },
  { term: 'Spot', definition: 'Achat ou vente de l actif reel, sans contrat derive.' },
  { term: 'Futures', definition: 'Contrat derive permettant souvent d utiliser du levier.' },
  { term: 'Levier', definition: 'Multiplicateur d exposition qui augmente autant le gain que la perte.' },
  { term: 'Liquidation', definition: 'Fermeture forcee de la position quand la marge ne suffit plus.' },
  { term: 'Bid', definition: 'Meilleur prix auquel les acheteurs sont prets a acheter.' },
  { term: 'Ask', definition: 'Meilleur prix auquel les vendeurs sont prets a vendre.' },
  { term: 'Spread', definition: 'Ecart entre le bid et le ask.' },
  { term: 'Slippage', definition: 'Difference entre le prix voulu et le prix reel d execution.' },
  { term: 'Support', definition: 'Zone ou les acheteurs defendent historiquement le prix.' },
  { term: 'Resistance', definition: 'Zone ou les vendeurs repoussent souvent le prix.' },
  { term: 'Breakout', definition: 'Sortie du prix d une zone importante.' },
  { term: 'Retest', definition: 'Retour du prix sur une zone cassée pour la valider ou l invalider.' },
  { term: 'BOS', definition: 'Break of Structure, cassure nette d une structure precedente.' },
  { term: 'CHOCH', definition: 'Change of Character, premier signe de changement de dynamique.' },
  { term: 'VWAP', definition: 'Prix moyen pondere par le volume, tres suivi en intraday.' },
  { term: 'RSI', definition: 'Indicateur de vitesse du mouvement, utile pour lire la surchauffe.' },
  { term: 'FOMO', definition: 'Peur de rater le mouvement, souvent cause de mauvais trades.' },
  { term: 'R:R', definition: 'Ratio risque / recompense d un trade.' },
  { term: 'Stop Loss', definition: 'Niveau d invalidation qui limite la perte maximale.' },
  { term: 'Take Profit', definition: 'Niveau ou l on encaisse tout ou partie des gains.' },
  { term: 'CPI', definition: 'Indice d inflation americain, tres surveille par les marches.' },
  { term: 'FOMC', definition: 'Communication et decisions de la Fed sur la politique monetaire.' },
];

// --- COURSE & QUIZ DATA ---

const COURSE_MODULES: CourseModule[] = [
  {
    id: 'm1',
    title: 'Module 1 : Jargon du Trading',
    description: 'Le vocabulaire indispensable pour ne plus lire les marchés comme une langue étrangère.',
    level: 'BEGINNER',
    durationMinutes: 8,
    icon: <Book />,
    content: [
      {
        title: "Long, Short, Spot, Futures",
        text: "En trading, chaque mot change la logique de l'operation.\n\n• LONG : vous pariez sur une hausse.\n• SHORT : vous pariez sur une baisse.\n• SPOT : vous achetez l'actif reel, sans mecanique de liquidation.\n• FUTURES / PERPETUALS : vous traitez un contrat derive, souvent avec levier.\n\nErreur classique : croire qu'un trade spot et un trade futures se gerent pareil. En futures, la vitesse, le levier et la liquidation changent tout."
      },
      {
        title: "Levier, Marge, Liquidation",
        text: "Le levier ne cree pas de talent. Il grossit juste vos erreurs.\n\n• Levier x5 : votre exposition est 5 fois votre capital immobilise.\n• Marge : l'argent bloque pour tenir la position.\n• Liquidation : le point ou l'exchange ferme votre position car votre marge ne suffit plus.\n\nRegle simple : si vous ne savez pas calculer votre perte maximale, vous ne devez pas utiliser de levier.",
        diagram: 'RISK'
      },
      {
        title: "Bid, Ask, Spread, Slippage",
        text: "Avant meme de penser au setup, il faut comprendre comment vous etes execute.\n\n• BID : meilleur prix propose par les acheteurs.\n• ASK : meilleur prix propose par les vendeurs.\n• SPREAD : ecart entre bid et ask.\n• SLIPPAGE : difference entre le prix voulu et le prix reellement obtenu.\n\nSur un actif peu liquide, un mauvais slippage peut ruiner un bon setup."
      },
      {
        title: "Bullish, Bearish, Range, Breakout",
        text: "• BULLISH : biais haussier.\n• BEARISH : biais baissier.\n• RANGE : marche coincé entre un haut et un bas.\n• BREAKOUT : sortie d'une zone importante.\n• RETEST : retour du prix sur la zone cassée.\n\nUn breakout sans volume ni confirmation est souvent un faux signal."
      },
      {
        title: "Order Book, Liquidite, Chasse aux Stops",
        text: "Le marche cherche de la liquidite.\n\n• ORDER BOOK : carnet d'ordres acheteurs/vendeurs.\n• LIQUIDITE : zones ou beaucoup d'ordres attendent.\n• STOP HUNT : mouvement rapide qui nettoie les stops avant de repartir.\n\nLe prix ne bouge pas au hasard. Il va souvent la ou il y a des ordres a executer."
      }
    ]
  },
  {
    id: 'm2',
    title: 'Module 2 : Lecture de Graphique',
    description: 'Comprendre les bougies, les zones clefs et la structure d’un marche.',
    level: 'BEGINNER',
    durationMinutes: 10,
    icon: <BarChart3 />,
    content: [
      {
        title: "Bougies Japonaises",
        text: "Une bougie raconte un combat entre acheteurs et vendeurs.\n\n• Corps : distance entre ouverture et cloture.\n• Meche haute : rejet des prix superieurs.\n• Meche basse : rejection des prix inferieurs.\n• Bougie impulsive : conviction.\n• Doji : hesitation.\n\nUne bougie seule ne suffit pas. Ce qui compte, c'est sa position dans le contexte.",
        diagram: 'CANDLES'
      },
      {
        title: "Support, Resistance, Zone de Valeur",
        text: "Le marche a de la memoire.\n\n• SUPPORT : zone defendue par les acheteurs.\n• RESISTANCE : zone defendue par les vendeurs.\n• ZONE : on travaille rarement sur un prix exact, mais sur une plage.\n\nQuand une resistance casse proprement, elle peut devenir un support. Mais seulement si le marche accepte la zone au retest.",
        diagram: 'TREND'
      },
      {
        title: "Structure de Marche",
        text: "Pour lire un graphe, posez 3 questions :\n\n1. Est-ce que le marche fait des sommets et creux ascendants ?\n2. Est-ce qu'on est en tendance, en range, ou en retournement ?\n3. Ou est la derniere zone importante ?\n\nOn cherche ensuite des cassures de structure (BOS), des changements de caractere (CHOCH) et des retests valides."
      },
      {
        title: "Timeframes et Confluence",
        text: "Un meme actif peut etre haussier en 4H et baissier en 5 minutes.\n\nRegle pratique :\n• HTF (4H / 1D) = direction\n• LTF (15m / 5m) = execution\n\nVous ne voulez pas acheter agressivement contre une tendance 4H sans raison exceptionnelle."
      }
    ]
  },
  {
    id: 'm3',
    title: 'Module 3 : Ordres et Execution',
    description: 'Connaitre la difference entre bien analyser et bien executer.',
    level: 'BEGINNER',
    durationMinutes: 7,
    icon: <Target />,
    content: [
      {
        title: "Market, Limit, Stop",
        text: "• MARKET ORDER : vous entrez tout de suite, au meilleur prix disponible.\n• LIMIT ORDER : vous imposez votre prix.\n• STOP ORDER : l'ordre se declenche quand un niveau est touche.\n\nLe bon trader ne choisit pas un ordre par habitude, mais selon le contexte et la liquidite."
      },
      {
        title: "Entry, Stop Loss, Take Profit",
        text: "Avant de cliquer, vous devez connaitre 3 points :\n\n• ENTREE : ou j'entre.\n• INVALIDATION / STOP LOSS : ou le scenario est faux.\n• TAKE PROFIT : ou je prends au moins une partie des gains.\n\nSi vous n'avez pas ces 3 niveaux, vous etes en train d'improviser."
      },
      {
        title: "Execution Propre",
        text: "Une bonne execution veut dire :\n\n• ne pas bouger son stop par ego\n• ne pas rajouter au hasard dans la douleur\n• accepter qu'un setup manqué reste manqué\n• couper vite quand le plan est invalide\n\nL'execution fait souvent plus de difference que l'analyse."
      }
    ]
  },
  {
    id: 'm4',
    title: 'Module 4 : Gestion du Risque',
    description: 'Le bloc le plus important si tu veux survivre plus de trois semaines.',
    level: 'BEGINNER',
    durationMinutes: 9,
    icon: <ShieldCheck />,
    content: [
      {
        title: "La Règle de l'Or : Le R:R",
        text: "Le Risk:Reward Ratio est votre filtre de qualite.\n\nNe risquez pas 1 pour gagner 0.5 sauf raison tres specifique. Cherchez plutot des structures ou vous risquez 1 pour gagner 2 ou 3.\n\nAvec un bon R:R, vous pouvez rester rentable sans gagner tous vos trades."
      },
      {
        title: "Stop Loss : Votre Ceinture de Sécurité",
        text: "Ne lancez jamais un trade sans savoir ou vous sortez si vous avez tort.\n\nLe stop loss protege votre capital, mais aussi votre discipline. Le deplacer pour 'laisser respirer' un mauvais trade est une erreur de debutant."
      },
      {
        title: "Taille de Position",
        text: "Le bon reflexe n'est pas : 'Combien puis-je gagner ?' mais 'Combien puis-je perdre ?'\n\nExemple simple : si vous acceptez de perdre 1% du capital sur un trade, alors la taille de position doit etre calculee en fonction de la distance entre entree et stop."
      },
      {
        title: "Risque par Jour, Risque par Semaine",
        text: "Regles recommandees pour debuter :\n\n• 0.5% a 1% risque par trade\n• maximum 2 ou 3 trades a risque plein par jour\n• stop de jour apres 2 pertes consecutives\n• pause obligatoire apres une erreur emotionnelle\n\nLe but n'est pas d'etre heros une fois. Le but est d'etre encore la dans 6 mois."
      }
    ]
  },
  {
    id: 'm5',
    title: 'Module 5 : Outils Techniques',
    description: 'Les indicateurs utiles, sans tomber dans l’usine a gaz.',
    level: 'INTERMEDIATE',
    durationMinutes: 8,
    icon: <Activity />,
    content: [
      {
        title: "Volume, VWAP, Moyennes Mobiles",
        text: "Quelques outils suffisent largement.\n\n• VOLUME : confirme ou infirme une cassure.\n• VWAP : repere de prix moyen tres suivi.\n• MOYENNES MOBILES : lisibilite de tendance, pas boule de cristal.\n\nUn indicateur n'est utile que s'il vous aide a decider mieux, pas a vous rassurer."
      },
      {
        title: "RSI et Surchauffe",
        text: "Le RSI ne dit pas 'acheter' ou 'vendre' a lui seul.\n\nIl mesure surtout la vitesse du mouvement. Au-dessus de 70, le marche peut etre en surchauffe. En dessous de 30, il peut etre survendu. Mais en forte tendance, il peut rester longtemps en zone extreme."
      },
      {
        title: "Confluence",
        text: "Une confluence, c'est quand plusieurs raisons independantes pointent dans la meme direction :\n\n• zone technique\n• biais HTF\n• volume\n• news calmes\n• timing propre\n\nPlus il y a de confluences, plus le setup est propre."
      }
    ]
  },
  {
    id: 'm6',
    title: 'Module 6 : Macro et Actualite',
    description: 'Savoir quand un calendrier economique peut detruire un bon setup.',
    level: 'INTERMEDIATE',
    durationMinutes: 8,
    icon: <Globe />,
    content: [
      {
        title: "CPI, FOMC, NFP, Taux",
        text: "Quelques evenements peuvent changer brutalement le prix :\n\n• CPI : inflation US\n• FOMC : decision de la Fed\n• NFP : emploi americain\n• Taux / discours banques centrales\n\nAvant chaque trade, demandez-vous : 'Y a-t-il une news majeure dans moins de 2 heures ?'"
      },
      {
        title: "DXY, Rendements, Correlations",
        text: "Le dollar, les taux et les indices influencent souvent crypto et actions.\n\n• DXY fort : pression frequente sur les actifs a risque\n• rendements obligataires qui montent : risque sur tech/crypto\n• correlations : BTC, Nasdaq et liquidite globale se parlent souvent"
      },
      {
        title: "Quand Ne Pas Trader",
        text: "Le meilleur trade est parfois de ne rien faire.\n\nOn evite generalement :\n• juste avant une annonce majeure\n• quand la volatilite devient incoherente\n• quand on n'a pas de biais clair\n• quand on est fatigue ou emotionnel"
      }
    ]
  },
  {
    id: 'm7',
    title: 'Module 7 : Journal de Trading',
    description: 'Transformer chaque trade en donnees utiles au lieu de répéter les mêmes erreurs.',
    level: 'INTERMEDIATE',
    durationMinutes: 7,
    icon: <BookOpen />,
    content: [
      {
        title: "Ce qu'il faut noter apres chaque trade",
        text: "Un bon journal contient au minimum :\n\n• actif et sens du trade\n• raison d'entree\n• stop / take profit\n• capture d'ecran\n• resultat\n• erreur principale\n• emotion dominante\n\nLe journal rend visible ce que votre memoire essaie de cacher."
      },
      {
        title: "Mesurer l'Execution, pas Seulement le PnL",
        text: "Un trade gagnant peut etre mal execute. Un trade perdant peut etre tres bon.\n\nLa vraie question est : 'Ai-je respecte mon plan ?' Si oui, le trade peut etre valide meme en perte."
      },
      {
        title: "Checklist de Revue Hebdomadaire",
        text: "Chaque semaine, relisez vos trades et cherchez :\n\n• les erreurs recurrentes\n• les heures ou vous etes mauvais\n• les setups rentables\n• les contextes a eviter\n\nLe journal n'est pas un musee. C'est un outil d'amelioration."
      }
    ]
  },
  {
    id: 'm8',
    title: 'Module 8 : Psychologie',
    description: 'Maîtriser les émotions qui détruisent les comptes plus vite que le marché.',
    level: 'ADVANCED',
    durationMinutes: 8,
    icon: <Brain />,
    content: [
      {
        title: "Le FOMO (Fear Of Missing Out)",
        text: "Le FOMO, c'est vouloir entrer parce que le prix part sans vous.\n\nLe danger : vous achetez souvent au pire moment, loin de votre zone, sans vrai stop logique."
      },
      {
        title: "Le Revenge Trading",
        text: "Apres une perte, le cerveau veut se venger. Vous augmentez la taille, vous forcez un setup, et vous vous enterrez.\n\nRegle simple : apres un trade emotionnel, pause obligatoire."
      },
      {
        title: "Ego, Ennui, Surtrading",
        text: "On ne perd pas toujours a cause d'une mauvaise analyse.\n\nOn perd aussi parce qu'on veut avoir raison, parce qu'on s'ennuie, ou parce qu'on veut 'faire quelque chose'.\n\nTrader moins, mais mieux, est souvent un progres."
      },
      {
        title: "Routine Mentale",
        text: "Avant de trader, posez-vous 4 questions :\n\n• Suis-je fatigue ?\n• Suis-je presse ?\n• Suis-je en train de me refaire ?\n• Est-ce que je suivrais ce trade si quelqu'un me regardait ?\n\nSi une reponse vous gene, attendez."
      }
    ]
  },
  {
    id: 'm9',
    title: 'Module 9 : Checklist Pre-Trade',
    description: 'Le protocole simple a suivre avant chaque position.',
    level: 'ADVANCED',
    durationMinutes: 6,
    icon: <CheckCircle2 />,
    content: [
      {
        title: "La Checklist en 8 Points",
        text: "Avant chaque trade :\n\n1. Quel est le biais HTF ?\n2. Quelle est la zone cle ?\n3. Quelle est l'invalidation ?\n4. Quel est le R:R ?\n5. Y a-t-il une news proche ?\n6. Ma taille est-elle correcte ?\n7. Suis-je emotionnel ?\n8. Le setup existe-t-il vraiment ?\n\nSi vous n'avez pas de reponse propre a ces 8 points, pas de trade."
      },
      {
        title: "Ce que font les debutants",
        text: "Ils entrent d'abord, puis cherchent des raisons ensuite.\n\nLe bon ordre est l'inverse : analyse, plan, taille, execution."
      }
    ]
  },
  {
    id: 'm10',
    title: 'Module 10 : Plan de Trading Ecrit',
    description: 'Construire un plan concret et mesurable pour arreter les decisions au hasard.',
    level: 'INTERMEDIATE',
    durationMinutes: 9,
    icon: <Calculator />,
    content: [
      {
        title: "Pourquoi ecrire un plan",
        text: "Un plan ecrit evite de trader selon l'humeur.\n\nVotre plan doit definir :\n• marche cible (crypto, bourse, ou les deux)\n• horaires autorises\n• setups autorises\n• risque max par trade et par jour\n• conditions d'arret.\n\nSi ce n'est pas ecrit, ce n'est pas une regle."
      },
      {
        title: "Objectifs SMART de trader",
        text: "Votre objectif ne doit pas etre 'devenir riche vite'.\n\nExemple SMART :\n• prendre seulement 2 setups qualifies par jour\n• respecter 100% des stops sur 30 jours\n• ne pas depasser -3% de perte hebdomadaire.\n\nOn mesure la qualite du process avant de mesurer l'argent."
      },
      {
        title: "Regles de suspension",
        text: "Un bon plan inclut des coupe-circuits :\n\n• 2 pertes emotionnelles consecutives -> stop de la journee\n• semaine negative + erreurs de discipline -> reduction de taille\n• fatigue / stress eleve -> pas de trading.\n\nLes pauses protegeant le capital sont des decisions professionnelles."
      }
    ]
  },
  {
    id: 'm11',
    title: 'Module 11 : Multi-Timeframes',
    description: 'Aligner contexte long terme et execution court terme.',
    level: 'INTERMEDIATE',
    durationMinutes: 8,
    icon: <Layers />,
    content: [
      {
        title: "Structure en 3 etages",
        text: "Framework simple :\n\n• 1D / 4H : contexte (biais et zones majeures)\n• 1H / 15m : setup\n• 5m / 1m : execution.\n\nOn ne decide pas le sens du trade sur le plus petit timeframe."
      },
      {
        title: "Conflits de timeframes",
        text: "Quand le 5m monte mais le 4H baisse, vous etes en contre-tendance.\n\nOptions propres :\n• reduire la taille\n• viser des objectifs plus courts\n• attendre un setup dans le sens du 4H."
      },
      {
        title: "Routine avant entree",
        text: "Avant chaque ordre :\n1. noter le biais HTF\n2. identifier la zone de travail\n3. valider le trigger LTF\n4. calculer le risque.\n\nPas de validation des 4 etapes = pas de trade."
      }
    ]
  },
  {
    id: 'm12',
    title: 'Module 12 : Timing de Session',
    description: 'Savoir quelles heures trader, et lesquelles eviter.',
    level: 'INTERMEDIATE',
    durationMinutes: 7,
    icon: <Clock />,
    content: [
      {
        title: "Fenêtres horaires utiles",
        text: "Toutes les heures ne se valent pas.\n\nEn general :\n• ouverture Europe : plus de mouvement sur FX/indices EU\n• ouverture US : acceleration sur indices US et crypto\n• heures creuses : faux signaux plus frequents."
      },
      {
        title: "Volatilite vs liquidite",
        text: "Volatilite forte sans liquidite suffisante = execution mauvaise.\n\nVous cherchez un equilibre :\n• volatilite exploitable\n• spread correct\n• slippage acceptable."
      },
      {
        title: "Planning hebdomadaire",
        text: "Planifiez vos sessions :\n\n• jours de publication macro majeure -> prudence\n• jours plus calmes -> execution selective\n• bilan de fin de semaine -> revue des stats.\n\nLe timing fait partie de la strategie, pas un detail."
      }
    ]
  },
  {
    id: 'm13',
    title: 'Module 13 : Bibliotheque de Setups',
    description: 'Normaliser 3 setups repetables : breakout, retest, retour de range.',
    level: 'INTERMEDIATE',
    durationMinutes: 10,
    icon: <Crosshair />,
    content: [
      {
        title: "Setup 1 : Breakout propre",
        text: "Checklist breakout :\n• zone claire\n• volume en hausse\n• cloture au-dessus / en dessous de la zone\n• invalidation nette.\n\nSans confirmation, le breakout devient souvent fakeout."
      },
      {
        title: "Setup 2 : Retest valide",
        text: "Le retest permet souvent une meilleure entree.\n\nElements attends :\n• retour sur zone cassée\n• reaction nette (rejet, impulsion)\n• stop derriere l'invalidation logique."
      },
      {
        title: "Setup 3 : Retour de range",
        text: "Quand le marche revient dans son range, on traite les extremes, pas le milieu.\n\n• achat proche du bas du range\n• vente proche du haut du range\n• invalidation hors range.\n\nObjectif : execution propre, pas prediction heroique."
      }
    ]
  },
  {
    id: 'm14',
    title: 'Module 14 : Exposition et Correlation',
    description: 'Eviter de prendre 3 trades differents qui sont en realite le meme risque.',
    level: 'ADVANCED',
    durationMinutes: 9,
    icon: <Shield />,
    content: [
      {
        title: "Risque cache par correlation",
        text: "Exemple : acheter NAS100, acheter BTC et acheter un panier tech peut exposer au meme facteur risk-on.\n\nVous pensez avoir diversifie, mais vous avez concentre votre risque."
      },
      {
        title: "Budget risque portefeuille",
        text: "Au lieu de raisonner trade par trade uniquement, ajoutez une limite globale :\n\n• risque total simultane max (ex: 2% ou 3%)\n• limite par classe d'actifs\n• limite par theme macro."
      },
      {
        title: "Quand reduire l'exposition",
        text: "Reduire ou neutraliser l'exposition quand :\n\n• correlation forte entre vos positions\n• evenement macro imminent\n• performance recente en baisse + erreurs de process."
      }
    ]
  },
  {
    id: 'm15',
    title: 'Module 15 : Protocole News & Macro',
    description: 'Un cadre clair avant, pendant et apres les annonces majeures.',
    level: 'ADVANCED',
    durationMinutes: 8,
    icon: <Calendar />,
    content: [
      {
        title: "Avant la news",
        text: "Checklist pre-news :\n• identifier l'heure exacte\n• verifier les positions ouvertes\n• reduire la taille ou sortir partiellement\n• definir scenario A / B."
      },
      {
        title: "Pendant la news",
        text: "Regle defensive : ne pas confondre vitesse et opportunite.\n\nPendant les annonces, spread et slippage explosent souvent. Vous pouvez rater un trade, mais vous ne devez pas casser votre gestion du risque."
      },
      {
        title: "Apres la news",
        text: "Attendre la stabilisation :\n\n• premiere impulsion\n• retest\n• confirmation structurelle.\n\nVotre edge est souvent apres le chaos initial, pas au milieu."
      }
    ]
  },
  {
    id: 'm16',
    title: 'Module 16 : Gestion Active de Position',
    description: 'Savoir gerer un trade vivant : reduction, break-even et sortie partielle.',
    level: 'ADVANCED',
    durationMinutes: 9,
    icon: <Target />,
    content: [
      {
        title: "Sorties partielles",
        text: "Sortir en plusieurs etapes permet de securiser sans couper tout le potentiel.\n\nExemple :\n• 50% a TP1\n• 30% a TP2\n• 20% laisse courir selon structure."
      },
      {
        title: "Passage au break-even",
        text: "Passer le stop a break-even trop vite peut vous sortir d'un bon trade.\n\nFaites-le apres un vrai signal de validation (ex: structure cassée + retest), pas juste parce que vous avez peur."
      },
      {
        title: "Invalidation dynamique",
        text: "Une position doit etre fermee si la logique initiale disparait.\n\nVous ne gerez pas un trade en esperant. Vous gerez un scenario qui doit rester valide."
      }
    ]
  },
  {
    id: 'm17',
    title: 'Module 17 : Revue de Performance',
    description: 'Analyser vos resultats comme un systeme, pas comme une suite d emotions.',
    level: 'ADVANCED',
    durationMinutes: 8,
    icon: <Database />,
    content: [
      {
        title: "KPIs a suivre",
        text: "Mesures minimales :\n• winrate\n• R moyen\n• drawdown max\n• gain/perte moyen\n• respect du plan (%).\n\nSans KPIs, vous n'optimisez rien."
      },
      {
        title: "Audit mensuel",
        text: "Chaque mois, classez vos trades :\n\n• setups rentables\n• setups neutres\n• setups destructeurs.\n\nLe but est de supprimer ce qui detruit et renforcer ce qui marche."
      },
      {
        title: "Plan d'amelioration",
        text: "Transformez l'analyse en actions :\n\n• 1 comportement a corriger\n• 1 regle a renforcer\n• 1 setup a prioriser pour le mois suivant.\n\nUne petite iteration propre vaut mieux qu'une refonte emotionnelle."
      }
    ]
  },
  {
    id: 'm18',
    title: 'Module 18 : Hygiene, Broker et Arnaques',
    description: 'Proteger votre capital contre les erreurs hors-marche : fraude, levier abusif, promesses trompeuses.',
    level: 'ADVANCED',
    durationMinutes: 7,
    icon: <AlertTriangle />,
    content: [
      {
        title: "Verifier son broker/exchange",
        text: "Controle minimum :\n• reputation et anciennete\n• structure de frais claire\n• execution testee sur petit volume\n• support client reactif.\n\nN'envoyez pas un gros capital sans phase de test."
      },
      {
        title: "Red flags classiques",
        text: "Signaux de risque :\n• promesse de rendement garanti\n• pression pour deposer vite\n• absence de transparence sur les frais\n• influenceur qui montre uniquement des gains."
      },
      {
        title: "Regles de protection",
        text: "Regles simples :\n• capital segmente (pas tout au meme endroit)\n• 2FA active partout\n• mot de passe unique par plateforme\n• retraits testes regulierement.\n\nLa securite operationnelle fait partie de la performance."
      }
    ]
  }
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: "Que signifie 'Short' un actif ?", options: ["L'acheter pour le long terme", "Parier sur sa baisse", "Le prêter à quelqu'un", "Acheter une petite quantité"], correctAnswer: 1, explanation: "Shorter signifie vendre à découvert pour profiter d'une baisse des prix." },
  { id: 2, question: "Si j'utilise un levier x10 et que le marché baisse de 10% contre moi, que se passe-t-il ?", options: ["Je perds 10% de ma mise", "Je perds 50% de ma mise", "Je perds 100% de ma mise (Liquidation)", "Rien tant que je ne vends pas"], correctAnswer: 2, explanation: "Levier 10 x Mouvement 10% = 100% d'impact sur le capital." },
  { id: 3, question: "Qu'est-ce un Stop Loss ?", options: ["Un ordre pour prendre ses profits", "Un ordre automatique pour limiter ses pertes", "L'arrêt du trading pour la journée", "Une perte de connexion internet"], correctAnswer: 1, explanation: "C'est votre sécurité pour ne jamais perdre plus que prévu." },
  { id: 4, question: "Que représente la mèche haute d'une bougie ?", options: ["Le prix d'ouverture", "Le plus bas de la séance", "Le plus haut atteint durant la séance", "Le volume des échanges"], correctAnswer: 2, explanation: "La mèche haute indique le point le plus haut atteint avant que le prix ne redescende." },
  { id: 5, question: "Quel est un bon ratio Risque/Récompense (R:R) ?", options: ["Risquer 100 pour gagner 10", "Risquer 100 pour gagner 100", "Risquer 100 pour gagner 300", "Risquer tout pour gagner tout"], correctAnswer: 2, explanation: "Risquer 1 pour gagner 3 permet d'être rentable même avec un taux de réussite de 30-40%." },
  { id: 6, question: "C'est quoi le FOMO ?", options: ["Fear Of Missing Out (Peur de rater l'occasion)", "Full On Market Orders", "Fear Of Market Opening", "Future Option Market Operation"], correctAnswer: 0, explanation: "Le FOMO est l'ennemi émotionnel qui vous fait acheter au plus haut." },
  { id: 7, question: "Dans une tendance haussière (Bullish), on cherche à...", options: ["Acheter les creux (Dips)", "Vendre les sommets", "Shorter chaque bougie verte", "Rester en cash"], correctAnswer: 0, explanation: "Trend is your friend. On achète les replis dans une tendance haussière." },
  { id: 8, question: "Qu'est-ce qu'un 'Support' ?", options: ["Le service client du broker", "Un niveau de prix où les acheteurs défendent le cours", "Un indicateur technique complexe", "La moyenne des prix"], correctAnswer: 1, explanation: "C'est un plancher technique où le prix a tendance à rebondir." },
  { id: 9, question: "Le Revenge Trading c'est...", options: ["Trader contre une autre personne", "Essayer de refaire immédiatement ses pertes après un échec", "Attaquer le marché en justice", "Trader uniquement le soir"], correctAnswer: 1, explanation: "C'est une réaction émotionnelle destructrice pour récupérer ses pertes rapidement." },
  { id: 10, question: "Que signifie DYOR ?", options: ["Do Your Own Research", "Daily Yield On Return", "Double Your Own Risk", "Direct Yield Over Rate"], correctAnswer: 0, explanation: "Faites vos propres recherches. Ne suivez pas aveuglément les autres." },
  { id: 11, question: "Si le RSI est au-dessus de 70, l'actif est généralement considéré comme...", options: ["Survendu", "Suracheté", "Stable", "En faillite"], correctAnswer: 1, explanation: "Un RSI élevé indique une possible surchauffe à l'achat." },
  { id: 12, question: "Quel capital devriez-vous investir en trading ?", options: ["Vos économies de retraite", "L'argent du loyer", "Uniquement ce que vous pouvez vous permettre de perdre", "Un emprunt bancaire"], correctAnswer: 2, explanation: "Règle d'or absolue pour survivre psychologiquement et financièrement." },
  { id: 13, question: "Un 'Doji' est une bougie qui indique...", options: ["Une forte hausse", "Une forte baisse", "Une indécision du marché", "La fermeture du marché"], correctAnswer: 2, explanation: "Un Doji a un corps très petit, montrant un équilibre entre acheteurs et vendeurs." },
  { id: 14, question: "Le 'Bid' correspond au prix...", options: ["Auquel les vendeurs sont prêts à vendre", "Auquel les acheteurs sont prêts à acheter", "De la dernière transaction", "Moyen de la journée"], correctAnswer: 1, explanation: "Bid = Offre d'achat. Ask = Demande de vente." },
  { id: 15, question: "Pourquoi tenir un journal de trading ?", options: ["Pour le montrer aux impôts", "Pour analyser ses erreurs et progresser", "Pour se vanter sur Twitter", "C'est inutile"], correctAnswer: 1, explanation: "On ne peut pas améliorer ce qu'on ne mesure pas." },
  { id: 16, question: "Quelle est la difference principale entre Spot et Futures ?", options: ["Aucune difference", "Le Spot utilise toujours du levier", "Les Futures sont des contrats derives pouvant inclure du levier", "Le Spot est reserve aux professionnels"], correctAnswer: 2, explanation: "Le futures introduit une logique de contrat, de marge et parfois de liquidation." },
  { id: 17, question: "Le slippage correspond a...", options: ["Une taxe fixe du broker", "L'ecart entre le prix voulu et le prix d'execution", "Une panne internet", "Le volume total de la bougie"], correctAnswer: 1, explanation: "Le slippage augmente surtout quand la liquidite est faible ou le mouvement tres rapide." },
  { id: 18, question: "Que faut-il faire si une annonce FOMC est proche ?", options: ["Augmenter son levier", "Ignorer la news si le setup est beau", "Tenir compte de l'evenement avant de trader", "Toujours shorter"], correctAnswer: 2, explanation: "Une annonce macro majeure peut invalider un setup technique en quelques secondes." },
  { id: 19, question: "Qu'est-ce qu'une confluence ?", options: ["Un bug graphique", "Plusieurs elements qui renforcent la meme idee de trade", "Un ordre stop", "Le point haut du jour"], correctAnswer: 1, explanation: "Une confluence rend un setup plus robuste qu'un simple signal isole." },
  { id: 20, question: "Si vous avez deja pris deux pertes emotionnelles dans la journee, la meilleure option est...", options: ["Doubler la taille", "Chercher un trade de revanche", "Faire une pause et couper la journee", "Passer en levier x20"], correctAnswer: 2, explanation: "La preservation mentale fait partie de la gestion du risque." }
];

const AppleIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.05-.62.33-1.44.5-2.29.11-.08-.03-2.9-1.28-3.96-6.1-.53-2.43.08-4.62 1.54-6.1.92-.93 2.11-1.32 3.06-1.32.96 0 1.87.35 2.45.69.54.32 1.15.34 1.72-.03.62-.4 1.76-1.15 3.31-.83.65.14 2.22.68 3.12 1.98-.06.05-1.92 1.11-1.92 3.3s1.5 3.51 1.95 3.73c-.15.8-.84 2.76-1.88 3.84-.48.51-1.03.95-1.54 1.15zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.33-3.74 4.25z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.063 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-2 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2.1H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.7l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.3H3.1v2.5C4.8 19.5 8.1 22 12 22z" />
    <path fill="#4A90E2" d="M6.3 13.5C6.1 12.9 6 12.5 6 12s.1-.9.3-1.5V8H3.1C2.4 9.2 2 10.5 2 12s.4 2.8 1.1 4l3.2-2.5z" />
    <path fill="#FBBC05" d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 3.2 14.8 2 12 2 8.1 2 4.8 4.5 3.1 8l3.2 2.5C7.1 8 9.3 6.2 12 6.2z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.62.77-1.62 1.56V12h2.76l-.44 2.89h-2.32v6.99A10 10 0 0 0 22 12z" />
  </svg>
);

const TwitterXLogo = ({ size = 16, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// --- TICKER COMPONENTS ---

const CLIENT_FALLBACK_TICKER_SNAPSHOT: MarketTickerSnapshot = {
  mode: 'fallback',
  sources: {
    stocks: 'client_fallback',
    crypto: 'client_fallback'
  },
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 68420, changePercent: 1.24 },
    { symbol: 'ETH', name: 'Ethereum', price: 3522, changePercent: 0.91 },
    { symbol: 'SOL', name: 'Solana', price: 148.3, changePercent: -0.41 },
    { symbol: 'XRP', name: 'XRP', price: 0.67, changePercent: 0.66 }
  ],
  stocks: [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 544.21, changePercent: 0.38 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 472.13, changePercent: 0.44 },
    { symbol: 'AAPL', name: 'Apple', price: 214.38, changePercent: 1.01 },
    { symbol: 'MSFT', name: 'Microsoft', price: 468.22, changePercent: 0.94 }
  ],
  updatedAt: new Date().toISOString()
};

const CLIENT_FALLBACK_FEED_ITEMS: Array<{ id: string; source: string; title: string; publishedAt: string }> = [
  {
    id: 'client-fallback-bloomberg',
    source: 'Bloomberg',
    title: 'Les desks surveillent un dollar plus fragile avant les prochaines statistiques macro',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-fallback-bfm',
    source: 'BFM Business',
    title: 'Les marches europeens temporisent avant les annonces de banques centrales',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-fallback-lesechos',
    source: 'Les Echos',
    title: 'Inflation, taux et actions : les niveaux a surveiller cette semaine',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

const MarketMarquee: React.FC = () => {
  const [snapshot, setSnapshot] = useState<MarketTickerSnapshot>(CLIENT_FALLBACK_TICKER_SNAPSHOT);

  useEffect(() => {
    let isMounted = true;

    const loadTicker = async () => {
      try {
        const response = await apiFetch('/api/market-ticker');
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;
        if (Array.isArray(data?.crypto) && Array.isArray(data?.stocks)) {
          setSnapshot({
            mode: data.mode === 'live' || data.mode === 'partial' ? data.mode : 'fallback',
            sources: data.sources || {},
            crypto: data.crypto.length ? data.crypto : CLIENT_FALLBACK_TICKER_SNAPSHOT.crypto,
            stocks: data.stocks.length ? data.stocks : CLIENT_FALLBACK_TICKER_SNAPSHOT.stocks,
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        }
      } catch {
        if (!isMounted) return;
        setSnapshot((prev) => ({
          ...prev,
          mode: 'fallback',
          updatedAt: new Date().toISOString()
        }));
      }
    };

    loadTicker();
    const interval = window.setInterval(loadTicker, 60000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const cryptoData = snapshot.crypto || [];
  const stockData = snapshot.stocks || [];
  const rowLabel = snapshot.mode === 'live' ? 'LIVE' : snapshot.mode === 'partial' ? 'HYBRIDE' : 'FALLBACK';
  const rowLabelClass = snapshot.mode === 'live'
    ? 'text-green-400 border-green-500/30 bg-green-500/10'
    : snapshot.mode === 'partial'
      ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div className="w-full bg-black border-y border-gray-800 font-mono text-xs overflow-hidden">
      <div className="px-3 py-1.5 border-b border-gray-900 bg-[#080808] flex items-center justify-between gap-2">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${rowLabelClass}`}>
          Ticker {rowLabel}
        </span>
        <span className="text-[10px] text-gray-500">
          Maj {snapshot.updatedAt ? new Date(snapshot.updatedAt).toLocaleTimeString('fr-FR') : '--:--'}
        </span>
      </div>

      <div className="flex whitespace-nowrap py-2 border-b border-gray-900 bg-[#0a0a0a]">
         <div className="flex animate-marquee">
           {cryptoData.map((c, i) => {
             const isUp = Number(c.changePercent) >= 0;
             return (
             <span key={`c1-${i}`} className="mx-6 flex items-center gap-2">
               <span className="font-bold text-gray-300">{c.symbol}</span>
               <span className={isUp ? 'text-green-500' : 'text-red-500'}>
                {formatMoney(c.price)} ({isUp ? '+' : ''}{Number(c.changePercent).toFixed(2)}%)
               </span>
             </span>
           )})}
           {cryptoData.map((c, i) => {
             const isUp = Number(c.changePercent) >= 0;
             return (
             <span key={`c2-${i}`} className="mx-6 flex items-center gap-2">
               <span className="font-bold text-gray-300">{c.symbol}</span>
               <span className={isUp ? 'text-green-500' : 'text-red-500'}>
                {formatMoney(c.price)} ({isUp ? '+' : ''}{Number(c.changePercent).toFixed(2)}%)
               </span>
             </span>
           )})}
         </div>
      </div>

      <div className="flex whitespace-nowrap py-2 bg-black">
         <div className="flex animate-marquee" style={{ animationDuration: '40s' }}>
           {stockData.map((s, i) => {
             const isUp = Number(s.changePercent) >= 0;
             return (
             <span key={`s1-${i}`} className="mx-6 flex items-center gap-2">
               <span className="font-bold text-gray-400">{s.symbol}</span>
               <span className={isUp ? 'text-blue-400' : 'text-red-400'}>
                {formatMoney(s.price)} ({isUp ? '+' : ''}{Number(s.changePercent).toFixed(2)}%)
               </span>
             </span>
           )})}
           {stockData.map((s, i) => {
             const isUp = Number(s.changePercent) >= 0;
             return (
             <span key={`s2-${i}`} className="mx-6 flex items-center gap-2">
               <span className="font-bold text-gray-400">{s.symbol}</span>
               <span className={isUp ? 'text-blue-400' : 'text-red-400'}>
                {formatMoney(s.price)} ({isUp ? '+' : ''}{Number(s.changePercent).toFixed(2)}%)
               </span>
             </span>
           )})}
         </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

const InsiderFeed: React.FC = () => {
  const [items, setItems] = useState<Array<{ id: string; source: string; title: string; publishedAt: string }>>(CLIENT_FALLBACK_FEED_ITEMS);
  const [mode, setMode] = useState<'live' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await apiFetch('/api/news-feed');
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;
        const nextItems = Array.isArray(data?.items)
          ? data.items.slice(0, 12).map((item: any, index: number) => ({
              id: String(item?.id || `rss-${index}`),
              source: String(item?.source || 'Flux'),
              title: String(item?.title || 'Titre indisponible'),
              publishedAt: String(item?.publishedAt || new Date().toISOString())
            }))
          : [];
        setItems(nextItems.length ? nextItems : CLIENT_FALLBACK_FEED_ITEMS);
        setMode(data?.mode === 'live' ? 'live' : 'fallback');
      } catch {
        if (!isMounted) return;
        setMode('fallback');
        setItems(CLIENT_FALLBACK_FEED_ITEMS);
      }
    };
    load();
    const interval = window.setInterval(load, 120000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-[#1a0505] border-y border-red-900/50 mb-6 relative overflow-hidden h-10 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 bg-red-600 px-3 flex items-center z-10 font-bold text-white text-xs tracking-wider">
        <Zap size={14} className="mr-1 animate-pulse" /> ACTU FEED
      </div>
      <div className="flex whitespace-nowrap animate-marquee items-center pl-32">
        {items.length > 0 ? items.map((item, i) => (
          <span key={i} className="mx-8 flex items-center text-sm">
             <span className="text-gray-500 font-mono text-xs mr-2">[{formatRelativeTime(item.publishedAt)}]</span>
             <span className="font-bold mr-2 text-primary">{item.source}:</span>
             <span className="text-gray-300">{item.title}</span>
             {mode !== 'live' && <span className="ml-2 text-[10px] bg-yellow-600/80 text-white px-1 rounded">FALLBACK</span>}
          </span>
        )) : (
          <span className="text-gray-500 italic mx-4">Initialisation du flux actualites...</span>
        )}
      </div>
    </div>
  );
};

// --- ACADEMY VISUALS (SVG) ---

const CandleDiagram = () => (
  <svg viewBox="0 0 200 150" className="w-full h-auto bg-black/30 rounded border border-gray-700">
    <line x1="60" y1="20" x2="60" y2="130" stroke="gray" strokeWidth="2" />
    <rect x="40" y="40" width="40" height="80" fill="#22c55e" rx="2" />
    <text x="60" y="145" textAnchor="middle" fill="gray" fontSize="10">Bougie Verte</text>
    <text x="90" y="45" fill="#22c55e" fontSize="10">Close</text>
    <text x="90" y="115" fill="#22c55e" fontSize="10">Open</text>

    <line x1="140" y1="20" x2="140" y2="130" stroke="gray" strokeWidth="2" />
    <rect x="120" y="50" width="40" height="60" fill="#ef4444" rx="2" />
    <text x="140" y="145" textAnchor="middle" fill="gray" fontSize="10">Bougie Rouge</text>
    <text x="170" y="55" fill="#ef4444" fontSize="10">Open</text>
    <text x="170" y="105" fill="#ef4444" fontSize="10">Close</text>
  </svg>
);

const TrendDiagram = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto bg-black/30 rounded border border-gray-700">
    <path d="M10 80 L50 40 L80 60 L140 20 L160 30 L190 10" fill="none" stroke="#00ff9d" strokeWidth="2" />
    <line x1="10" y1="90" x2="190" y2="20" stroke="gray" strokeDasharray="4" strokeWidth="1" opacity="0.5" />
    <text x="100" y="90" textAnchor="middle" fill="gray" fontSize="10">Tendance Haussière (Bullish)</text>
    <circle cx="50" cy="40" r="3" fill="#00ff9d" />
    <circle cx="140" cy="20" r="3" fill="#00ff9d" />
    <text x="50" y="30" textAnchor="middle" fill="white" fontSize="8">Higher High</text>
  </svg>
);

const RiskDiagram = () => (
  <svg viewBox="0 0 200 60" className="w-full h-auto bg-black/30 rounded border border-gray-700">
    <rect x="10" y="20" width="50" height="20" fill="#ef4444" />
    <rect x="65" y="20" width="125" height="20" fill="#22c55e" />
    <text x="35" y="55" textAnchor="middle" fill="#ef4444" fontSize="10">Risque 1</text>
    <text x="127" y="55" textAnchor="middle" fill="#22c55e" fontSize="10">Gain Potentiel 2.5</text>
    <line x1="60" y1="10" x2="60" y2="50" stroke="white" strokeWidth="2" />
    <text x="60" y="15" textAnchor="middle" fill="white" fontSize="10">Entrée</text>
  </svg>
);

// --- ACADEMY COMPONENT ---

const TradingAcademy: React.FC<{ onPassedQuiz?: () => void }> = ({ onPassedQuiz }) => {
  const [academyView, setAcademyView] = useState<'MODULES' | 'GLOSSARY' | 'QUIZ'>('MODULES');
  const [activeLevel, setActiveLevel] = useState<AcademyLevel>('BEGINNER');
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [glossarySearch, setGlossarySearch] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACADEMY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.completedModules)) {
        setCompletedModules(parsed.completedModules);
      }
    } catch {
      // Ignore invalid local data and keep defaults.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify({ completedModules }));
  }, [completedModules]);

  const completeModule = (moduleId: string) => {
    setCompletedModules((prev) => prev.includes(moduleId) ? prev : [...prev, moduleId]);
  };

  const levelLabel = (level: AcademyLevel) => {
    switch (level) {
      case 'BEGINNER':
        return 'Debutant';
      case 'INTERMEDIATE':
        return 'Intermediaire';
      case 'ADVANCED':
        return 'Avance';
      default:
        return level;
    }
  };

  const levelTone = (level: AcademyLevel) => {
    switch (level) {
      case 'BEGINNER':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'INTERMEDIATE':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'ADVANCED':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const modulesForLevel = COURSE_MODULES.filter((module) => (module.level || 'BEGINNER') === activeLevel);
  const completedCount = completedModules.length;
  const academyProgress = Math.round((completedCount / COURSE_MODULES.length) * 100);
  const levelCompletedCount = modulesForLevel.filter((module) => completedModules.includes(module.id)).length;
  const levelProgress = modulesForLevel.length ? Math.round((levelCompletedCount / modulesForLevel.length) * 100) : 0;
  const filteredGlossary = GLOSSARY_TERMS.filter((item) => {
    const query = glossarySearch.trim().toLowerCase();
    if (!query) return true;
    return item.term.toLowerCase().includes(query) || item.definition.toLowerCase().includes(query);
  });

  const handleNextSlide = () => {
    if (activeModule && currentSlide < activeModule.content.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (activeModule) completeModule(activeModule.id);
      setActiveModule(null);
      setCurrentSlide(0);
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === QUIZ_QUESTIONS[currentQuestion].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setQuizScore(0);
    setCurrentQuestion(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuizStarted(false);
    setAcademyView('MODULES');
  };

  const handleResultAction = () => {
    const percentage = Math.round((quizScore / QUIZ_QUESTIONS.length) * 100);
    const passed = percentage >= 80;
    if (passed && onPassedQuiz) {
      onPassedQuiz();
      return;
    }
    restartQuiz();
  };

  // -- VIEWS --

  // 1. Module List
  if (!activeModule && !quizStarted) {
    if (academyView === 'GLOSSARY') {
      return (
        <div className="p-6 max-w-5xl mx-auto animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button onClick={() => setAcademyView('MODULES')} className="px-4 py-2 rounded border border-gray-700 text-gray-300 hover:text-white">
              Retour aux modules
            </button>
            <div className="px-4 py-2 rounded border border-primary/30 bg-primary/10 text-primary font-bold">
              Glossaire Trading
            </div>
          </div>

          <div className="bg-surface border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-3xl font-bold mb-2">Glossaire</h2>
            <p className="text-gray-400 mb-4">Les termes a comprendre avant de lire une analyse ou de prendre un trade.</p>
            <input
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Rechercher un terme: stop loss, breakout, VWAP..."
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredGlossary.map((item) => (
              <div key={item.term} className="bg-black border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-2">{item.term}</h3>
                <p className="text-sm text-gray-400">{item.definition}</p>
              </div>
            ))}
            {filteredGlossary.length === 0 && (
              <div className="bg-black border border-gray-800 rounded-xl p-5 text-gray-500">
                Aucun terme ne correspond a votre recherche.
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Black Academy</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Une mini-academie structuree pour comprendre le jargon, construire un process et eviter les erreurs de debutant.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6 mb-8">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-white">Progression</h3>
              <span className="text-sm font-mono text-primary">{completedCount}/{COURSE_MODULES.length} modules</span>
            </div>
            <div className="h-3 bg-black rounded-full overflow-hidden border border-gray-800 mb-2">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${academyProgress}%` }} />
            </div>
            <p className="text-sm text-gray-400 mb-6">{academyProgress}% du parcours total termine.</p>

            <div className="grid grid-cols-3 gap-2">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as AcademyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`min-w-0 rounded-lg border px-3 py-3 text-left transition-colors ${activeLevel === level ? levelTone(level) : 'border-gray-800 bg-black text-gray-400 hover:text-white'}`}
                >
                  <div className="text-[11px] sm:text-xs font-bold leading-tight">{levelLabel(level)}</div>
                  <div className="text-[10px] mt-1 leading-tight text-gray-400">
                    {COURSE_MODULES.filter((module) => (module.level || 'BEGINNER') === level).length} modules
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="text-primary" />
              <h3 className="text-xl font-bold text-white">Raccourcis utiles</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Passe du parcours aux outils annexes sans quitter l'academie.</p>
            <div className="space-y-3">
              <button onClick={() => setAcademyView('GLOSSARY')} className="w-full bg-black border border-gray-800 text-white font-bold py-3 rounded hover:border-primary/40">
                Ouvrir le glossaire
              </button>
              <button
                onClick={() => {
                  setAcademyView('QUIZ');
                  setQuizStarted(true);
                }}
                className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200"
              >
                Lancer l'examen final ({QUIZ_QUESTIONS.length} QCM)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h3 className="text-xl font-bold text-white">Niveau {levelLabel(activeLevel)}</h3>
            <span className="text-xs font-mono text-gray-400">{levelProgress}% termine</span>
          </div>
          <div className="h-2 bg-[#111] rounded-full overflow-hidden border border-gray-800">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {modulesForLevel.map((module) => (
            <div key={module.id} 
                 onClick={() => {
                   setAcademyView('MODULES');
                   setActiveModule(module);
                 }}
                 className="bg-surface border border-gray-800 p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer group hover:bg-surface/80">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gray-800 p-3 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  {module.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded border ${levelTone(module.level || 'BEGINNER')}`}>
                    {levelLabel(module.level || 'BEGINNER')}
                  </span>
                  <span className="text-xs font-mono text-gray-500 bg-black px-2 py-1 rounded">{module.durationMinutes || 5} min</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-white text-gray-200">{module.title}</h3>
              <p className="text-sm text-gray-400">{module.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Commencer <ArrowRight size={16} className="ml-2" />
                </div>
                {completedModules.includes(module.id) && (
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                    Termine
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <Scale className="text-yellow-500" /> Examen Final
          </h3>
          <p className="text-gray-400 mb-6">
            Prouvez que vous n'etes pas un "gambler". Le quiz reprend le jargon, la technique, le risque et la psychologie.
            Score requis : 80%.
          </p>
          <button 
            onClick={() => {
              setAcademyView('QUIZ');
              setQuizStarted(true);
            }}
            className="bg-white text-black font-bold py-3 px-8 rounded hover:bg-gray-200 transition-colors w-full md:w-auto"
          >
            LANCER LE TEST ({QUIZ_QUESTIONS.length} QCM)
          </button>
        </div>
      </div>
    );
  }

  // 2. Quiz View
  if (quizStarted) {
    if (showResult) {
      const percentage = Math.round((quizScore / QUIZ_QUESTIONS.length) * 100);
      const passed = percentage >= 80;

      return (
        <div className="p-8 max-w-2xl mx-auto text-center animate-fade-in h-full flex flex-col justify-center">
          <div className="mb-8">
            {passed ? <Award className="w-24 h-24 text-yellow-500 mx-auto mb-4" /> : <Frown className="w-24 h-24 text-red-500 mx-auto mb-4" />}
            <h2 className="text-4xl font-bold mb-2">{passed ? 'Félicitations !' : 'Oups...'}</h2>
            <p className="text-xl text-gray-400">Score Final: <span className={passed ? 'text-green-500' : 'text-red-500'}>{percentage}%</span> ({quizScore}/{QUIZ_QUESTIONS.length})</p>
          </div>
          
          <div className="bg-surface border border-gray-800 p-6 rounded-xl mb-8">
            <p className="text-gray-300 italic">
              {passed 
                ? "Vous avez les bases solides pour comprendre mes analyses. Vous n'êtes plus un touriste, vous êtes un étudiant des marchés." 
                : "Le marché ne pardonne pas l'ignorance. Révisez les modules et réessayez avant de risquer votre capital."}
            </p>
          </div>

          <button onClick={handleResultAction} className="bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
            {passed ? (onPassedQuiz ? 'Terminer la Formation' : 'Retour à l\'Academy') : 'Réessayer le Quiz'}
          </button>
        </div>
      );
    }

    const q = QUIZ_QUESTIONS[currentQuestion];

    return (
      <div className="p-6 max-w-2xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8 text-sm text-gray-500 font-mono">
          <span>Question {currentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
          <button onClick={() => { setQuizStarted(false); setAcademyView('MODULES'); }} className="hover:text-white"><X size={20}/></button>
        </div>

        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">{q.question}</h3>
          
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={`w-full p-4 rounded text-left border transition-all ${
                  isAnswered 
                    ? idx === q.correctAnswer 
                      ? 'bg-green-500/20 border-green-500 text-green-500'
                      : idx === selectedAnswer 
                        ? 'bg-red-500/20 border-red-500 text-red-500'
                        : 'border-gray-800 text-gray-500'
                    : 'border-gray-700 hover:bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {isAnswered && idx === q.correctAnswer && <Check size={20} />}
                  {isAnswered && idx === selectedAnswer && idx !== q.correctAnswer && <X size={20} />}
                </div>
              </button>
            ))}
          </div>

          {isAnswered && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded animate-fade-in">
              <div className="flex items-start gap-3">
                <Lightbulb className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-sm text-gray-300">{q.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {isAnswered && (
          <button 
            onClick={nextQuestion}
            className="w-full mt-8 bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Question Suivante' : 'Voir les Résultats'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    );
  }

  // 3. Slide View (Module Content)
  const slide = activeModule.content[currentSlide];
  
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 w-full">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${((currentSlide + 1) / activeModule.content.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full justify-center">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
            {activeModule.title} • {currentSlide + 1}/{activeModule.content.length}
          </span>
          <button onClick={() => setActiveModule(null)} className="text-gray-500 hover:text-white"><X /></button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[10px] px-2 py-1 rounded border ${levelTone(activeModule.level || 'BEGINNER')}`}>
            {levelLabel(activeModule.level || 'BEGINNER')}
          </span>
          <span className="text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-400">
            {activeModule.durationMinutes || 5} min
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">{slide.title}</h2>
        
        <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap mb-8">
          {slide.text}
        </div>

        {/* Visual Diagrams */}
        {slide.diagram === 'CANDLES' && <div className="mb-8 w-full max-w-sm mx-auto"><CandleDiagram /></div>}
        {slide.diagram === 'TREND' && <div className="mb-8 w-full max-w-sm mx-auto"><TrendDiagram /></div>}
        {slide.diagram === 'RISK' && <div className="mb-8 w-full max-w-sm mx-auto"><RiskDiagram /></div>}

        <div className="mt-auto">
          <button 
            onClick={handleNextSlide}
            className="w-full bg-primary text-black font-bold py-4 rounded text-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            {currentSlide === activeModule.content.length - 1 ? 'Terminer le Module' : 'Suivant'} <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simplified Frown icon for quiz result
const Frown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
);

const TwitterFeed: React.FC = () => {
  const [snapshot, setSnapshot] = useState<XFeedSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const parseJsonSafe = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await apiFetch('/api/social/x-feed');
        const data = await parseJsonSafe(response);
        if (!isMounted) return;
        if (!response.ok || !data) {
          setLoadError(`API X indisponible (${response.status}).`);
          return;
        }
        setSnapshot({
          mode: String(data?.mode || 'curated_manual'),
          updatedAt: String(data?.updatedAt || new Date().toISOString()),
          note: typeof data?.note === 'string' ? data.note : undefined,
          accounts: Array.isArray(data?.accounts) ? data.accounts : []
        });
      } catch {
        if (!isMounted) return;
        setLoadError('Impossible de charger la veille X. Verifiez VITE_API_BASE_URL et CORS_ORIGIN sur Render.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    const interval = window.setInterval(load, 300000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#050505]">
         <div className="flex items-center gap-2 font-bold text-white">
           <TwitterXLogo size={20} />
           <span>Veille X (Bourse/Crypto)</span>
         </div>
         <span className="text-xs text-gray-500">
           {loadError ? 'API indisponible' : snapshot?.mode === 'curated_manual' ? 'Curation manuelle' : snapshot?.mode || 'Mode inconnu'}
         </span>
      </div>
      <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
         {(snapshot?.accounts || []).map((account) => (
           <a
             key={account.id}
             href={account.url}
             target="_blank"
             rel="noopener noreferrer"
             className="block p-4 hover:bg-white/5 transition-colors"
           >
              <div className="flex items-start justify-between gap-3">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{account.name}</span>
                      <span className="text-gray-500 text-sm">@{account.handle}</span>
                    </div>
                    <p className="text-xs text-gray-400">{account.focus || 'Marches financiers'}</p>
                 </div>
                 <ExternalLink size={14} className="text-gray-600 mt-1" />
              </div>
           </a>
         ))}
         {loading && (
          <div className="p-4 text-sm text-gray-500">Chargement...</div>
         )}
         {!loading && !loadError && (!snapshot || snapshot.accounts.length === 0) && (
          <div className="p-4 text-sm text-gray-500">Aucun compte X configure pour le moment.</div>
         )}
         {!loading && loadError && (
          <div className="p-4 text-sm text-red-300/90">{loadError}</div>
         )}
      </div>
      <div className="p-3 text-[11px] text-gray-500 border-t border-gray-800 bg-[#070707]">
        {loadError
          ? 'Le flux X ne repond pas sur cet environnement. Controlez les variables Render frontend/backend.'
          : snapshot?.note || 'Mode curation: ouverture vers les comptes X. Le flux API X officiel n est pas active sur cet environnement.'}
      </div>
    </div>
  );
};

const RSSFeedWidget: React.FC = () => {
  const [news, setNews] = useState<ExternalRSSNews[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchExternalRSS().then(setNews);
  }, []);

  const isFallback = news.length > 0 && news.every((item) => item.url === '#');
  const visibleNews = showAll ? news : news.slice(0, 5);

  return (
    <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden mb-6">
       <div className="bg-primary/5 border-b border-primary/10 p-4 flex items-center justify-between">
          <h3 className="text-primary font-bold flex items-center gap-2">
             <Radio className="w-4 h-4" /> Flux Boursier (RSS)
          </h3>
          <span className={`text-[10px] px-2 py-1 rounded ${isFallback ? 'bg-yellow-500/20 text-yellow-300' : 'bg-primary/20 text-primary'}`}>
            {isFallback ? 'FALLBACK' : 'LIVE'}
          </span>
       </div>
       <div className="divide-y divide-gray-800">
          {visibleNews.map((item) => (
             <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-white/5 transition-colors group">
                <div className="flex justify-between items-start mb-1">
                   <span className="text-xs text-gray-500 uppercase font-bold">{item.source}</span>
                   <span className="text-xs text-gray-600">{item.timeAgo}</span>
                </div>
                <h4 className="text-sm text-gray-300 font-medium group-hover:text-primary transition-colors line-clamp-2">
                   {item.title}
                </h4>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-600">
                   Lire la suite <ExternalLink size={10} />
                </div>
             </a>
          ))}
       </div>
       {news.length > 5 && (
         <div className="p-4 border-t border-gray-800">
           <button
             onClick={() => setShowAll((prev) => !prev)}
             className="text-xs px-3 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
           >
             {showAll ? 'Afficher moins' : `Afficher la suite (${news.length - 5})`}
           </button>
         </div>
       )}
    </div>
  );
};

// --- COMPONENTS ---

const DisclaimerBanner: React.FC = () => {
  const [visible, setVisible] = useState(true);
  
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-4 border-accent p-4 shadow-2xl animate-fade-in-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Siren className="text-accent w-8 h-8 flex-shrink-0 animate-pulse" />
          <div className="text-xs md:text-sm text-gray-300">
            <strong className="text-white uppercase block mb-1">Avertissement Légal Important</strong>
            Le trading de crypto-monnaies et de produits financiers comporte un niveau de risque élevé et peut ne pas convenir à tous les investisseurs. 
            Le contenu de ce site est fourni à titre <strong>éducatif et de divertissement uniquement</strong>. 
            L'auteur n'est pas conseiller financier. Les performances passées ne garantissent pas les résultats futurs.
          </div>
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="bg-white text-black text-xs font-bold px-6 py-2 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          J'AI COMPRIS & J'ACCEPTE
        </button>
      </div>
    </div>
  );
};

const LiveTicker: React.FC = () => {
  return (
    <div className="bg-primary/10 border-b border-primary/20 overflow-hidden h-8 flex items-center">
      <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-xs font-mono text-primary px-4">
        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Service éducatif: signaux et analyses, pas de conseil financier personnalisé</span>
        <span>•</span>
        <span>Chaque signal inclut: contexte, plan, invalidation et gestion du risque</span>
        <span>•</span>
        <span>Objectif: discipline et exécution, pas promesse de gains rapides</span>
        <span>•</span>
        <span>Annulation possible à tout moment depuis l'espace membre</span>
      </div>
    </div>
  );
};

// --- REVIEW MODAL COMPONENT ---
const ReviewSubmissionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (review: Partial<Review>) => Promise<boolean> }> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [type, setType] = useState<'TEXT' | 'VIDEO'>('TEXT');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !content) return;
    if (type === 'VIDEO' && videoUrl && !isSafeExternalUrl(videoUrl)) {
      alert("Lien vidéo invalide. Utilisez une URL http(s) publique.");
      return;
    }

    setSubmitting(true);
    const ok = await onSubmit({
      author: name,
      rating,
      content,
      analysis,
      type,
      videoUrl: type === 'VIDEO' ? videoUrl : undefined,
      date: 'À l\'instant',
      role: 'USER',
      status: 'PENDING'
    });
    setSubmitting(false);
    if (!ok) return;

    onClose();
    setName('');
    setRating(5);
    setContent('');
    setAnalysis('');
    setVideoUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-surface border border-gray-700 rounded-xl max-w-md w-full p-6 animate-fade-in relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        
        <h2 className="text-xl font-bold mb-6 text-center">Partagez votre expérience</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Votre Pseudo</label>
            <input type="text" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Note</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <Star fill={star <= rating ? "#fbbf24" : "none"} stroke={star <= rating ? "#fbbf24" : "#4b5563"} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 border-b border-gray-700 pb-2">
             <button onClick={() => setType('TEXT')} className={`pb-1 text-sm font-bold flex items-center gap-2 ${type === 'TEXT' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
                <MessageSquare size={16}/> Écrit
             </button>
             <button onClick={() => setType('VIDEO')} className={`pb-1 text-sm font-bold flex items-center gap-2 ${type === 'VIDEO' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
                <Video size={16}/> Vidéo
             </button>
          </div>

          {type === 'VIDEO' && (
             <div>
                <label className="block text-xs text-gray-500 mb-1">Lien de la vidéo (YouTube, Tweet...)</label>
                <input type="text" placeholder="https://..." className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
             </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Votre Message</label>
            <textarea className="w-full bg-black border border-gray-700 rounded p-3 text-white h-24 focus:border-primary focus:outline-none" value={content} onChange={e => setContent(e.target.value)} placeholder="Qu'avez-vous pensé du service ?" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Votre analyse (optionnel)</label>
            <textarea
              className="w-full bg-black border border-gray-700 rounded p-3 text-white h-28 focus:border-primary focus:outline-none"
              value={analysis}
              onChange={e => setAnalysis(e.target.value)}
              placeholder="Ex: qualité des signaux, pédagogie, gestion du risque, points à améliorer..."
            />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-60">
            {submitting ? 'Envoi...' : 'Envoyer (Soumis à modération)'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- REVIEWS PAGE ---
const ReviewsPage: React.FC<{ reviews: Review[]; onOpenSubmit: () => void; canSubmit: boolean }> = ({ reviews, onOpenSubmit, canSubmit }) => {
  // Separate Influencers and regular approved users
  const influencers = reviews.filter(r => r.role === 'INFLUENCER' && r.status === 'APPROVED');
  const users = reviews.filter(r => (r.role === 'USER' || r.role === 'VIP') && r.status === 'APPROVED');

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tighter">
            Le Mur de la <span className="text-primary">Confiance</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Ce que les membres et les professionnels pensent des Black Papers.
            <br/>Transparence totale.
          </p>
          <div className="flex items-center justify-center gap-4">
             <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={24} fill="#fbbf24" stroke="#fbbf24" />)}
             </div>
             <span className="text-2xl font-bold text-white">4.9/5</span>
          </div>
          <button 
            onClick={onOpenSubmit}
            className="mt-8 border border-primary text-primary px-8 py-3 rounded hover:bg-primary hover:text-black font-bold transition-all"
          >
            LAISSER UN AVIS
          </button>
        </div>

        {/* INFLUENCERS SECTION */}
        {influencers.length > 0 && (
          <div className="mb-20">
             <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-yellow-500">
                <Award /> Ils en parlent (Partenaires Élite)
             </h2>
             <div className="grid md:grid-cols-3 gap-6">
                {influencers.map(review => {
                   const safeVideoUrl = review.videoUrl && isSafeExternalUrl(review.videoUrl) ? review.videoUrl : null;
                   return (
                   <div key={review.id} className="bg-gradient-to-b from-[#1a1a1a] to-black border border-yellow-500/30 p-6 rounded-xl relative overflow-hidden group hover:border-yellow-500/60 transition-all">
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1">PARTENAIRE</div>
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-12 h-12 rounded-full bg-yellow-900/20 border border-yellow-500/50 flex items-center justify-center text-yellow-500 font-bold text-lg">
                            {review.author.charAt(0)}
                         </div>
                         <div>
                            <h4 className="font-bold text-white">{review.author}</h4>
                            <p className="text-xs text-yellow-500/70 flex items-center gap-1">
                               {review.platform === 'YouTube' ? <Youtube size={12}/> : <TwitterXLogo size={12}/>}
                               {review.platform}
                            </p>
                         </div>
                      </div>
                      
                      {review.type === 'VIDEO' && safeVideoUrl ? (
                         <div className="relative aspect-video bg-black rounded-lg mb-4 border border-gray-800 overflow-hidden group-hover:border-yellow-500/30 transition-colors cursor-pointer">
                            <img src={safeVideoUrl} alt="Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center pl-1">
                                  <Play fill="black" size={20} className="text-black" />
                               </div>
                            </div>
                         </div>
                      ) : (
                         <div className="mb-4">
                           <p className="text-gray-300 italic text-sm">"{review.content}"</p>
                           {review.analysis && <p className="text-xs text-gray-400 mt-2 border-l border-yellow-500/40 pl-3">{review.analysis}</p>}
                         </div>
                      )}
                      
                      <div className="flex gap-1">
                         {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" stroke="none" />)}
                      </div>
                   </div>
                )})}
             </div>
          </div>
        )}

        {/* COMMUNITY REVIEWS */}
        <div>
           <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-primary">
              <Users /> La Communauté
           </h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(review => (
                 <div key={review.id} className="bg-surface border border-gray-800 p-6 rounded-xl hover:bg-surface/80 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${review.role === 'VIP' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-gray-700'}`}>
                             {review.author.charAt(0)}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-200 text-sm">{review.author}</h4>
                                {review.role === 'VIP' && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20">VIP</span>}
                             </div>
                             <div className="flex gap-0.5 mt-0.5">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="#00ff9d" stroke="none" />)}
                             </div>
                          </div>
                       </div>
                       <span className="text-[10px] text-gray-500">{review.date}</span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                       "{review.content}"
                    </p>
                    {review.analysis && (
                      <div className="bg-black/30 border border-gray-800 rounded p-3 mb-4">
                        <p className="text-[11px] uppercase tracking-wider text-primary mb-1">Analyse</p>
                        <p className="text-sm text-gray-300">{review.analysis}</p>
                      </div>
                    )}

                    {review.pnlProof && (
                       <div className="inline-flex items-center gap-1.5 bg-green-900/20 text-green-500 text-[10px] px-2 py-1 rounded border border-green-900/50">
                          <CheckCircle2 size={10} /> PnL partagee par le membre
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

// --- TWENTY CRM INTEGRATION MODULE ---

const TwentyCRMIntegration: React.FC = () => {
  const [activeObject, setActiveObject] = useState<'PEOPLE' | 'COMPANIES' | 'OPPORTUNITIES' | 'SETTINGS'>('PEOPLE');
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
  const [contacts, setContacts] = useState(MOCK_CRM_DATA);
  const [opportunities, setOpportunities] = useState(MOCK_OPPORTUNITIES);
  const [syncStatus, setSyncStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');
  const [apiKey, setApiKey] = useState('');

  const sendReminder = (id: string) => {
    alert(`Rappel envoyé automatiquement à l'utilisateur ${id}.`);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, notes: 'Rappel auto envoyé le ' + new Date().toLocaleDateString() } : c));
  };

  const renderPeopleView = () => (
    <div className="flex-1 bg-[#0a0a0a] rounded-lg overflow-hidden flex flex-col border border-gray-800">
       {/* Toolbar */}
       <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#111]">
          <div className="flex items-center gap-2 text-sm text-gray-400">
             <Filter size={14} /> Filter
             <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
             <Search size={14} /> Search
          </div>
          <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200">
             <Plus size={14} /> New Person
          </button>
       </div>
       
       {/* Table Header */}
       <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-800 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-[#0f0f0f]">
          <div className="col-span-3 flex items-center gap-2">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Payment</div>
          <div className="col-span-2">Total Spent</div>
          <div className="col-span-1">Action</div>
       </div>

       {/* Rows */}
       <div className="overflow-y-auto flex-1">
         {contacts.map(contact => (
           <div key={contact.id} className="grid grid-cols-12 gap-4 p-3 border-b border-gray-800/50 hover:bg-white/[0.02] text-sm items-center transition-colors cursor-pointer group">
              <div className="col-span-3 flex items-center gap-3">
                 <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${contact.identifier.includes('@') ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                    {contact.identifier.substring(0,2).toUpperCase()}
                 </div>
                 <span className="text-gray-200 group-hover:text-white truncate" title={contact.identifier}>{contact.identifier}</span>
              </div>
              <div className="col-span-2">
                 <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    contact.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    contact.status === 'LEAD' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                 }`}>
                    {contact.status}
                 </span>
              </div>
              <div className="col-span-2 text-gray-400 text-xs">{contact.plan}</div>
              <div className="col-span-2 flex items-center gap-2">
                 {contact.paymentMethod === 'LEMON_SQUEEZY' ? 
                    <CreditCard size={14} className="text-purple-400" /> : 
                    contact.paymentMethod === 'CRYPTO_GATEWAY' ?
                    <Bitcoin size={14} className="text-orange-400" /> : <Minus size={14} className="text-gray-600"/>
                 }
                 <span className={`text-[10px] ${contact.paymentStatus === 'LATE' ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{contact.paymentStatus}</span>
              </div>
              <div className="col-span-2 font-mono text-gray-300">${contact.totalSpent}</div>
              <div className="col-span-1">
                 {contact.paymentMethod === 'CRYPTO_GATEWAY' && contact.paymentStatus === 'LATE' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); sendReminder(contact.id); }}
                      className="bg-red-900/30 text-red-500 p-1.5 rounded hover:bg-red-900/50 flex items-center gap-1 text-[10px]"
                      title="Envoyer Rappel Crypto"
                    >
                       <Send size={12}/> Relance
                    </button>
                 )}
              </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderOpportunitiesBoard = () => {
    const stages = ['NEW', 'CONTACTED', 'NEGOTIATION', 'WON'];
    return (
      <div className="flex-1 overflow-x-auto p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
         <div className="flex gap-4 h-full min-w-[800px]">
            {stages.map(stage => (
              <div key={stage} className="flex-1 flex flex-col min-w-[200px]">
                 <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-xs font-bold text-gray-500">{stage}</span>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 rounded">{opportunities.filter(o => o.stage === stage).length}</span>
                 </div>
                 <div className="flex-1 bg-[#111] rounded-lg p-2 space-y-2 border border-gray-800/50">
                    {opportunities.filter(o => o.stage === stage).map(op => (
                      <div key={op.id} className="bg-[#1a1a1a] p-3 rounded border border-gray-700 hover:border-gray-500 cursor-pointer shadow-sm group">
                         <div className="text-sm font-medium text-gray-200 mb-1 group-hover:text-primary transition-colors">{op.title}</div>
                         <div className="text-xs text-gray-500 mb-2 truncate">{op.contact}</div>
                         <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-mono text-green-500">${op.value}</span>
                         </div>
                      </div>
                    ))}
                    <button className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded dashed border border-gray-800 border-dashed">
                       + Add Deal
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex-1 bg-[#0a0a0a] rounded-lg p-8 border border-gray-800 flex flex-col items-center justify-center">
       <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-6 justify-center">
             <div className="w-10 h-10 bg-white text-black rounded flex items-center justify-center font-bold text-xl">20</div>
             <h2 className="text-2xl font-bold">Twenty CRM</h2>
          </div>
          
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${syncStatus === 'CONNECTED' ? 'bg-green-900 text-green-500' : 'bg-red-900 text-red-500'}`}>
                   {syncStatus === 'CONNECTED' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                   {syncStatus}
                </span>
             </div>

             <div>
                <label className="block text-xs text-gray-500 mb-1">Server URL</label>
                <input type="text" placeholder="https://app.twenty.com" className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white" />
             </div>

             <div>
                <label className="block text-xs text-gray-500 mb-1">API Key</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="tw_sk_..." 
                  className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white" 
                />
             </div>

             <button 
                onClick={() => {
                   if (apiKey.length > 5) setSyncStatus('CONNECTED');
                }}
                className="w-full bg-white text-black font-bold py-2 rounded hover:bg-gray-200 transition-colors"
             >
                {syncStatus === 'CONNECTED' ? 'Sync Now' : 'Connect Integration'}
             </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-4">
             Open-Source CRM integration via GraphQL API.
          </p>
       </div>
    </div>
  );

  return (
    <div className="flex h-full font-sans bg-black text-gray-200 overflow-hidden">
       {/* Sidebar - Twenty Style */}
       <div className="w-56 border-r border-gray-800 flex flex-col bg-[#050505]">
          <div className="p-4 border-b border-gray-800">
             <div className="flex items-center gap-2 font-bold text-white">
                <div className="w-5 h-5 bg-white text-black rounded flex items-center justify-center text-[10px]">20</div>
                Twenty
             </div>
          </div>
          
          <div className="flex-1 py-4 space-y-1 px-2">
             <div className="text-[10px] font-bold text-gray-600 px-3 mb-2 uppercase tracking-wider">Objects</div>
             <button 
                onClick={() => { setActiveObject('PEOPLE'); setViewMode('LIST'); }}
                className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 ${activeObject === 'PEOPLE' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
             >
                <Users size={14} /> People
             </button>
             <button 
                onClick={() => setActiveObject('COMPANIES')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 ${activeObject === 'COMPANIES' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
             >
                <Building2 size={14} /> Companies
             </button>
             <button 
                onClick={() => { setActiveObject('OPPORTUNITIES'); setViewMode('KANBAN'); }}
                className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 ${activeObject === 'OPPORTUNITIES' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
             >
                <Target size={14} /> Opportunities
             </button>
          </div>

          <div className="p-2 border-t border-gray-800">
             <button 
                onClick={() => setActiveObject('SETTINGS')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 ${activeObject === 'SETTINGS' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
             >
                <Settings size={14} /> Settings
             </button>
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col h-full bg-[#050505]">
          {/* Header */}
          {activeObject !== 'SETTINGS' && (
             <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-[#050505]">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                   <div className="bg-gray-800 p-1 rounded"><LayoutGrid size={14}/></div>
                   <span className="text-gray-600"><ChevronRight size={14} /></span>
                   <span className="text-white font-medium">{activeObject.charAt(0) + activeObject.slice(1).toLowerCase()}</span>
                   <span className="text-gray-600 text-xs ml-2">All {activeObject.toLowerCase()}</span>
                </div>
                
                <div className="flex bg-[#111] rounded p-0.5 border border-gray-800">
                   <button 
                      onClick={() => setViewMode('LIST')} 
                      className={`p-1.5 rounded ${viewMode === 'LIST' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <List size={14} />
                   </button>
                   <button 
                      onClick={() => setViewMode('KANBAN')} 
                      className={`p-1.5 rounded ${viewMode === 'KANBAN' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <LayoutGrid size={14} />
                   </button>
                </div>
             </div>
          )}

          <div className="flex-1 p-4 overflow-hidden flex flex-col">
             {activeObject === 'SETTINGS' ? renderSettings() : 
              activeObject === 'OPPORTUNITIES' && viewMode === 'KANBAN' ? renderOpportunitiesBoard() : 
              renderPeopleView()
             }
          </div>
       </div>
    </div>
  );
};

const AdminConsole: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPublish: (post: Post) => Promise<boolean>;
  onUpdatePost: (postId: string, payload: Partial<Post>) => Promise<boolean>;
  onGenerateRssDrafts: (limit: number, publishNow: boolean) => Promise<{ created: number; published: boolean } | null>;
  onUpdateTrades: (payload: { trades: Trade[]; marketAnalysis: string; snapshotDate?: string }) => Promise<boolean>;
  trades: Trade[];
  marketAnalysis: string;
  onCreateTestUser: (payload: {
    email: string;
    password: string;
    isSubscribed: boolean;
    isAdmin: boolean;
    skipOnboarding: boolean;
    manualVipAccess: boolean;
    subscriptionPlan: string;
    subscriptionStatus: string;
    emailVerified: boolean;
  }) => Promise<boolean>;
  onUpdateUserAccess: (userId: string, payload: {
    isAdmin?: boolean;
    isSubscribed?: boolean;
    manualVipAccess?: boolean;
    needsOnboarding?: boolean;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    emailVerified?: boolean;
  }) => Promise<boolean>;
  posts: Post[];
  users: AdminUser[];
  crmOverview: CrmOverview | null;
  lemonConfig: LemonSubscriptionConfig | null;
  onRefreshCrm: () => Promise<boolean>;
  reviews: Review[];
  onReviewAction: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<boolean>;
}> = ({
  isOpen,
  onClose,
  onPublish,
  onUpdatePost,
  onGenerateRssDrafts,
  onUpdateTrades,
  trades,
  marketAnalysis,
  onCreateTestUser,
  onUpdateUserAccess,
  posts,
  users,
  crmOverview,
  lemonConfig,
  onRefreshCrm,
  reviews,
  onReviewAction
}) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'TRADES' | 'CRM' | 'REVIEWS'>('CONTENT');

  // Content Generation State
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'BLOG' | 'TRADE'>('BLOG');
  const [loading, setLoading] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<Partial<Post> | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [editorLocked, setEditorLocked] = useState(false);
  const [editorDraft, setEditorDraft] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [manualPublishTarget, setManualPublishTarget] = useState<'BLOG' | 'BOURSE' | 'CRYPTO'>('BLOG');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userSubscribed, setUserSubscribed] = useState(true);
  const [userAdmin, setUserAdmin] = useState(false);
  const [userSkipOnboarding, setUserSkipOnboarding] = useState(true);
  const [userManualVip, setUserManualVip] = useState(false);
  const [userPlan, setUserPlan] = useState('combo');
  const [userStatus, setUserStatus] = useState('ACTIVE');
  const [userEmailVerified, setUserEmailVerified] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [tradeDrafts, setTradeDrafts] = useState<Trade[]>(trades);
  const [tradeMarketAnalysis, setTradeMarketAnalysis] = useState(marketAnalysis);
  const [tradeSnapshotDate, setTradeSnapshotDate] = useState('');
  const [savingTrades, setSavingTrades] = useState(false);
  const [refreshingCrm, setRefreshingCrm] = useState(false);
  const [generatingRssDrafts, setGeneratingRssDrafts] = useState(false);
  const [rssPublishNow, setRssPublishNow] = useState(false);
  const [crmEmailSearch, setCrmEmailSearch] = useState('');

  useEffect(() => {
    setTradeDrafts(trades);
    setTradeSnapshotDate(new Date().toISOString().slice(0, 10));
  }, [trades, isOpen]);

  useEffect(() => {
    setTradeMarketAnalysis(marketAnalysis);
  }, [marketAnalysis, isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateAIContent(mode, topic);
    setGeneratedPreview(result);
    setLoading(false);
  };

  const resetEditor = () => {
    setSelectedPostId('');
    setEditorTitle('');
    setEditorExcerpt('');
    setEditorContent('');
    setEditorTags('');
    setEditorLocked(false);
    setEditorDraft(false);
    setManualPublishTarget('BLOG');
  };

  const inferManualPublishTargetFromPost = (post: Post): 'BLOG' | 'BOURSE' | 'CRYPTO' => {
    if (post.type !== ContentType.TRADE_SIGNAL) return 'BLOG';
    const tagsText = Array.isArray(post.tags) ? post.tags.join(' ') : '';
    const tradeAsset = post.tradeDetails?.asset || '';
    const searchable = `${post.title} ${post.excerpt} ${tagsText} ${tradeAsset}`.toUpperCase();
    if (/(BTC|ETH|USDT|SOL|XRP|ADA|BNB|CRYPTO|COIN|ALTCOIN)/.test(searchable)) {
      return 'CRYPTO';
    }
    return 'BOURSE';
  };

  const loadPostIntoEditor = (postId: string) => {
    if (!postId) {
      resetEditor();
      return;
    }
    const targetPost = posts.find((post) => post.id === postId);
    if (!targetPost) {
      alert('Publication introuvable.');
      return;
    }
    setSelectedPostId(postId);
    setMode(targetPost.type === ContentType.TRADE_SIGNAL ? 'TRADE' : 'BLOG');
    setManualPublishTarget(inferManualPublishTargetFromPost(targetPost));
    setEditorTitle(targetPost.title || '');
    setEditorExcerpt(targetPost.excerpt || '');
    setEditorContent(targetPost.content || '');
    setEditorTags(Array.isArray(targetPost.tags) ? targetPost.tags.join(', ') : '');
    setEditorLocked(Boolean(targetPost.isLocked));
    setEditorDraft(String(targetPost.publicationStatus || 'PUBLISHED').toUpperCase() === 'DRAFT');
  };

  const handlePublishConfirm = async () => {
    if (generatedPreview) {
      const newPost: Post = {
        id: `gen-${Date.now()}`,
        title: generatedPreview.title || 'Nouvelle Publication',
        excerpt: generatedPreview.excerpt || '',
        content: generatedPreview.content || '',
        tags: generatedPreview.tags || [],
        date: new Date().toLocaleDateString(),
        type: mode === 'BLOG' ? ContentType.ARTICLE : ContentType.TRADE_SIGNAL,
        isLocked: mode === 'TRADE'
      };
      const ok = await onPublish(newPost);
      if (!ok) return;
      setTopic('');
      setGeneratedPreview(null);
      onClose();
    }
  };

  const handleManualPublish = async () => {
    if (!editorTitle || !editorExcerpt) {
      alert('Ajoutez au minimum un titre et un résumé.');
      return;
    }
    const baseTags = editorTags.split(',').map(tag => tag.trim()).filter(Boolean);
    const normalizedTags = [...baseTags];
    if (manualPublishTarget === 'CRYPTO' && !normalizedTags.some((tag) => /crypto|btc|eth|usdt|coin/i.test(tag))) {
      normalizedTags.push('crypto');
    }
    if (manualPublishTarget === 'BOURSE' && !normalizedTags.some((tag) => /bourse|action|indice|nasdaq|sp500/i.test(tag))) {
      normalizedTags.push('bourse');
    }
    const payload = {
      title: editorTitle,
      excerpt: editorExcerpt,
      content: editorContent,
      tags: normalizedTags,
      date: new Date().toLocaleDateString('fr-FR'),
      type: manualPublishTarget === 'BLOG' ? ContentType.ARTICLE : ContentType.TRADE_SIGNAL,
      isLocked: editorLocked,
      publicationStatus: editorDraft ? 'DRAFT' : 'PUBLISHED'
    };
    const ok = selectedPostId
      ? await onUpdatePost(selectedPostId, payload)
      : await onPublish({
          id: `manual-${Date.now()}`,
          ...payload
        });
    if (!ok) return;
    resetEditor();
    if (selectedPostId) {
      alert('Publication mise a jour.');
    } else {
      onClose();
    }
  };

  const handleGenerateRssDrafts = async () => {
    setGeneratingRssDrafts(true);
    const result = await onGenerateRssDrafts(5, rssPublishNow);
    setGeneratingRssDrafts(false);
    if (!result) {
      alert("Impossible de générer les brouillons RSS.");
      return;
    }
    alert(
      rssPublishNow
        ? `${result.created} article(s) RSS publié(s).`
        : `${result.created} brouillon(s) RSS généré(s).`
    );
  };

  const handleUserAccessUpdate = async (
    userId: string,
    payload: {
      isAdmin?: boolean;
      isSubscribed?: boolean;
      manualVipAccess?: boolean;
      needsOnboarding?: boolean;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      emailVerified?: boolean;
    }
  ) => {
    setUpdatingUserId(userId);
    const ok = await onUpdateUserAccess(userId, payload);
    if (!ok) {
      alert('Mise à jour utilisateur impossible.');
    }
    setUpdatingUserId(null);
  };

  const handleAddTrade = () => {
    setTradeDrafts((prev) => [
      ...prev,
      {
        actif: '',
        market: 'CRYPTO',
        direction: 'Long',
        entree: 0,
        sl: 0,
        tp: 0,
        taille: '1%',
        raison: '',
        heure: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    ]);
  };

  const handleTradeFieldChange = (index: number, key: keyof Trade, value: string) => {
    setTradeDrafts((prev) => prev.map((trade, tradeIndex) => {
      if (tradeIndex !== index) return trade;
      if (key === 'entree' || key === 'sl' || key === 'tp') {
        return { ...trade, [key]: Number(value || 0) };
      }
      if (key === 'direction') {
        return { ...trade, direction: value === 'Short' ? 'Short' : 'Long' };
      }
      if (key === 'market') {
        return { ...trade, market: value === 'BOURSE' ? 'BOURSE' : 'CRYPTO' };
      }
      return { ...trade, [key]: value };
    }));
  };

  const handleRemoveTrade = (index: number) => {
    setTradeDrafts((prev) => prev.filter((_, tradeIndex) => tradeIndex !== index));
  };

  const handleSaveTrades = async () => {
    setSavingTrades(true);
    const sanitizedTrades = tradeDrafts
      .map((trade) => ({
        ...trade,
        actif: (trade.actif || '').trim(),
        taille: (trade.taille || '').trim(),
        raison: (trade.raison || '').trim(),
        heure: (trade.heure || '').trim()
      }))
      .filter((trade) => trade.actif && trade.taille && trade.raison && trade.heure);
    const ok = await onUpdateTrades({
      trades: sanitizedTrades,
      marketAnalysis: tradeMarketAnalysis,
      snapshotDate: tradeSnapshotDate || undefined
    });
    if (!ok) {
      alert('Impossible de sauvegarder les signaux.');
    }
    setSavingTrades(false);
  };

  const crmFunnel = crmOverview?.funnel;
  const crmLeads = Array.isArray(crmOverview?.leads) ? crmOverview.leads : [];
  const crmPlanBreakdown = crmOverview?.plans || {};
  const crmAffiliates = Array.isArray(crmOverview?.affiliates) ? crmOverview.affiliates : [];
  const normalizedCrmEmailSearch = normalizeEmailSearch(crmEmailSearch);
  const crmAccountsHistory = [...users]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 200);
  const filteredCrmAccountsHistory = normalizedCrmEmailSearch
    ? crmAccountsHistory.filter((account) => normalizeEmailSearch(account.email).includes(normalizedCrmEmailSearch))
    : crmAccountsHistory;
  const filteredCrmLeads = normalizedCrmEmailSearch
    ? crmLeads.filter((lead) => normalizeEmailSearch(lead.email).includes(normalizedCrmEmailSearch))
    : crmLeads;
  const filteredCrmAffiliates = normalizedCrmEmailSearch
    ? crmAffiliates.filter((affiliate) => normalizeEmailSearch(affiliate.ownerEmail).includes(normalizedCrmEmailSearch))
    : crmAffiliates;
  const selectedClient = normalizedCrmEmailSearch
    ? crmAccountsHistory.find((account) => normalizeEmailSearch(account.email) === normalizedCrmEmailSearch)
      || filteredCrmAccountsHistory[0]
      || null
    : null;
  const selectedClientPermissions = selectedClient ? getUserPermissions(selectedClient as SessionUser) : DEFAULT_PERMISSIONS;
  const selectedClientLeadHistory = selectedClient
    ? crmLeads
      .filter((lead) => normalizeEmailSearch(lead.email) === normalizeEmailSearch(selectedClient.email))
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    : [];
  const selectedClientAffiliate = selectedClient
    ? crmAffiliates.find((affiliate) => normalizeEmailSearch(affiliate.ownerEmail) === normalizeEmailSearch(selectedClient.email)) || null
    : null;
  const lemonPlansState = lemonConfig?.lemon?.plans || { bourse: false, crypto: false, combo: false };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 font-mono">
      <div className={`w-full bg-[#0f0f0f] border border-primary rounded-lg shadow-[0_0_50px_rgba(0,255,157,0.1)] flex flex-col transition-all duration-300 ${activeTab !== 'CONTENT' ? 'max-w-[90vw] h-[90vh]' : 'max-w-4xl h-auto'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Bot /> BLACK COMMAND
            </h2>
            <div className="flex gap-2">
               <button 
                 onClick={() => setActiveTab('CONTENT')}
                 className={`text-xs font-bold px-3 py-1 rounded transition-colors ${activeTab === 'CONTENT' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 IA GÉNÉRATEUR
               </button>
               <button
                 onClick={() => setActiveTab('TRADES')}
                 className={`text-xs font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 ${activeTab === 'TRADES' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 <Zap size={12}/> SIGNAUX VIP
               </button>
               <button
                 onClick={() => setActiveTab('CRM')}
                 className={`text-xs font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 ${activeTab === 'CRM' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 <Users size={12}/> CRM CLIENTS
               </button>
               <button 
                 onClick={() => setActiveTab('REVIEWS')}
                 className={`text-xs font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 ${activeTab === 'REVIEWS' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 <MessageSquare size={12}/> AVIS
                 {reviews.filter(r => r.status === 'PENDING').length > 0 && 
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></span>
                 }
               </button>
            </div>
          </div>
          <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'TRADES' ? (
            <div className="p-6 overflow-y-auto h-full space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-bold text-white">Signaux quotidiens (edition sans code)</h3>
                  <p className="text-xs text-gray-500 mt-1">Cette section met a jour /api/trades via /api/admin/trades.</p>
                </div>
                <label className="text-xs text-gray-400 min-w-[180px]">
                  Date d'archive
                  <input
                    type="date"
                    value={tradeSnapshotDate}
                    onChange={(event) => setTradeSnapshotDate(event.target.value)}
                    className="mt-1 w-full bg-[#111] border border-gray-700 rounded p-2 text-white text-sm"
                  />
                </label>
                <button
                  onClick={handleAddTrade}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-primary text-black rounded hover:bg-primary-dark"
                >
                  <Plus size={14} /> Ajouter un signal
                </button>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[1180px] text-xs">
                  <thead className="bg-[#111] text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-left">Marche</th>
                      <th className="p-3 text-left">Actif</th>
                      <th className="p-3 text-left">Direction</th>
                      <th className="p-3 text-left">Entree</th>
                      <th className="p-3 text-left">SL</th>
                      <th className="p-3 text-left">TP</th>
                      <th className="p-3 text-left">Taille</th>
                      <th className="p-3 text-left">Raison</th>
                      <th className="p-3 text-left">Heure</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {tradeDrafts.map((trade, index) => (
                      <tr key={`${trade.actif || 'trade'}-${index}`}>
                        <td className="p-2">
                          <select value={trade.market || 'CRYPTO'} onChange={(e) => handleTradeFieldChange(index, 'market', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white">
                            <option value="CRYPTO">CRYPTO</option>
                            <option value="BOURSE">BOURSE</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input value={trade.actif} onChange={(e) => handleTradeFieldChange(index, 'actif', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" placeholder="BTC/USDT" />
                        </td>
                        <td className="p-2">
                          <select value={trade.direction} onChange={(e) => handleTradeFieldChange(index, 'direction', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white">
                            <option value="Long">Long</option>
                            <option value="Short">Short</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="number" value={Number.isFinite(trade.entree) ? trade.entree : 0} onChange={(e) => handleTradeFieldChange(index, 'entree', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={Number.isFinite(trade.sl) ? trade.sl : 0} onChange={(e) => handleTradeFieldChange(index, 'sl', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={Number.isFinite(trade.tp) ? trade.tp : 0} onChange={(e) => handleTradeFieldChange(index, 'tp', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" />
                        </td>
                        <td className="p-2">
                          <input value={trade.taille} onChange={(e) => handleTradeFieldChange(index, 'taille', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" placeholder="1%" />
                        </td>
                        <td className="p-2">
                          <input value={trade.raison} onChange={(e) => handleTradeFieldChange(index, 'raison', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" placeholder="Contexte / setup" />
                        </td>
                        <td className="p-2">
                          <input value={trade.heure} onChange={(e) => handleTradeFieldChange(index, 'heure', e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" placeholder="YYYY-MM-DD HH:mm" />
                        </td>
                        <td className="p-2">
                          <button onClick={() => handleRemoveTrade(index)} className="px-2 py-1 border border-red-500/40 text-red-400 rounded hover:bg-red-500/10">
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tradeDrafts.length === 0 && (
                      <tr>
                        <td className="p-4 text-gray-500" colSpan={10}>Aucun signal. Ajoutez votre premier trade ci-dessus.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Analyse marche du jour (markdown simple)</label>
                <textarea
                  value={tradeMarketAnalysis}
                  onChange={(e) => setTradeMarketAnalysis(e.target.value)}
                  className="w-full h-44 bg-[#111] border border-gray-700 rounded p-3 text-sm text-white"
                  placeholder="## Biais du jour..."
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => {
                    setTradeDrafts(trades);
                    setTradeMarketAnalysis(marketAnalysis);
                    setTradeSnapshotDate(new Date().toISOString().slice(0, 10));
                  }}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded hover:border-gray-500 hover:text-white"
                >
                  Reinitialiser
                </button>
                <button
                  onClick={handleSaveTrades}
                  disabled={savingTrades}
                  className="px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary-dark disabled:opacity-60"
                >
                  {savingTrades ? 'Sauvegarde...' : 'Sauvegarder les signaux'}
                </button>
              </div>
            </div>
          ) : activeTab === 'CRM' ? (
            <div className="p-6 overflow-y-auto h-full space-y-6">
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <label className="flex-1 max-w-2xl">
                    <span className="text-xs uppercase tracking-wider text-gray-500">Recherche client (email uniquement)</span>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-700 bg-[#111] px-3 py-2">
                      <Search size={14} className="text-gray-500" />
                      <input
                        value={crmEmailSearch}
                        onChange={(event) => setCrmEmailSearch(event.target.value)}
                        placeholder="ex: client@domaine.com"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </label>
                  <button
                    onClick={() => setCrmEmailSearch('')}
                    disabled={!crmEmailSearch.trim()}
                    className="px-3 py-2 text-xs font-bold border border-gray-700 rounded text-gray-300 hover:text-white disabled:opacity-40"
                  >
                    Effacer
                  </button>
                </div>
                {normalizedCrmEmailSearch && (
                  <p className="mt-3 text-xs text-gray-500">
                    Résultats : {filteredCrmAccountsHistory.length} compte{filteredCrmAccountsHistory.length > 1 ? 's' : ''} · {filteredCrmLeads.length} événement{filteredCrmLeads.length > 1 ? 's' : ''} lead
                  </p>
                )}
              </div>

              {normalizedCrmEmailSearch && (
                <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white">Historique client</h3>
                    <p className="text-xs text-gray-500 mt-1">Historique consolidé du client recherché.</p>
                  </div>
                  {!selectedClient ? (
                    <div className="p-4 text-sm text-gray-500">Aucun client trouvé pour cet email.</div>
                  ) : (
                    <div className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-bold text-white break-all">{selectedClient.email}</p>
                        </div>
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-xs text-gray-500">Date de création</p>
                          <p className="text-sm font-bold text-white">{formatDateLabel(selectedClient.createdAt)}</p>
                        </div>
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-xs text-gray-500">Plan / Statut</p>
                          <p className="text-sm font-bold text-white">{formatPlanLabel(selectedClient.subscriptionPlan || 'NONE')} · {formatSubscriptionStatusLabel(selectedClient.subscriptionStatus || 'NONE')}</p>
                        </div>
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-xs text-gray-500">VIP</p>
                          <p className={selectedClientPermissions.vipAccess ? 'text-sm font-bold text-green-400' : 'text-sm font-bold text-gray-400'}>
                            {selectedClientPermissions.vipAccess ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-gray-500">Code parrain utilisé</p>
                          <p className="text-white font-bold mt-1">{selectedClient.referredByCode || '-'}</p>
                        </div>
                        <div className="bg-[#111] border border-gray-800 rounded p-3">
                          <p className="text-gray-500">Parrain (email)</p>
                          <p className="text-white font-bold mt-1">{selectedClient.referredByEmail || '-'}</p>
                        </div>
                      </div>

                      {selectedClientAffiliate && (
                        <div className="bg-[#111] border border-gray-800 rounded p-3 text-xs">
                          <p className="text-gray-500">Programme parrainage du client</p>
                          <p className="text-white mt-1">
                            Code : <span className="font-bold">{selectedClientAffiliate.referralCode || '-'}</span> · Filleuls : <span className="font-bold">{selectedClientAffiliate.referralsCount}</span> · Actifs : <span className="font-bold text-green-400">{selectedClientAffiliate.activeReferralsCount}</span> · Relances : <span className="font-bold text-yellow-300">{Number(selectedClientAffiliate.followUpRequiredCount || 0)}</span>
                          </p>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-xs">
                          <thead className="bg-[#111] text-gray-500 uppercase tracking-wider">
                            <tr>
                              <th className="p-3 text-left">Source</th>
                              <th className="p-3 text-left">Statut lead</th>
                              <th className="p-3 text-left">Plan</th>
                              <th className="p-3 text-left">Statut abo</th>
                              <th className="p-3 text-left">Dernier événement</th>
                              <th className="p-3 text-left">Inscription</th>
                              <th className="p-3 text-left">Mise à jour</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {selectedClientLeadHistory.length === 0 ? (
                              <tr>
                                <td className="p-4 text-gray-500" colSpan={7}>Aucun événement lead trouvé pour cet email.</td>
                              </tr>
                            ) : selectedClientLeadHistory.map((lead) => (
                              <tr key={lead.id}>
                                <td className="p-3 text-gray-300">{lead.source}</td>
                                <td className="p-3 text-white">{lead.status}</td>
                                <td className="p-3 text-gray-300">{formatPlanLabel(lead.subscriptionPlan)}</td>
                                <td className="p-3 text-gray-300">{formatSubscriptionStatusLabel(lead.subscriptionStatus)}</td>
                                <td className="p-3 text-gray-400">{lead.lastEvent || 'captured'}</td>
                                <td className="p-3 text-gray-400">{formatDateLabel(lead.createdAt)}</td>
                                <td className="p-3 text-gray-400">{formatRelativeTime(lead.updatedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Leads captures</p>
                  <p className="text-2xl font-bold text-white mt-1">{crmFunnel?.leadsCaptured ?? 0}</p>
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Comptes crees</p>
                  <p className="text-2xl font-bold text-white mt-1">{crmFunnel?.registeredUsers ?? 0}</p>
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">VIP actifs</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{crmFunnel?.vipActiveUsers ?? 0}</p>
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Onboarding a terminer</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">{crmFunnel?.onboardingPending ?? 0}</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.3fr,1fr] gap-6">
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">Pipeline CRM</h3>
                      <p className="text-xs text-gray-500 mt-1">Vue globale leads, verification email, activation VIP.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(buildApiUrl('/api/admin/crm/leads.csv'), '_blank', 'noopener')}
                        className="px-3 py-2 text-xs font-bold border border-gray-700 rounded text-gray-200 hover:text-white hover:border-gray-500"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={async () => {
                          setRefreshingCrm(true);
                          await onRefreshCrm();
                          setRefreshingCrm(false);
                        }}
                        className="px-3 py-2 text-xs font-bold border border-gray-700 rounded text-gray-200 hover:text-white hover:border-gray-500"
                      >
                        {refreshingCrm ? 'Actualisation...' : 'Actualiser'}
                      </button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-[#111] border border-gray-800 rounded p-3">
                      <p className="text-gray-500">Verification email en attente</p>
                      <p className="text-white font-bold mt-1">{crmFunnel?.pendingVerification ?? 0}</p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 rounded p-3">
                      <p className="text-gray-500">Abonnements annules</p>
                      <p className="text-white font-bold mt-1">{crmFunnel?.canceledUsers ?? 0}</p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 rounded p-3">
                      <p className="text-gray-500">Repartition plans</p>
                      <p className="text-white font-bold mt-1">
                        Bourse {crmPlanBreakdown.bourse || 0} · Crypto {crmPlanBreakdown.crypto || 0} · Combo {crmPlanBreakdown.combo || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2">Lemon Squeezy</h3>
                  <p className="text-xs text-gray-500 mb-4">Statut backend de la configuration checkout/webhook.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mode</span>
                      <span className="text-white">{lemonConfig?.mode === 'api' ? 'API' : 'URL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">API activée</span>
                      <span className={lemonConfig?.lemon?.apiEnabled ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {lemonConfig?.lemon?.apiEnabled ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Webhook signé</span>
                      <span className={lemonConfig?.lemon?.webhookEnabled ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {lemonConfig?.lemon?.webhookEnabled ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="border-t border-gray-800 pt-2 mt-2">
                      <p className="text-gray-500 mb-1">Plans actifs</p>
                      <p className="text-white">
                        Bourse {lemonPlansState.bourse ? 'OK' : 'KO'} · Crypto {lemonPlansState.crypto ? 'OK' : 'KO'} · Combo {lemonPlansState.combo ? 'OK' : 'KO'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Historique des comptes créés</h3>
                    <p className="text-xs text-gray-500 mt-1">Comptes existants avec date d inscription, plan et statut.</p>
                  </div>
                  <span className="text-xs text-gray-500">{filteredCrmAccountsHistory.length} compte{filteredCrmAccountsHistory.length > 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-xs">
                    <thead className="bg-[#111] text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Plan</th>
                        <th className="p-3 text-left">Statut abo</th>
                        <th className="p-3 text-left">VIP</th>
                        <th className="p-3 text-left">Date de création</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredCrmAccountsHistory.length === 0 ? (
                        <tr>
                          <td className="p-4 text-gray-500" colSpan={5}>Aucun compte enregistré.</td>
                        </tr>
                      ) : filteredCrmAccountsHistory.map((account) => {
                        const accountPermissions = getUserPermissions(account as SessionUser);
                        return (
                          <tr key={account.id}>
                            <td className="p-3 text-gray-200">{account.email}</td>
                            <td className="p-3 text-gray-300">{formatPlanLabel(account.subscriptionPlan || 'NONE')}</td>
                            <td className="p-3 text-gray-300">{formatSubscriptionStatusLabel(account.subscriptionStatus || 'NONE')}</td>
                            <td className="p-3">
                              <span className={accountPermissions.vipAccess ? 'text-green-400 font-bold' : 'text-gray-400'}>
                                {accountPermissions.vipAccess ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400">{formatDateLabel(account.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Parrains et filleuls</h3>
                    <p className="text-xs text-gray-500 mt-1">Suivi filleuls : statut d abonnement, canal de paiement, commission (50% en crypto manuel) et besoin de relance.</p>
                  </div>
                  <span className="text-xs text-gray-500">{filteredCrmAffiliates.length} parrain{filteredCrmAffiliates.length > 1 ? 's' : ''}</span>
                </div>
                {filteredCrmAffiliates.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Aucun parrain avec des filleuls pour le moment.</div>
                ) : (
                  <div className="space-y-4 p-4">
                    {filteredCrmAffiliates.slice(0, 80).map((affiliate) => (
                      <div key={`${affiliate.ownerUserId || affiliate.ownerEmail}`} className="border border-gray-800 rounded-lg bg-[#0f0f0f] overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap items-center gap-3 justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{affiliate.ownerEmail}</p>
                            <p className="text-xs text-gray-500">Code parrain : {affiliate.referralCode || '-'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded border border-gray-700 text-gray-300">{affiliate.referralsCount} filleul{affiliate.referralsCount > 1 ? 's' : ''}</span>
                            <span className="px-2 py-1 rounded border border-green-500/30 text-green-400">{affiliate.activeReferralsCount} actif{affiliate.activeReferralsCount > 1 ? 's' : ''}</span>
                            <span className="px-2 py-1 rounded border border-yellow-500/30 text-yellow-300">{Number(affiliate.followUpRequiredCount || 0)} relance{Number(affiliate.followUpRequiredCount || 0) > 1 ? 's' : ''}</span>
                            <span className="px-2 py-1 rounded border border-primary/40 text-primary">{affiliate.totalCommissionAmount.toFixed(2)}€ cumulé</span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[980px] text-xs">
                            <thead className="bg-[#111] text-gray-500 uppercase tracking-wider">
                              <tr>
                                <th className="p-3 text-left">Filleul</th>
                                <th className="p-3 text-left">Plan</th>
                                <th className="p-3 text-left">Abonnement</th>
                                <th className="p-3 text-left">Canal paiement</th>
                                <th className="p-3 text-left">Commission</th>
                                <th className="p-3 text-left">Mode commission</th>
                                <th className="p-3 text-left">Relance</th>
                                <th className="p-3 text-left">Inscription</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {affiliate.referrals.map((referral) => (
                                <tr key={referral.id}>
                                  <td className="p-3 text-gray-200">{referral.pseudo}</td>
                                  <td className="p-3 text-gray-300">{formatPlanLabel(referral.subscriptionPlan)}</td>
                                  <td className="p-3">
                                    <div className="space-y-1">
                                      <span className={referral.subscriptionActive ? 'text-green-400 font-bold' : 'text-gray-300'}>
                                        {referral.subscriptionActive ? 'Actif' : 'Inactif'}
                                      </span>
                                      <p className="text-[11px] text-gray-500">{formatSubscriptionStatusLabel(referral.subscriptionStatus || 'NONE')}</p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-gray-300">{formatPaymentProviderLabel(referral.paymentProvider)}</td>
                                  <td className="p-3">
                                    <div className="space-y-1">
                                      <span className="text-primary font-bold">{Number(referral.commissionAmount || 0).toFixed(2)}€</span>
                                      <p className="text-[11px] text-gray-500">
                                        {(() => {
                                          const commissionModel = String(referral.commissionModel || '').toUpperCase();
                                          if (commissionModel === 'LEMON_AFFILIATE_EXTERNAL') return 'Géré par Lemon';
                                          if (commissionModel === 'LEMON_CARD_INTERNAL_DISABLED') return 'Pas de partage interne';
                                          return formatCommissionStatus(referral.commissionStatus);
                                        })()}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-gray-300">{formatCommissionModelLabel(referral.commissionModel)}</td>
                                  <td className="p-3 text-gray-300">{formatFollowUpLabel(referral.followUpRequired, referral.paymentProvider)}</td>
                                  <td className="p-3 text-gray-400">{formatDateLabel(referral.joinedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Derniers leads</h3>
                    <p className="text-xs text-gray-500 mt-1">Capture email + progression jusqu'a activation VIP.</p>
                  </div>
                  <span className="text-xs text-gray-500">{filteredCrmLeads.length} enregistres</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-xs">
                    <thead className="bg-[#111] text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Source</th>
                        <th className="p-3 text-left">Code parrain</th>
                        <th className="p-3 text-left">Parrain (email)</th>
                        <th className="p-3 text-left">Statut lead</th>
                        <th className="p-3 text-left">Plan</th>
                        <th className="p-3 text-left">Statut abo</th>
                        <th className="p-3 text-left">Dernier evenement</th>
                        <th className="p-3 text-left">Inscription</th>
                        <th className="p-3 text-left">Maj</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredCrmLeads.length === 0 ? (
                        <tr>
                          <td className="p-4 text-gray-500" colSpan={10}>Aucun lead pour le moment.</td>
                        </tr>
                      ) : filteredCrmLeads.slice(0, 120).map((lead) => (
                        <tr key={lead.id}>
                          <td className="p-3 text-gray-200">{lead.email}</td>
                          <td className="p-3 text-gray-400">{lead.source}</td>
                          <td className="p-3 text-primary">{lead.referralCode || '-'}</td>
                          <td className="p-3 text-gray-300">{lead.referralOwnerEmail || '-'}</td>
                          <td className="p-3 text-white">{lead.status}</td>
                          <td className="p-3 text-gray-300">{formatPlanLabel(lead.subscriptionPlan)}</td>
                          <td className="p-3 text-gray-300">{formatSubscriptionStatusLabel(lead.subscriptionStatus)}</td>
                          <td className="p-3 text-gray-400">{lead.lastEvent || 'captured'}</td>
                          <td className="p-3 text-gray-400">{formatDateLabel(lead.createdAt)}</td>
                          <td className="p-3 text-gray-400">{formatRelativeTime(lead.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid lg:grid-cols-[360px,1fr] gap-6">
                <div className="bg-black border border-gray-800 rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-bold text-white">Créer un compte test</h3>
                  <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="email@example.com" className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <input value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Mot de passe (8+)" type="password" className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <select value={userPlan} onChange={(e) => setUserPlan(e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white">
                    <option value="NONE">Aucun plan</option>
                    <option value="bourse">Bourse</option>
                    <option value="crypto">Crypto</option>
                    <option value="combo">Combo</option>
                  </select>
                  <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white">
                    <option value="NONE">NONE</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELED">CANCELED</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={userSubscribed} onChange={(e) => setUserSubscribed(e.target.checked)} />
                    Abonnement déjà actif
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={userManualVip} onChange={(e) => setUserManualVip(e.target.checked)} />
                    VIP manuel (accès complet)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={userAdmin} onChange={(e) => setUserAdmin(e.target.checked)} />
                    Donner les droits admin
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={userEmailVerified} onChange={(e) => setUserEmailVerified(e.target.checked)} />
                    Email vérifié
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={userSkipOnboarding} onChange={(e) => setUserSkipOnboarding(e.target.checked)} />
                    Passer l'onboarding
                  </label>
                  <button
                    onClick={async () => {
                      const ok = await onCreateTestUser({
                        email: userEmail,
                        password: userPassword,
                        isSubscribed: userSubscribed,
                        isAdmin: userAdmin,
                        skipOnboarding: userSkipOnboarding,
                        manualVipAccess: userManualVip,
                        subscriptionPlan: userPlan,
                        subscriptionStatus: userStatus,
                        emailVerified: userEmailVerified
                      });
                      if (!ok) return;
                      setUserEmail('');
                      setUserPassword('');
                      setUserSubscribed(true);
                      setUserAdmin(false);
                      setUserSkipOnboarding(true);
                      setUserManualVip(false);
                      setUserPlan('combo');
                      setUserStatus('ACTIVE');
                      setUserEmailVerified(false);
                    }}
                    className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark"
                  >
                    Créer le compte
                  </button>
                </div>

                <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-9 gap-4 p-3 border-b border-gray-800 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <div>Email</div>
                    <div>Plan</div>
                    <div>Statut</div>
                    <div>VIP</div>
                    <div>Admin</div>
                    <div>Email OK</div>
                    <div>Onboarding</div>
                    <div>Inscription</div>
                    <div>Actions</div>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {users.map((user) => {
                      const userPermissions = getUserPermissions(user as SessionUser);
                      const isUpdating = updatingUserId === user.id;
                      return (
                      <div key={user.id} className="grid grid-cols-9 gap-4 p-3 border-b border-gray-800/50 text-sm items-center">
                        <div className="text-gray-200 break-all">{user.email}</div>
                        <select
                          value={user.subscriptionPlan || 'NONE'}
                          disabled={isUpdating}
                          onChange={(e) => {
                            handleUserAccessUpdate(user.id, { subscriptionPlan: e.target.value });
                          }}
                          className="bg-[#111] border border-gray-700 rounded p-1 text-xs text-white"
                        >
                          <option value="NONE">NONE</option>
                          <option value="bourse">bourse</option>
                          <option value="crypto">crypto</option>
                          <option value="combo">combo</option>
                          {user.isAdmin && <option value="ADMIN">ADMIN</option>}
                        </select>
                        <select
                          value={user.subscriptionStatus || 'NONE'}
                          disabled={isUpdating}
                          onChange={(e) => {
                            handleUserAccessUpdate(user.id, { subscriptionStatus: e.target.value });
                          }}
                          className="bg-[#111] border border-gray-700 rounded p-1 text-xs text-white"
                        >
                          <option value="NONE">NONE</option>
                          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PAST_DUE">PAST_DUE</option>
                          <option value="CANCELED">CANCELED</option>
                          {user.isAdmin && <option value="ADMIN">ADMIN</option>}
                        </select>
                        <div className={userPermissions.vipAccess ? 'text-green-400' : 'text-gray-500'}>{userPermissions.vipAccess ? 'Actif' : 'Non'}</div>
                        <div className={user.isAdmin ? 'text-primary' : 'text-gray-500'}>{user.isAdmin ? 'Oui' : 'Non'}</div>
                        <div className={user.emailVerified ? 'text-green-400' : 'text-yellow-400'}>{user.emailVerified ? 'Oui' : 'Non'}</div>
                        <div className={user.needsOnboarding ? 'text-yellow-400' : 'text-gray-500'}>{user.needsOnboarding ? 'À faire' : 'OK'}</div>
                        <div className="text-gray-400 text-xs">{formatDateLabel(user.createdAt)}</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUserAccessUpdate(user.id, { manualVipAccess: !user.manualVipAccess })}
                            className="text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-200 hover:text-white disabled:opacity-50"
                          >
                            VIP manuel
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUserAccessUpdate(user.id, { emailVerified: !user.emailVerified })}
                            className="text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-200 hover:text-white disabled:opacity-50"
                          >
                            Email
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'REVIEWS' ? (
            <div className="p-6 overflow-y-auto h-full">
               <h3 className="text-lg font-bold mb-4 text-white">Modération des Avis</h3>
               <div className="space-y-4">
                  {reviews.filter(r => r.status === 'PENDING').length === 0 ? (
                     <p className="text-gray-500 text-center py-12">Aucun avis en attente.</p>
                  ) : (
                     reviews.filter(r => r.status === 'PENDING').map(r => {
                        const safeVideoUrl = r.videoUrl && isSafeExternalUrl(r.videoUrl) ? r.videoUrl : null;
                       return (
                        <div key={r.id} className="bg-black border border-gray-800 p-4 rounded-lg flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="font-bold text-white">{r.author}</span>
                                 <div className="flex">{[...Array(r.rating)].map((_,i) => <Star key={i} size={10} fill="white"/>)}</div>
                                 <span className="text-xs text-gray-500 bg-gray-900 px-1 rounded">{r.type}</span>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{r.content}</p>
                              {r.analysis && (
                                <p className="text-xs text-gray-400 mb-2 border-l border-yellow-500/40 pl-3">{r.analysis}</p>
                              )}
                              {safeVideoUrl && <a href={safeVideoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Video size={10}/> Voir Vidéo</a>}
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => onReviewAction(r.id, 'APPROVED')} className="p-2 bg-green-900/30 text-green-500 rounded hover:bg-green-900/50"><Check size={16}/></button>
                              <button onClick={() => onReviewAction(r.id, 'REJECTED')} className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50"><X size={16}/></button>
                           </div>
                        </div>
                     )})
                  )}
               </div>
            </div>
          ) : (
            /* --- CONTENT GENERATOR TAB --- */
            <div className="p-6 overflow-y-auto h-full">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-black border border-gray-800 rounded-lg p-5">
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setMode('BLOG')}
                      className={`flex-1 py-3 border rounded flex items-center justify-center gap-2 ${mode === 'BLOG' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-400 border-gray-700'}`}
                    >
                      <BookOpen size={16} /> Article Blog Auto
                    </button>
                    <button 
                      onClick={() => setMode('TRADE')}
                      className={`flex-1 py-3 border rounded flex items-center justify-center gap-2 ${mode === 'TRADE' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-400 border-gray-700'}`}
                    >
                      <TrendingUp size={16} /> Signal Trade IA
                    </button>
                  </div>

                  {!generatedPreview ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase">Sujet / Contexte / Setup</label>
                        <textarea 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder={mode === 'BLOG' ? "Ex: L'impact de l'inflation sur Bitcoin..." : "Ex: LONG BTC Entry 65k, SL 64k, TP 68k. Analyse bullish..."}
                          className="w-full h-32 bg-[#111] border border-gray-700 rounded p-4 text-white focus:border-primary focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                        className="w-full bg-gray-800 text-white font-bold py-4 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <><Bot /> GÉNÉRER LE CONTENU</>}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-surface p-4 rounded border border-gray-700">
                        <h3 className="font-bold text-lg mb-2 text-white">{generatedPreview.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{generatedPreview.excerpt}</p>
                        <div className="flex gap-2">
                          {generatedPreview.tags?.map(t => <span key={t} className="text-xs bg-black px-2 py-1 rounded text-gray-500">#{t}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setGeneratedPreview(null)} className="flex-1 py-3 border border-gray-600 rounded text-gray-400 hover:text-white">Rejeter</button>
                        <button onClick={handlePublishConfirm} className="flex-1 py-3 bg-primary text-black font-bold rounded hover:bg-primary-dark">Publier</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-black border border-gray-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">Publication manuelle</h3>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-gray-400 inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rssPublishNow}
                          onChange={(e) => setRssPublishNow(e.target.checked)}
                        />
                        Publier directement
                      </label>
                      <button
                        onClick={handleGenerateRssDrafts}
                        disabled={generatingRssDrafts}
                        className="text-xs px-3 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-60"
                      >
                        {generatingRssDrafts ? 'Generation...' : rssPublishNow ? 'Importer 5 RSS (publies)' : 'Importer 5 brouillons RSS'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase">Edition sans code</label>
                    <select
                      value={selectedPostId}
                      onChange={(e) => loadPostIntoEditor(e.target.value)}
                      className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white"
                    >
                      <option value="">Nouvelle publication</option>
                      {posts.map((post) => (
                        <option key={post.id} value={post.id}>
                          [{String(post.publicationStatus || 'PUBLISHED').toUpperCase() === 'DRAFT' ? 'BROUILLON' : 'PUBLIE'} · {inferManualPublishTargetFromPost(post) === 'BLOG' ? 'BLOG' : inferManualPublishTargetFromPost(post) === 'CRYPTO' ? 'SIGNAL CRYPTO' : 'SIGNAL BOURSE'}] {post.title}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => setManualPublishTarget('BLOG')}
                        className={`py-2 px-3 rounded border text-sm font-bold transition-colors ${manualPublishTarget === 'BLOG' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'}`}
                      >
                        Publier blog
                      </button>
                      <button
                        onClick={() => setManualPublishTarget('BOURSE')}
                        className={`py-2 px-3 rounded border text-sm font-bold transition-colors ${manualPublishTarget === 'BOURSE' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'}`}
                      >
                        Publier partie bourse
                      </button>
                      <button
                        onClick={() => setManualPublishTarget('CRYPTO')}
                        className={`py-2 px-3 rounded border text-sm font-bold transition-colors ${manualPublishTarget === 'CRYPTO' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'}`}
                      >
                        Publier partie crypto
                      </button>
                    </div>
                  </div>
                  <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} placeholder="Titre" className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <textarea value={editorExcerpt} onChange={(e) => setEditorExcerpt(e.target.value)} placeholder="Résumé court" className="w-full h-24 bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} placeholder="Contenu complet / notes du jour" className="w-full h-40 bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <input value={editorTags} onChange={(e) => setEditorTags(e.target.value)} placeholder="Tags séparés par des virgules" className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-white" />
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editorLocked} onChange={(e) => setEditorLocked(e.target.checked)} />
                    Contenu réservé VIP
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={editorDraft} onChange={(e) => setEditorDraft(e.target.checked)} />
                    Brouillon admin (non publié)
                  </label>
                  <button onClick={handleManualPublish} className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200">
                    {selectedPostId
                      ? 'Mettre a jour sans coder'
                      : manualPublishTarget === 'BLOG'
                        ? 'Publier blog'
                        : manualPublishTarget === 'BOURSE'
                          ? 'Publier partie bourse'
                          : 'Publier partie crypto'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MISSING COMPONENTS IMPLEMENTATION ---

const PostCard: React.FC<{ post: Post }> = ({ post }) => (
  <div className="bg-surface border border-gray-800 rounded-xl p-6 mb-6 hover:border-gray-700 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="flex gap-2">
        {post.type === ContentType.TRADE_SIGNAL && <span className="bg-primary/20 text-primary text-[10px] px-2 py-1 rounded font-bold border border-primary/30 tracking-wider">SIGNAL VIP</span>}
        {post.type === ContentType.ARTICLE && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded font-bold border border-blue-500/30 tracking-wider">BLOG</span>}
        <span className="text-gray-500 text-xs py-1 flex items-center gap-1"><Calendar size={12}/> {post.date}</span>
      </div>
      {post.isLocked && <Lock className="w-4 h-4 text-gray-500" />}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{post.excerpt}</p>
    <div className="flex gap-2 mb-4">
      {post.tags.map(tag => (
        <span key={tag} className="text-[10px] bg-gray-900 text-gray-500 px-2 py-1 rounded border border-gray-800">#{tag}</span>
      ))}
    </div>
    
    {post.tradeDetails && !post.isLocked && (
       <div className="bg-black/30 rounded p-4 border border-gray-800 mb-4">
          <div className="flex justify-between items-center mb-2">
             <span className="font-bold text-white">{post.tradeDetails.asset}</span>
             <span className={`text-xs font-bold px-2 py-0.5 rounded ${post.tradeDetails.direction === 'LONG' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{post.tradeDetails.direction}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
             <div>
                <span className="text-gray-500 block">Entry</span>
                <span className="font-mono text-gray-300">{post.tradeDetails.levels.entry}</span>
             </div>
             <div>
                <span className="text-gray-500 block">Target</span>
                <span className="font-mono text-green-400">{post.tradeDetails.levels.exit}</span>
             </div>
             <div>
                <span className="text-gray-500 block">Stop</span>
                <span className="font-mono text-red-400">{post.tradeDetails.levels.stopLoss}</span>
             </div>
          </div>
       </div>
    )}

    {post.isLocked && (
       <div className="bg-gray-900/50 rounded p-4 border border-gray-800 border-dashed text-center">
          <Lock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Contenu réservé aux membres VIP</p>
       </div>
    )}
  </div>
);

// --- NEW COMPONENTS: PROFILE & FREE TRAINING ---

const ProfileCard = () => (
  <div className="bg-surface border border-gray-800 rounded-xl p-6 mb-6">
     <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
           <User size={32} className="text-gray-300"/> {/* Placeholder for pfp */}
        </div>
        <div>
           <h3 className="font-bold text-white text-lg">L'Analyste</h3>
           <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">En poste salle des marchés</span>
        </div>
     </div>
     <p className="text-sm text-gray-400 leading-relaxed mb-4">
        Chaque jour, vous recevez un plan clair : contexte, niveau d'entrée, stop loss, objectif et taille de position.
        <br/><br/>
        Vous gagnez du temps, vous évitez les trades au hasard et vous suivez une méthode simple pour exécuter avec plus de discipline.
     </p>
     <div className="flex gap-2 text-xs font-mono text-gray-500">
        <span>Créé en 2025</span> • <span>Paris</span>
     </div>
  </div>
);

const FreeTrainingCard = ({ onClick }: { onClick: () => void }) => (
  <div className="bg-gradient-to-br from-gray-900 to-black border border-primary/30 rounded-xl p-6 mb-6 relative overflow-hidden group">
     <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-1">OFFERT</div>
     <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
        <GraduationCap className="text-primary" /> Starter Kit
     </h3>
     <p className="text-sm text-gray-400 mb-4">
        Ne risquez pas un centime avant de maîtriser ces 3 concepts. Accès immédiat au module "Survie".
     </p>
     <button onClick={onClick} className="w-full bg-white text-black font-bold py-2 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
        <Play size={14} fill="black" /> Visionner (15min)
     </button>
  </div>
);

const TrustSignalsPanel = () => (
  <div className="bg-[#070b08] border border-primary/30 rounded-xl p-6 mb-10">
    <div className="flex items-center gap-2 mb-4">
      <ShieldCheck className="text-primary" size={18} />
      <h3 className="text-lg font-bold text-white">Cadre de confiance</h3>
    </div>
    <div className="grid md:grid-cols-4 gap-3 text-sm">
      <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">Éducatif</p>
        <p className="text-gray-400">Contenu pédagogique, aucun conseil financier personnalisé.</p>
      </div>
      <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">Méthodologie</p>
        <p className="text-gray-400">Chaque signal suit la même structure : entrée, invalidation, cible, contexte.</p>
      </div>
      <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">Transparence</p>
        <p className="text-gray-400">Journal d'exécution, revue des erreurs et progression dans la Black Academy.</p>
      </div>
      <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">Paiement clair</p>
        <p className="text-gray-400">Paiement par carte bancaire ou crypto, abonnement mensuel, annulation à tout moment.</p>
      </div>
    </div>
  </div>
);

const MethodologyProofPanel = () => (
  <div className="bg-surface border border-gray-800 rounded-xl p-6 mb-12">
    <h3 className="text-xl font-bold text-white mb-4">Comment nous construisons un signal</h3>
    <div className="grid md:grid-cols-4 gap-4 text-sm mb-5">
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">1. Contexte</p>
        <p className="text-gray-400">Lecture macro + structure du marche.</p>
      </div>
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">2. Plan</p>
        <p className="text-gray-400">Entree, stop, take profit, R:R cible.</p>
      </div>
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">3. Execution</p>
        <p className="text-gray-400">Discipline, taille de position et invalidation.</p>
      </div>
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <p className="text-primary font-bold mb-1">4. Revue</p>
        <p className="text-gray-400">Journal post-trade, erreurs, ajustements.</p>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-3 text-xs">
      <div className="bg-primary/10 border border-primary/30 rounded p-3 text-primary font-bold">Evidence produit: Dashboard VIP observable</div>
      <div className="bg-primary/10 border border-primary/30 rounded p-3 text-primary font-bold">Evidence produit: Black Academy complete</div>
      <div className="bg-primary/10 border border-primary/30 rounded p-3 text-primary font-bold">Evidence produit: Flux signaux + analyse marche</div>
    </div>
  </div>
);

const LeadCaptureCard: React.FC<{ onLeadCapture: (email: string) => Promise<boolean>; onOpenSignup: () => void }> = ({ onLeadCapture, onOpenSignup }) => {
  const [email, setEmail] = useState<string>(() => localStorage.getItem(LEAD_STORAGE_KEY) || '');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const submitLead = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      alert('Ajoutez un email valide.');
      return;
    }
    setSubmitting(true);
    const ok = await onLeadCapture(trimmed);
    setSubmitting(false);
    if (ok) {
      setStatusMessage('Lien Starter Kit envoyé par email. Vérifiez votre boîte de réception.');
    } else {
      setStatusMessage("Impossible d'envoyer l'email pour le moment. Réessayez.");
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#09110d] to-black border border-primary/30 rounded-xl p-6 mb-12">
      <h3 className="text-2xl font-bold text-white mb-5">Parcours rapide en 3 étapes</h3>
      <div className="grid md:grid-cols-3 gap-3 mb-5 text-sm">
        <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
          <p className="text-primary font-bold mb-1">Étape 1</p>
          <p className="text-gray-300">Laissez votre email pour recevoir le starter kit.</p>
        </div>
        <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
          <p className="text-primary font-bold mb-1">Étape 2</p>
          <p className="text-gray-300">Créez votre compte gratuit.</p>
        </div>
        <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
          <p className="text-primary font-bold mb-1">Étape 3</p>
          <p className="text-gray-300">Après abonnement, vous accédez à la formation et à toute la zone VIP selon votre plan.</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="flex-1 bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
        />
        <button
          onClick={submitLead}
          disabled={submitting}
          className="bg-primary text-black font-bold px-6 py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {submitting ? 'Envoi...' : 'Recevoir le starter kit'}
        </button>
        <button onClick={onOpenSignup} className="border border-gray-600 text-gray-200 font-bold px-6 py-3 rounded hover:border-white hover:text-white transition-colors">
          Créer un compte gratuit
        </button>
      </div>
      {statusMessage && <p className="text-sm text-gray-300 mt-3">{statusMessage}</p>}
    </div>
  );
};
const Home: React.FC<{
  onSubscribe: () => void;
  onSelectPlan: (plan: Plan) => void;
  posts: Post[];
  onOpenTraining: () => void;
  showTrainingNudge: boolean;
  onLeadCapture: (email: string) => Promise<boolean>;
  onOpenSignup: () => void;
}> = ({ onSubscribe, onSelectPlan, posts, onOpenTraining, showTrainingNudge, onLeadCapture, onOpenSignup }) => {
  return (
    <div>
      <MarketMarquee />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <InsiderFeed />

        <div className="mb-12 py-10 border-b border-gray-800">
          <div className="max-w-4xl">
            <p className="text-primary font-mono text-xs mb-3 uppercase tracking-wider">Signaux trading éducatifs</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
              Sachez quoi faire chaque jour sur les marchés
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mb-6">
              Des signaux quotidiens en bourse et en crypto pour arrêter les trades au hasard et suivre un plan clair.
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mb-6">
              Pensé pour les traders débutants et intermédiaires : vous savez quoi regarder, quand agir et quand rester à l'écart.
              Abonnement mensuel à partir de <span className="text-white font-bold">29 €/mois</span>, paiement par carte bancaire ou crypto, annulation à tout moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onSubscribe} className="bg-primary text-black font-bold px-8 py-4 rounded text-lg hover:bg-primary-dark transition-all">
                COMMENCER MAINTENANT
              </button>
              <button onClick={() => { window.location.href = '/sample'; }} className="border border-gray-600 text-gray-200 font-bold px-8 py-4 rounded text-lg hover:border-white hover:text-white transition-colors">
                VOIR UN EXEMPLE RÉEL
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Ce service est éducatif. Aucun conseil financier personnalisé.
            </p>
          </div>
        </div>

        <TrustSignalsPanel />

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-surface border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">1. Ce que vous recevez</h3>
            <p className="text-sm text-gray-400">Signaux structurés : entrée, stop loss, take profit, contexte et journal d'exécution.</p>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">2. Pour qui</h3>
            <p className="text-sm text-gray-400">Débutants et intermédiaires qui veulent une méthode claire, sans promesse irréaliste.</p>
          </div>
          <div className="bg-surface border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">3. Offre mensuelle</h3>
            <p className="text-sm text-gray-400">À partir de 29 €/mois. Paiement par carte bancaire ou crypto. Annulation à tout moment.</p>
          </div>
        </div>

        <LeadCaptureCard onLeadCapture={onLeadCapture} onOpenSignup={onOpenSignup} />

        <div className="bg-black border border-primary/30 rounded-xl p-6 mb-12">
          <h3 className="text-xl font-bold text-white mb-4">Ce que votre abonnement inclut concrètement</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-surface border border-gray-800 rounded p-4">
              <p className="font-bold text-primary mb-1">Signaux actionnables</p>
              <p className="text-gray-400">Plan de trade, niveaux, scénarios et invalidation.</p>
            </div>
            <div className="bg-surface border border-gray-800 rounded p-4">
              <p className="font-bold text-primary mb-1">Black Academy</p>
              <p className="text-gray-400">Formation progressive pour comprendre la logique derrière les décisions.</p>
            </div>
            <div className="bg-surface border border-gray-800 rounded p-4">
              <p className="font-bold text-primary mb-1">Journal et retours</p>
              <p className="text-gray-400">Analyse à froid des trades, erreurs, exécution et ajustements.</p>
            </div>
            <div className="bg-surface border border-gray-800 rounded p-4">
              <p className="font-bold text-primary mb-1">Cadre de risque</p>
              <p className="text-gray-400">Focus sur discipline et protection du capital avant performance.</p>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={onSubscribe} className="w-full md:w-auto bg-primary text-black font-bold px-6 py-3 rounded hover:bg-primary-dark transition-colors">
              DÉBLOQUER L'ABONNEMENT MENSUEL
            </button>
          </div>
        </div>

        <div id="plans" className="bg-surface border border-gray-800 rounded-xl p-6 mb-12">
          <h3 className="text-2xl font-bold text-white mb-2">Choisissez votre formule</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div key={plan.id} className={`rounded-xl border p-5 ${plan.id === 'combo' ? 'border-primary/50 bg-primary/5' : 'border-gray-800 bg-black/30'}`}>
                {plan.id === 'combo' && (
                  <span className="inline-block mb-3 text-[10px] uppercase tracking-wider font-bold bg-primary text-black px-2 py-1 rounded">Meilleur rapport valeur</span>
                )}
                <h4 className="text-lg font-bold text-white mb-1">{plan.name}</h4>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold text-primary mb-4">{plan.price}€<span className="text-sm text-gray-500 font-normal">/mois</span></p>
                <ul className="text-sm text-gray-300 space-y-1 mb-5">
                  <li>• {plan.id === 'crypto' ? 'Accès Dashboard crypto' : plan.id === 'bourse' ? 'Accès Dashboard bourse' : 'Accès à tous les dashboards'}</li>
                  <li>• Black Academy incluse</li>
                  <li>• Annulation à tout moment</li>
                </ul>
                <button onClick={() => onSelectPlan(plan)} className="w-full bg-white text-black font-bold py-2 rounded hover:bg-gray-200 transition-colors">
                  Choisir {plan.price}€
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-mono text-primary"><Activity size={20} /> FLUX RÉCENTS</h2>
            {posts.filter(isPostPublished).map(post => <PostCard key={post.id} post={post} />)}
          </div>
          <div className="md:col-span-1 space-y-6">
             <ProfileCard />
             {showTrainingNudge && (
              <div className="bg-primary/10 border border-primary/40 rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">Formation de démarrage disponible</h3>
                <p className="text-sm text-gray-300 mb-4">Optionnelle, mais recommandée pour bien utiliser les signaux.</p>
                <button onClick={onOpenTraining} className="w-full bg-primary text-black font-bold py-2 rounded hover:bg-primary-dark transition-colors">
                  OUVRIR LA FORMATION
                </button>
              </div>
             )}
             <FreeTrainingCard onClick={() => { window.location.href = '/starter-kit'; }} />
             <NewsSection />
             <RSSFeedWidget />
             <TwitterFeed />
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="bg-surface border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Questions fréquentes avant abonnement</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-white font-bold">Est-ce adapté aux débutants ?</p>
                <p className="text-gray-400">Oui, si vous suivez la formation et respectez la gestion du risque.</p>
              </div>
              <div>
                <p className="text-white font-bold">Est-ce une promesse de gains ?</p>
                <p className="text-gray-400">Non. C'est un service éducatif avec plans de marché et discipline d'exécution.</p>
              </div>
              <div>
                <p className="text-white font-bold">Puis-je annuler facilement ?</p>
                <p className="text-gray-400">Oui. Abonnement mensuel, annulation à tout moment.</p>
              </div>
              <div>
                <p className="text-white font-bold">Qu'est-ce qui est inclus exactement ?</p>
                <p className="text-gray-400">Journal, Black Academy, dashboards et signaux structurés.</p>
              </div>
              <div>
                <p className="text-white font-bold">Pourquoi une grande communauté ?</p>
                <p className="text-gray-400">Vous vous interrogez peut-être quant aux raisons de mon engagement malgré ma position actuelle.  Il est important de préciser que mes actions ne sont pas motivées uniquement par un sentiment de sympathie.  Si la communauté atteint une taille critique et que nous adoptons une position commune, nous pourrons potentiellement influencer favorablement le marché en notre faveur.</p>
              </div>
            </div>
          </div>
          <div className="bg-black border border-primary/30 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Prêt à structurer votre trading ?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Si vous cherchez une méthode claire plutôt qu'un groupe bruyant, cet abonnement est fait pour vous.
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li>• Formules : 29 €, 29 € ou 49 € par mois</li>
                <li>• Niveau : débutant et intermédiaire</li>
                <li>• Focus : méthode, risque, exécution</li>
              </ul>
            </div>
            <button onClick={onSubscribe} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
              JE M'ABONNE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StarterKitPage: React.FC<{ onOpenSignup: () => void; onSubscribe: () => void }> = ({ onOpenSignup, onSubscribe }) => {
  const [activeModule, setActiveModule] = useState<'module-1' | 'module-2'>('module-1');

  const goToPlans = () => {
    window.location.assign('/#plans');
  };

  const modules = {
    'module-1': {
      title: 'Module 1 - Comprendre le jargon',
      intro: 'Objectif : lire un signal sans confusion.',
      points: [
        'SL = Stop Loss : votre invalidation maximale.',
        'TP = Take Profit : zone de prise de bénéfice.',
        'R:R = ratio risque / rendement attendu.',
        'Breakout vs fakeout : vraie cassure ou piège.'
      ],
      exercice: 'Prenez un signal exemple et identifiez : entrée, SL, TP et R:R.'
    },
    'module-2': {
      title: 'Module 2 - Choisir votre plateforme',
      intro: 'Objectif : éviter les mauvaises plateformes et les frais cachés.',
      points: [
        'Vérifiez la régulation et l’entité légale.',
        'Comparez spreads, commissions et frais de retrait.',
        'Testez l’exécution en volatilité.',
        'Activez le 2FA avant tout dépôt.'
      ],
      exercice: 'Comparez 2 plateformes et gardez celle avec exécution stable + frais clairs.'
    }
  } as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Starter Kit</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Parcours de demarrage trading (gratuit)</h1>
        <p className="text-gray-400 max-w-3xl">
          Ce kit vous donne une base claire avant toute prise de risque : vocabulaire, plateformes, routine quotidienne et premier exercice pratique.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-surface border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Parcours debutant en 4 etapes</h2>
          <div className="space-y-3 text-sm">
            <div id="module-1" className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-primary font-bold mb-1">Etape 1 - Comprendre le jargon</p>
                  <p className="text-gray-300">Module gratuit, immédiatement accessible.</p>
                </div>
                <button
                  onClick={() => setActiveModule('module-1')}
                  className={`px-4 py-2 rounded font-bold text-xs transition-colors ${activeModule === 'module-1' ? 'bg-primary text-black' : 'border border-gray-600 text-gray-200 hover:border-white hover:text-white'}`}
                  aria-pressed={activeModule === 'module-1'}
                >
                  Ouvrir le module
                </button>
              </div>
            </div>

            <div id="module-2" className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-primary font-bold mb-1">Etape 2 - Choisir votre plateforme</p>
                  <p className="text-gray-300">Module gratuit, immédiatement accessible.</p>
                </div>
                <button
                  onClick={() => setActiveModule('module-2')}
                  className={`px-4 py-2 rounded font-bold text-xs transition-colors ${activeModule === 'module-2' ? 'bg-primary text-black' : 'border border-gray-600 text-gray-200 hover:border-white hover:text-white'}`}
                  aria-pressed={activeModule === 'module-2'}
                >
                  Ouvrir le module
                </button>
              </div>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-primary font-bold mb-1">Etape 3 - Regles de risque de base</p>
                  <p className="text-gray-300">Module réservé aux abonnés.</p>
                </div>
                <button
                  onClick={goToPlans}
                  className="px-4 py-2 rounded font-bold text-xs bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  Débloquer <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-primary font-bold mb-1">Etape 4 - Routine quotidienne</p>
                  <p className="text-gray-300">Module réservé aux abonnés.</p>
                </div>
                <button
                  onClick={goToPlans}
                  className="px-4 py-2 rounded font-bold text-xs bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  Débloquer <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-primary/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Module actif</h3>
          <p className="text-sm text-gray-400 mb-4">{modules[activeModule].intro}</p>
          <h4 className="text-white font-bold mb-3">{modules[activeModule].title}</h4>
          <ul className="text-sm text-gray-300 space-y-2 mb-5">
            {modules[activeModule].points.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
          <div className="bg-black/50 border border-gray-800 rounded p-3 text-xs text-gray-300 mb-5">
            <span className="text-primary font-bold">Exercice pratique :</span> {modules[activeModule].exercice}
          </div>
          <button onClick={onOpenSignup} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
            Créer un compte gratuit
          </button>
        </div>
      </div>

      <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Comment choisir sa plateforme de trading</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#111] text-gray-500 uppercase text-xs">
              <tr>
                <th className="p-3">Critere</th>
                <th className="p-3">A verifier</th>
                <th className="p-3">Signal d alerte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="p-3 text-white">Regulation</td>
                <td className="p-3 text-gray-300">Licence claire, entite legale, documents accessibles</td>
                <td className="p-3 text-red-400">Aucune info legale publique</td>
              </tr>
              <tr>
                <td className="p-3 text-white">Frais</td>
                <td className="p-3 text-gray-300">Spreads, commissions, frais de retrait</td>
                <td className="p-3 text-red-400">Frais caches ou imprécis</td>
              </tr>
              <tr>
                <td className="p-3 text-white">Execution</td>
                <td className="p-3 text-gray-300">Stabilite, latence, disponibilite mobile/desktop</td>
                <td className="p-3 text-red-400">Freeze frequent en volatilite</td>
              </tr>
              <tr>
                <td className="p-3 text-white">Securite compte</td>
                <td className="p-3 text-gray-300">2FA, alertes connexion, gestion devices</td>
                <td className="p-3 text-red-400">Pas de 2FA ou options limitees</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6">
        <div id="starter-video" className="bg-black border border-gray-800 rounded-2xl overflow-hidden">
          <div className="aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube-nocookie.com/embed/8fH7Z5vFd0A"
              title="Starter kit trading - choix de plateforme"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          </div>
          <div className="p-3 border-t border-gray-800 text-xs">
            <a href="https://www.youtube.com/watch?v=8fH7Z5vFd0A" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white">
              Ouvrir la vidéo directement sur YouTube
            </a>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#08140f] to-black border border-primary/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">Suite du parcours</h3>
          <p className="text-sm text-gray-300 mb-4">
            Une fois les 2 modules gratuits terminés, vous débloquez le reste de la formation via la formule adaptée (Bourse, Crypto ou Combo).
          </p>
          <div className="space-y-3 text-sm text-gray-300 mb-6">
            <div className="bg-black/40 border border-gray-800 rounded p-3">1. Créer un compte</div>
            <div className="bg-black/40 border border-gray-800 rounded p-3">2. Terminer les modules 1 et 2</div>
            <div className="bg-black/40 border border-gray-800 rounded p-3">3. Choisir la formule à souscrire</div>
          </div>
          <button onClick={goToPlans} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
            Voir les formules
          </button>
          <button onClick={onSubscribe} className="w-full mt-3 border border-gray-600 text-gray-200 font-bold py-3 rounded hover:border-white hover:text-white transition-colors">
            Ouvrir la modale d abonnement
          </button>
        </div>
      </div>

    </div>
  );
};

const Blog: React.FC<{ posts: Post[] }> = ({ posts }) => {
  const articles = posts.filter((p) => p.type === ContentType.ARTICLE && isPostPublished(p));
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
         <div className="bg-blue-500/10 p-3 rounded-full text-blue-400"><BookOpen size={24}/></div>
         <div>
            <h1 className="text-3xl font-bold">Journal de Bord</h1>
            <p className="text-gray-400 text-sm">Réflexions macro et analyses de fond.</p>
         </div>
      </div>
      <div className="space-y-6">
        <AutoNewsFeed />
        <LiveStocksTable />
        {articles.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
};

const SamplePage: React.FC<{ onSubscribe: () => void; reviews: Review[] }> = ({ onSubscribe }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Signal du 01/02/2026</h1>
        <p className="text-gray-400">
          Exemple pédagogique de présentation VIP avec plan d exécution complet.
        </p>
      </div>

      <div className="bg-surface border border-primary/40 rounded-xl p-6 md:p-8 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-gray-700 text-gray-300 bg-black/40">Marché : Crypto</span>
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-green-500/30 text-green-300 bg-green-500/10">Direction : Long</span>
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-gray-700 text-gray-300 bg-black/40">Actif : BTC/USD</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Entrée</p>
            <p className="text-xl font-bold text-white">42 180</p>
          </div>
          <div className="bg-black/40 border border-red-500/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Stop Loss</p>
            <p className="text-xl font-bold text-red-400">41 520</p>
          </div>
          <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Take Profit 1</p>
            <p className="text-xl font-bold text-primary">42 960</p>
          </div>
          <div className="bg-black/40 border border-primary/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Take Profit 2</p>
            <p className="text-xl font-bold text-primary">43 540</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-primary mb-2">Plan de gestion</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Risque max : 1 % du capital</li>
              <li>• Taille position : 2.5x spot équivalent</li>
              <li>• Passage break-even après TP1 validé</li>
              <li>• R:R cible global : 1:2.6</li>
            </ul>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-primary mb-2">Invalidation</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Clôture 1H sous 41 520</li>
              <li>• Volume vendeur supérieur à la moyenne 20 périodes</li>
              <li>• Perte du support 41 700 sans réaction acheteuse</li>
            </ul>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-primary mb-2">Résumé de l analyse</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Le signal est construit sur un retest de zone support 41 700 - 41 900, avec reprise de momentum sur RSI 15m et
            maintien d une structure haussière en 4H. Le scénario principal vise une extension vers 42 960 puis 43 540.
            Si le marché casse le support avec pression vendeuse, le plan est invalidé immédiatement.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-blue-500/40 rounded-xl p-6 md:p-8 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-gray-700 text-gray-300 bg-black/40">Marché : Bourse</span>
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-red-500/30 text-red-300 bg-red-500/10">Direction : Short</span>
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-gray-700 text-gray-300 bg-black/40">Actif : NAS100</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Entrée</p>
            <p className="text-xl font-bold text-white">18 460</p>
          </div>
          <div className="bg-black/40 border border-red-500/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Stop Loss</p>
            <p className="text-xl font-bold text-red-400">18 610</p>
          </div>
          <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Take Profit 1</p>
            <p className="text-xl font-bold text-blue-300">18 250</p>
          </div>
          <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Take Profit 2</p>
            <p className="text-xl font-bold text-blue-300">18 080</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Plan de gestion</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Risque max : 0.75 % du capital</li>
              <li>• Exécution fractionnée en 2 entrées</li>
              <li>• Réduction de 50 % de la position sur TP1</li>
              <li>• R:R cible global : 1:2.5</li>
            </ul>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Invalidation</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Clôture 15m au-dessus de 18 610</li>
              <li>• Réintégration durable au-dessus de la zone 18 550</li>
              <li>• Reprise haussière avec accélération des volumes cash</li>
            </ul>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Résumé de l analyse</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Setup short basé sur un rejet net de la résistance intraday 18 540 - 18 580, avec divergence baissière RSI en 5m
            et perte de momentum sur les futures US. Le scénario privilégie une extension vers 18 250 puis 18 080.
            En cas de reprise solide au-dessus de 18 610, le plan est invalidé sans exception.
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-400 mb-4">Accédez à la zone VIP pour suivre tous les signaux complets et leurs mises à jour.</p>
        <button onClick={onSubscribe} className="bg-primary text-black font-bold px-8 py-3 rounded hover:bg-primary-dark transition-all">
          Débloquer l'accès VIP
        </button>
      </div>
    </div>
  );
};

const AffiliatePage: React.FC<{ currentUser: SessionUser | null; onOpenLogin: () => void }> = ({ currentUser, onOpenLogin }) => {
  const [affiliateLink, setAffiliateLink] = useState<{ referralCode: string; referralUrl: string; crmSource: string; ownerEmail: string } | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const referrals = currentUser?.affiliateProfile?.referrals || [];
  const commissionHistory = currentUser?.affiliateProfile?.commissionHistory || [];
  const totalLocked = commissionHistory.filter((item) => item.status === 'LOCKED').reduce((acc, item) => acc + item.amount, 0);
  const totalAvailable = commissionHistory.filter((item) => item.status === 'READY_TO_PAY').reduce((acc, item) => acc + item.amount, 0);
  const totalPaid = commissionHistory.filter((item) => item.status === 'PAID').reduce((acc, item) => acc + item.amount, 0);

  const loadAffiliateLink = async (regenerate: boolean) => {
    if (!currentUser) return;
    setIsLoadingLink(true);
    setLinkError('');
    try {
      const res = await apiFetch('/api/affiliate/link', {
        method: regenerate ? 'POST' : 'GET',
        headers: regenerate ? { 'Content-Type': 'application/json' } : undefined,
        body: regenerate ? JSON.stringify({ regenerate: true }) : undefined
      });
      const data = await res.json();
      if (!res.ok || !data?.referralCode || !data?.referralUrl) {
        throw new Error(data?.error || 'affiliate_link_unavailable');
      }
      setAffiliateLink({
        referralCode: String(data.referralCode),
        referralUrl: String(data.referralUrl),
        crmSource: String(data.crmSource || ''),
        ownerEmail: String(data.ownerEmail || currentUser.email)
      });
    } catch {
      setLinkError("Impossible de générer le lien d'affiliation pour le moment.");
    } finally {
      setIsLoadingLink(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setAffiliateLink(null);
      return;
    }
    void loadAffiliateLink(false);
  }, [currentUser?.id]);

  const handleCopyLink = async () => {
    if (!affiliateLink?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(affiliateLink.referralUrl);
      setCopyStatus('Lien copié.');
    } catch {
      setCopyStatus('Copie impossible sur ce navigateur.');
    }
    window.setTimeout(() => setCopyStatus(''), 2500);
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-surface border border-gray-800 rounded-xl p-8 text-center">
          <Handshake className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Espace partenaires</h1>
          <p className="text-gray-400 mb-6">Connectez-vous pour générer votre lien d'affiliation et suivre vos filleuls.</p>
          <button onClick={onOpenLogin} className="bg-primary text-black font-bold px-6 py-3 rounded hover:bg-primary-dark transition-colors">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Handshake className="w-14 h-14 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-3 text-white">Espace partenaires</h1>
        <p className="text-gray-400">Lien d'affiliation unique, suivi des filleuls et visibilité du mode de commission (crypto interne ou Lemon externe).</p>
      </div>

      <div className="bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-500/30 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">Votre lien d'affiliation</h3>
        <div className="bg-black p-3 rounded border border-gray-800 flex items-center justify-between gap-2 font-mono text-xs mb-3">
          <span className="text-gray-300 truncate">{affiliateLink?.referralUrl || 'Génération en cours...'}</span>
          <button onClick={handleCopyLink} disabled={!affiliateLink?.referralUrl} className="text-yellow-500 hover:text-white flex items-center gap-1 text-xs font-bold disabled:opacity-40">
            <Copy size={12} /> Copier
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => {
              void loadAffiliateLink(true);
            }}
            disabled={isLoadingLink}
            className="bg-yellow-500 text-black font-bold px-4 py-2 rounded text-sm hover:bg-yellow-400 disabled:opacity-50"
          >
            {isLoadingLink ? 'Génération...' : 'Régénérer le lien'}
          </button>
          {affiliateLink?.referralCode && <span className="text-xs text-gray-300">Code : <span className="font-bold text-white">{affiliateLink.referralCode}</span></span>}
          {affiliateLink?.ownerEmail && <span className="text-xs text-gray-400">Compte lié : {affiliateLink.ownerEmail}</span>}
          {affiliateLink?.crmSource && <span className="text-xs text-gray-400">Source CRM : {affiliateLink.crmSource}</span>}
          {copyStatus && <span className="text-xs text-primary">{copyStatus}</span>}
        </div>
        {linkError && <p className="text-xs text-red-400 mt-3">{linkError}</p>}
        <p className="text-xs text-gray-400 mt-4">
          Les leads capturés via ce lien remontent dans le CRM avec le code parrain et l'email du partenaire.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-gray-800 p-5 rounded-xl">
          <p className="text-xs text-gray-500 uppercase">Commissions bloquées</p>
          <p className="text-3xl font-bold text-gray-200 mt-2">{totalLocked.toFixed(2)}€</p>
        </div>
        <div className="bg-surface border border-primary/40 p-5 rounded-xl">
          <p className="text-xs text-gray-500 uppercase">Commissions prêtes</p>
          <p className="text-3xl font-bold text-primary mt-2">{totalAvailable.toFixed(2)}€</p>
        </div>
        <div className="bg-surface border border-gray-800 p-5 rounded-xl">
          <p className="text-xs text-gray-500 uppercase">Total payé</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{totalPaid.toFixed(2)}€</p>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-800 bg-[#0f0f0f]">
          <h3 className="font-bold text-white">Filleuls rattachés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#111] text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-3">Pseudo</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Abonnement</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Commission</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Relance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {referrals.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={7}>Aucun filleul pour le moment.</td>
                </tr>
              ) : referrals.map((referral) => (
                <tr key={referral.id}>
                  <td className="p-3 text-gray-200">{referral.pseudo}</td>
                  <td className="p-3 text-gray-300">{formatPlanLabel(referral.subscriptionPlan)}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <span className={referral.subscriptionActive ? 'text-green-400 font-bold' : 'text-gray-300'}>
                        {referral.subscriptionActive ? 'Actif' : 'Inactif'}
                      </span>
                      <p className="text-[11px] text-gray-500">{formatSubscriptionStatusLabel(referral.subscriptionStatus || 'NONE')}</p>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300">{formatPaymentProviderLabel(referral.paymentProvider)}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <span className="text-primary font-bold">{Number(referral.commissionAmount || 0).toFixed(2)}€</span>
                      <p className="text-[11px] text-gray-500">
                        {(() => {
                          const commissionModel = String(referral.commissionModel || '').toUpperCase();
                          if (commissionModel === 'LEMON_AFFILIATE_EXTERNAL') return 'Géré par Lemon';
                          if (commissionModel === 'LEMON_CARD_INTERNAL_DISABLED') return 'Pas de partage interne';
                          return formatCommissionStatus(referral.commissionStatus);
                        })()}
                      </p>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300">{formatCommissionModelLabel(referral.commissionModel)}</td>
                  <td className="p-3 text-gray-300">{formatFollowUpLabel(referral.followUpRequired, referral.paymentProvider)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-[#0f0f0f]">
          <h3 className="font-bold text-white">Historique des commissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-3">Source</th>
                <th className="p-3">Date</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Méthode</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {commissionHistory.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>Aucune commission enregistrée.</td>
                </tr>
              ) : commissionHistory.map((commission) => (
                <tr key={commission.id}>
                  <td className="p-3 text-gray-200">{commission.sourceUser}</td>
                  <td className="p-3 text-gray-400">{commission.dateCreated}</td>
                  <td className="p-3 text-primary font-bold">{commission.amount.toFixed(2)}€</td>
                  <td className="p-3 text-gray-300">{commission.payoutMethod}</td>
                  <td className="p-3 text-gray-300">{formatCommissionStatus(commission.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ isSubscribed: boolean, onSubscribe: (plan: any) => void, posts: Post[] }> = ({ isSubscribed, onSubscribe, posts }) => {
    const [vipActivity, setVipActivity] = useState<VipActivitySnapshot | null>(null);
    const [vipActivityLoading, setVipActivityLoading] = useState(false);

    useEffect(() => {
      if (!isSubscribed) return;
      let isMounted = true;

      const loadVipActivity = async () => {
        setVipActivityLoading(true);
        try {
          const response = await apiFetch('/api/vip/activity');
          const data = await response.json();
          if (!isMounted || !response.ok) return;
          setVipActivity(data);
        } catch {
          if (!isMounted) return;
        } finally {
          if (isMounted) {
            setVipActivityLoading(false);
          }
        }
      };

      loadVipActivity();
      const interval = window.setInterval(loadVipActivity, 60000);
      return () => {
        isMounted = false;
        window.clearInterval(interval);
      };
    }, [isSubscribed]);

    if (!isSubscribed) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                   <Lock className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Accès Restreint</h2>
                <p className="text-gray-400 mb-8 text-lg">
                   Cette section contient mon journal de trading en temps réel, mon portfolio, et l'accès à la Black Academy.
                </p>
                <button onClick={() => onSubscribe({ id: 'combo', name: 'Pack Complet', price: 49, description: 'Crypto + Bourse' })} className="bg-primary text-black font-bold px-8 py-4 rounded hover:bg-primary-dark transition-all flex items-center gap-2">
                   <Unlock size={18} /> Débloquer l'Accès Immédiat
                </button>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
               <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
               Tableau de Bord
            </h1>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => { window.location.href = '/signals'; }}
                  className="text-left bg-gradient-to-br from-[#08140f] to-black border border-primary/30 rounded-xl p-5 hover:border-primary/60 transition-colors"
                >
                  <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Section VIP</div>
                  <h2 className="text-xl font-bold text-white mb-2">Trades Quotidiens</h2>
                  <p className="text-sm text-gray-400">
                    Accedez aux signaux du jour, a la table d execution et a l analyse de marche reservee aux membres actifs.
                  </p>
                </button>
                <div className="bg-surface border border-gray-800 rounded-xl p-5">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Acces</div>
                  <h2 className="text-xl font-bold text-white mb-2">Statut VIP</h2>
                  <p className="text-sm text-green-400 font-bold">Actif</p>
                  <p className="text-sm text-gray-400 mt-2">Les accès actifs dépendent de votre plan (Bourse, Crypto, Combo) ou d'un accès VIP manuel admin.</p>
                </div>
                <div className="bg-surface border border-gray-800 rounded-xl p-5">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Activite VIP</div>
                  <h2 className="text-xl font-bold text-white mb-2">Membres & connexions</h2>
                  <p className="text-sm text-gray-400">
                    {vipActivityLoading && !vipActivity ? "Chargement des metriques..." : `Fenetre active: ${vipActivity?.windowMinutes || 15} min`}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/40 border border-gray-800 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">VIP</div>
                      <div className="text-white font-bold">{vipActivity?.totalVipMembers ?? '--'}</div>
                    </div>
                    <div className="bg-black/40 border border-gray-800 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">Actifs</div>
                      <div className="text-green-400 font-bold">{vipActivity?.activeNow ?? '--'}</div>
                    </div>
                    <div className="bg-black/40 border border-gray-800 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">24h</div>
                      <div className="text-primary font-bold">{vipActivity?.active24h ?? '--'}</div>
                    </div>
                  </div>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Academy */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Portfolio Card */}
                    <div className="bg-surface border border-gray-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-primary"/> Performance Globale</h3>
                           <div className="flex gap-2 text-xs font-bold">
                              <span className="bg-gray-800 px-3 py-1 rounded text-white cursor-pointer">1M</span>
                              <span className="bg-black px-3 py-1 rounded text-gray-500 cursor-pointer">3M</span>
                              <span className="bg-black px-3 py-1 rounded text-gray-500 cursor-pointer">YTD</span>
                           </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                           <span className="text-4xl font-bold text-white">$21,450.00</span>
                           <span className="text-green-500 font-bold flex items-center">+12.5% <TrendingUp size={14}/></span>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Capital déployé sur les stratégies actives</p>
                        <PortfolioChart />
                    </div>

                    {/* Academy Module */}
                    <div id="academy" className="bg-surface border border-gray-800 rounded-xl p-6">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold flex items-center gap-2"><GraduationCap className="text-primary"/> Black Academy</h3>
                          <span className="text-xs text-gray-500">Progression: 25%</span>
                       </div>
                       <TradingAcademy />
                    </div>
                </div>

                {/* Right Column: Signals & Alerts */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-gray-800 rounded-xl p-6 h-full flex flex-col">
                       <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-yellow-500"/> Signaux Actifs</h3>
                       <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                          {posts.filter(p => p.type === ContentType.TRADE_SIGNAL).map(post => {
                             const hasUnlockedPayload = Boolean(post.content || post.tradeDetails);
                             return (
                               <div key={post.id} className="border-b border-gray-800 pb-4 last:border-0">
                                  <PostCard post={{ ...post, isLocked: Boolean(post.isLocked && !hasUnlockedPayload) }} />
                               </div>
                             );
                          })}
                       </div>
                       {vipActivity && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Dernieres activites VIP</div>
                          <div className="space-y-2">
                            {vipActivity.recentActivity.slice(0, 4).map((item) => (
                              <div key={item.userId} className="text-xs text-gray-400 bg-black/40 border border-gray-800 rounded p-2 flex items-center justify-between gap-2">
                                <span className="truncate">{item.emailMasked}</span>
                                <span className="text-gray-500">{formatRelativeTime(item.lastSeenAt)}</span>
                              </div>
                            ))}
                            {vipActivity.recentActivity.length === 0 && (
                              <div className="text-xs text-gray-500">Aucune session VIP recente.</div>
                            )}
                          </div>
                        </div>
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OnboardingTrainingGate: React.FC<{ isOpen: boolean, onClose: () => void, onComplete: () => void }> = ({ isOpen, onClose, onComplete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm overflow-y-auto p-4">
      <div className="max-w-5xl mx-auto py-4">
        <div className="bg-surface border border-primary/30 rounded-xl p-6 mb-4 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <GraduationCap className="text-primary" /> Formation de demarrage (optionnelle)
          </h2>
          <p className="text-gray-300 text-sm">
            Recommandee pour les nouveaux abonnes: modules courts + quiz final.
            Vous pouvez la fermer et y revenir plus tard depuis l'accueil.
          </p>
        </div>
        <div className="bg-black border border-gray-800 rounded-xl">
          <TradingAcademy onPassedQuiz={onComplete} />
        </div>
      </div>
    </div>
  );
};

const LoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onResendVerification: (email: string) => void;
  onOpenPasswordReset: (email?: string) => void;
  onOpenSignup: () => void;
  socialProviders: Record<OAuthProvider, boolean>;
  oauthCallbackBaseUrl?: string;
  onSocialAuth: (provider: OAuthProvider, mode: 'login' | 'signup') => void;
}> = ({ isOpen, onClose, onLogin, onResendVerification, onOpenPasswordReset, onOpenSignup, socialProviders, oauthCallbackBaseUrl, onSocialAuth }) => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   if (!isOpen) return null;
   const hasEnabledSocial = Object.values(socialProviders).some(Boolean);
   const callbackHints = buildOAuthCallbackHints(oauthCallbackBaseUrl || '');
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
         <div className="bg-surface border border-gray-700 rounded-xl max-w-sm w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
            
            <div className="space-y-4">
               <div className="space-y-2">
                 <button onClick={() => onSocialAuth('google', 'login')} disabled={!socialProviders.google} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <GoogleIcon />
                   Continuer avec Google
                 </button>
                 <button onClick={() => onSocialAuth('facebook', 'login')} disabled={!socialProviders.facebook} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <FacebookIcon />
                   Continuer avec Facebook
                 </button>
                 <button onClick={() => onSocialAuth('apple', 'login')} disabled={!socialProviders.apple} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <AppleIcon />
                   Continuer avec Apple
                 </button>
                 <button onClick={() => onSocialAuth('linkedin', 'login')} disabled={!socialProviders.linkedin} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <LinkedInIcon />
                   Continuer avec LinkedIn
                 </button>
                 {!hasEnabledSocial && (
                   <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                     <p>Aucun provider social n'est encore configuré côté serveur.</p>
                     {callbackHints.length > 0 && (
                       <div className="mt-2 text-[11px] text-yellow-200/90 space-y-1">
                         {callbackHints.map((hint) => <p key={hint}>{hint}</p>)}
                       </div>
                     )}
                   </div>
                 )}
               </div>
               <div className="flex items-center gap-3 text-xs text-gray-500">
                 <div className="h-px bg-gray-700 flex-1" />
                 <span>Email</span>
                 <div className="h-px bg-gray-700 flex-1" />
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" />
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Mot de passe</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" />
               </div>
               <button
                 onClick={() => onOpenPasswordReset(email)}
                 className="text-left text-xs text-primary hover:underline"
               >
                 Mot de passe oublié ?
               </button>
               <button onClick={() => onLogin(email, password)} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
                  SE CONNECTER
               </button>
               <button
                 onClick={() => onResendVerification(email)}
                 className="w-full border border-gray-700 text-gray-300 font-bold py-2 rounded hover:border-gray-500 hover:text-white transition-colors text-sm"
               >
                 Renvoyer l'email de verification
               </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
               Pas encore membre ? <button onClick={() => { onClose(); onOpenSignup(); }} className="text-white underline hover:text-primary">Créer un compte</button>
            </div>
         </div>
      </div>
   );
};

const ResetPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialToken?: string;
  onRequestReset: (email: string) => Promise<boolean>;
  onResetPassword: (token: string, newPassword: string) => Promise<boolean>;
}> = ({ isOpen, onClose, initialEmail, initialToken, onRequestReset, onResetPassword }) => {
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const nextToken = (initialToken || '').trim();
    setEmail(initialEmail || '');
    setToken(nextToken);
    setNewPassword('');
    setMode(nextToken ? 'reset' : 'request');
  }, [isOpen, initialEmail, initialToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-surface border border-gray-700 rounded-xl max-w-sm w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <h2 className="text-2xl font-bold mb-2 text-center">Réinitialiser le mot de passe</h2>
        <p className="text-xs text-gray-400 text-center mb-6">
          {mode === 'request'
            ? "Entrez votre email pour recevoir un lien de réinitialisation."
            : "Collez le token reçu par email puis définissez un nouveau mot de passe."}
        </p>

        <div className="space-y-4">
          {mode === 'request' ? (
            <>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={async () => {
                  const ok = await onRequestReset(email);
                  if (ok) {
                    setMode('reset');
                  }
                }}
                className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors"
              >
                Envoyer le lien
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Token de réinitialisation</label>
                <input
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={async () => {
                  const ok = await onResetPassword(token, newPassword);
                  if (ok) {
                    onClose();
                  }
                }}
                className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors"
              >
                Mettre à jour le mot de passe
              </button>
            </>
          )}

          <button
            onClick={() => setMode((current) => (current === 'request' ? 'reset' : 'request'))}
            className="w-full border border-gray-700 text-gray-300 font-bold py-2 rounded hover:border-gray-500 hover:text-white transition-colors text-sm"
          >
            {mode === 'request' ? "J'ai déjà un token" : "Revenir à la demande de lien"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SignupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, password: string) => void;
  defaultEmail?: string;
  socialProviders: Record<OAuthProvider, boolean>;
  oauthCallbackBaseUrl?: string;
  onSocialAuth: (provider: OAuthProvider, mode: 'login' | 'signup') => void;
}> = ({ isOpen, onClose, onConfirm, defaultEmail, socialProviders, oauthCallbackBaseUrl, onSocialAuth }) => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');

   useEffect(() => {
    if (!isOpen) return;
    setEmail(defaultEmail || '');
   }, [defaultEmail, isOpen]);

   if (!isOpen) return null;
   const hasEnabledSocial = Object.values(socialProviders).some(Boolean);
   const callbackHints = buildOAuthCallbackHints(oauthCallbackBaseUrl || '');
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
         <div className="bg-surface border border-gray-700 rounded-xl max-w-sm w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold mb-6 text-center">Rejoindre l'Élite</h2>
            
            <div className="space-y-4">
               <div className="space-y-2">
                 <button onClick={() => onSocialAuth('google', 'signup')} disabled={!socialProviders.google} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <GoogleIcon />
                   S'inscrire avec Google
                 </button>
                 <button onClick={() => onSocialAuth('facebook', 'signup')} disabled={!socialProviders.facebook} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <FacebookIcon />
                   S'inscrire avec Facebook
                 </button>
                 <button onClick={() => onSocialAuth('apple', 'signup')} disabled={!socialProviders.apple} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <AppleIcon />
                   S'inscrire avec Apple
                 </button>
                 <button onClick={() => onSocialAuth('linkedin', 'signup')} disabled={!socialProviders.linkedin} className="w-full border border-gray-700 rounded p-3 flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40">
                   <LinkedInIcon />
                   S'inscrire avec LinkedIn
                 </button>
                 {!hasEnabledSocial && (
                   <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                     <p>Aucun provider social n'est encore configuré côté serveur.</p>
                     {callbackHints.length > 0 && (
                       <div className="mt-2 text-[11px] text-yellow-200/90 space-y-1">
                         {callbackHints.map((hint) => <p key={hint}>{hint}</p>)}
                       </div>
                     )}
                   </div>
                 )}
               </div>
               <div className="flex items-center gap-3 text-xs text-gray-500">
                 <div className="h-px bg-gray-700 flex-1" />
                 <span>Email</span>
                 <div className="h-px bg-gray-700 flex-1" />
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" />
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Mot de passe</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none" />
               </div>
               <button onClick={() => onConfirm(email, password)} className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors">
                  CRÉER MON COMPTE
               </button>
            </div>
         </div>
      </div>
   );
};

const SubscriptionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onStartLemonCheckout: (plan: Plan) => Promise<boolean>;
  onConfirmCrypto: (plan: Plan) => Promise<boolean>;
  isStartingCheckout: boolean;
  lemonConfig: LemonSubscriptionConfig | null;
  plan: Plan | null;
  referralCode: string | null;
}> = ({
  isOpen,
  onClose,
  onStartLemonCheckout,
  onConfirmCrypto,
  isStartingCheckout,
  lemonConfig,
  plan,
  referralCode
}) => {
   const [view, setView] = useState<'SELECTION' | 'CRYPTO_GATEWAY'>('SELECTION');
   const [selectedPlan, setSelectedPlan] = useState<Plan>(plan || SUBSCRIPTION_PLANS[2]);
   const panelRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
    if (plan) {
      setSelectedPlan(plan);
    } else {
      setSelectedPlan(SUBSCRIPTION_PLANS[2]);
    }
   }, [plan, isOpen]);

   useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setView('SELECTION');
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
   }, [isOpen, onClose]);

   if (!isOpen) return null;

   const selectedPlanId = normalizeRequestedPlan(selectedPlan.id);
   const lemonPlans = lemonConfig?.lemon?.plans || { bourse: false, crypto: false, combo: false };
   const lemonPlanEnabled = Boolean(lemonPlans[selectedPlanId]);
   const lemonModeLabel = lemonConfig?.lemon?.mode === 'api' ? 'API Checkout' : 'Checkout URL';

   const handleCryptoClick = () => {
      setView('CRYPTO_GATEWAY');
   };

   const handleClose = () => {
    setView('SELECTION');
    onClose();
   };
   
   return (
      <div
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 overflow-y-auto"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
         <div ref={panelRef} className="bg-surface border border-primary rounded-xl max-w-lg w-full mx-auto my-6 p-6 sm:p-8 relative shadow-[0_0_50px_rgba(0,255,157,0.2)] max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <div className="text-center mb-8">
               <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
               <h2 className="text-2xl font-bold">Sécuriser votre accès</h2>
               <p className="text-gray-400 mt-2">Abonnement mensuel clair : signaux, academy et journal d'exécution.</p>
            </div>

            {view === 'SELECTION' ? (
                <>
                    <div className="bg-black/50 border border-gray-800 rounded-lg p-4 mb-6 flex justify-between items-center">
                       <span className="text-white font-bold">{selectedPlan.name}</span>
                       <span className="text-primary font-mono text-xl font-bold">{selectedPlan.price}€/mois</span>
                    </div>

                    <div className="space-y-2 mb-6">
                      {SUBSCRIPTION_PLANS.map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => setSelectedPlan(candidate)}
                          className={`w-full text-left border rounded p-3 transition-colors ${selectedPlan.id === candidate.id ? 'border-primary bg-primary/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{candidate.name}</span>
                            <span className="font-mono text-primary">{candidate.price}€</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{candidate.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="bg-[#111] border border-gray-800 rounded-lg p-4 mb-6 text-sm">
                      <p className="text-white font-bold mb-2">Inclus dans votre accès</p>
                      <ul className="space-y-1 text-gray-400">
                        <li>• Signaux structurés : entrée, stop loss, take profit, contexte</li>
                        <li>• Black Academy complète</li>
                        <li>• Journal de bord et revues d'exécution</li>
                        <li>• Support membre de base</li>
                      </ul>
                    </div>

                    {referralCode && (
                       <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle2 size={16} /> Code parrain appliqué : <span className="font-bold">{referralCode}</span> (-10%)
                       </div>
                    )}

                    <div className="space-y-3">
                       <button
                          onClick={() => {
                            void onStartLemonCheckout(selectedPlan);
                          }}
                          disabled={!lemonPlanEnabled || isStartingCheckout}
                          className="w-full bg-[#7047EB] text-white font-bold py-3 rounded hover:bg-[#5E3BC0] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          <CreditCard size={18} />
                          {isStartingCheckout ? 'Redirection checkout...' : 'Payer par carte bancaire'}
                       </button>
                       <button onClick={handleCryptoClick} className="w-full bg-[#F7931A] text-white font-bold py-3 rounded hover:bg-[#e08415] transition-colors flex items-center justify-center gap-2">
                          <Bitcoin size={18} /> Payer en Crypto (USDT/BTC)
                       </button>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      <p>Mode carte : <span className="text-gray-300">{lemonModeLabel}</span></p>
                      {!lemonPlanEnabled && (
                        <p className="text-yellow-400 mt-1">Le paiement par carte n'est pas encore configuré côté serveur.</p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 text-center mt-6 flex items-center justify-center gap-1">
                       <Lock size={10} /> Paiement sécurisé. Annulable à tout moment. Aucun conseil financier personnalisé.
                    </p>
                    <button onClick={handleClose} className="w-full mt-4 border border-gray-700 text-gray-300 font-bold py-2 rounded hover:border-gray-500 hover:text-white transition-colors">
                      Fermer
                    </button>
                </>
            ) : (
                <div className="animate-fade-in text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <QrCode size={150} color="black" />
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Envoyez exactement <span className="text-white font-bold">{selectedPlan.price.toFixed(2)} USDT (TRC20)</span></p>
                    <div className="bg-black border border-gray-700 p-3 rounded flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-gray-300 truncate mr-2">TNx00...wallet_address</span>
                        <Copy size={14} className="text-primary cursor-pointer"/>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs mb-6 animate-pulse">
                        <RefreshCcw size={12} className="animate-spin" /> En attente de validation blockchain...
                    </div>
                    <button
                      onClick={() => {
                        void onConfirmCrypto(selectedPlan);
                      }}
                      className="w-full bg-gray-700 text-white font-bold py-2 rounded hover:bg-gray-600 text-sm"
                    >
                        J'ai effectué le paiement
                    </button>
                    <button onClick={() => setView('SELECTION')} className="w-full border border-gray-700 text-gray-300 font-bold py-2 rounded mt-3 hover:border-gray-500 hover:text-white text-sm">
                        Retour aux méthodes de paiement
                    </button>
                    <button onClick={handleClose} className="w-full border border-gray-700 text-gray-300 font-bold py-2 rounded mt-3 hover:border-gray-500 hover:text-white text-sm">
                        Annuler et fermer
                    </button>
                </div>
            )}
         </div>
      </div>
   );
};

const AccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: (payload: { email: string; password: string; confirmText: string }) => Promise<boolean>;
  onResendVerification: () => void;
  onOpenAdmin: () => void;
  canOpenAdmin: boolean;
  user: SessionUser | null;
}> = ({ isOpen, onClose, onLogout, onDeleteAccount, onResendVerification, onOpenAdmin, canOpenAdmin, user }) => {
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setShowDangerZone(false);
    setDeleteEmail(user.email);
    setDeletePassword('');
    setDeleteConfirmText('');
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const pseudo = user.email;
  const maskedPassword = '********';
  const permissions = getUserPermissions(user);
  const affiliateProfile = user.affiliateProfile;
  const isAffiliate = Boolean(affiliateProfile?.isAffiliate);
  const referrals = affiliateProfile?.referrals || [];
  const commissionHistory = affiliateProfile?.commissionHistory || [];
  const totalReceived = commissionHistory
    .filter((item) => item.status === 'PAID')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpected = commissionHistory.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-surface border border-gray-700 rounded-xl max-w-3xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
            {pseudo.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Compte</h2>
            <p className="text-sm text-gray-400">Informations de session et d'abonnement</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Pseudo</span>
            <span className="text-white break-all">{pseudo}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Email</span>
            <span className="text-white break-all">{user.email}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Mot de passe</span>
            <span className="text-gray-500 tracking-[0.2em]">{maskedPassword}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Abonnement choisi</span>
            <span className="text-white">{formatPlanLabel(user.subscriptionPlan)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Abonnement actif</span>
            <span className={permissions.vipAccess ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{permissions.vipAccess ? 'Oui' : 'Non'}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Statut abonnement</span>
            <span className="text-white">{formatSubscriptionStatusLabel(user.subscriptionStatus)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Provider paiement</span>
            <span className="text-white">{String(user.billing?.provider || 'NONE').slice(0, 24)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Membre depuis</span>
            <span className="text-white">{formatDateLabel(user.createdAt)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Début abonnement</span>
            <span className="text-white">{formatDateLabel(user.subscriptionLifecycle?.subscriptionStartedAt || user.subscriptionStartedAt || null)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Période en cours</span>
            <span className="text-white text-right">
              {formatDateLabel(user.subscriptionLifecycle?.currentPeriodStart || user.billing?.currentPeriodStart || null)}
              {' '}→{' '}
              {formatDateLabel(user.subscriptionLifecycle?.currentPeriodEnd || user.billing?.currentPeriodEnd || null)}
            </span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Annulation demandée</span>
            <span className="text-white">{formatDateLabel(user.subscriptionLifecycle?.cancelRequestedAt || user.billing?.canceledAt || null)}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Accès maintenu jusqu'au</span>
            <span className={(user.subscriptionLifecycle?.accessEndsAt || user.billing?.currentPeriodEnd) ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {formatDateLabel(user.subscriptionLifecycle?.accessEndsAt || user.billing?.currentPeriodEnd || null)}
            </span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Role</span>
            <span className={user.isAdmin ? 'text-primary font-bold' : 'text-white'}>{user.isAdmin ? 'Administrateur' : 'Membre'}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Email vérifié</span>
            <span className={user.emailVerified ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
              {user.emailVerified ? 'Oui' : 'Non'}
            </span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">VIP manuel (admin)</span>
            <span className={user.manualVipAccess ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {user.manualVipAccess ? 'Actif' : 'Non'}
            </span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Formation initiale</span>
            <span className={user.needsOnboarding ? 'text-yellow-400' : 'text-green-400'}>{user.needsOnboarding ? 'A terminer' : 'Validee / ignoree'}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Acces VIP</span>
            <span className={permissions.vipAccess ? 'text-primary font-bold' : 'text-gray-400'}>{permissions.vipAccess ? 'Debloque' : 'Verrouille'}</span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Acces signaux Bourse</span>
            <span className={permissions.canAccessBourseSignals ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {permissions.canAccessBourseSignals ? 'Oui' : 'Non'}
            </span>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
            <span className="text-gray-500">Acces signaux Crypto</span>
            <span className={permissions.canAccessCryptoSignals ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {permissions.canAccessCryptoSignals ? 'Oui' : 'Non'}
            </span>
          </div>
        </div>

        {!user.emailVerified && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm">
            <p className="text-yellow-300 mb-3">Votre email n'est pas encore vérifié.</p>
            <button onClick={onResendVerification} className="bg-yellow-500 text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors">
              Renvoyer l'email de vérification
            </button>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="text-yellow-500" size={18} />
            <h3 className="text-lg font-bold text-white">Affiliation</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
              <span className="text-gray-500">Plan affiliation</span>
              <span className={isAffiliate ? 'text-green-400 font-bold' : 'text-gray-400'}>{isAffiliate ? 'Oui' : 'Non'}</span>
            </div>
            <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
              <span className="text-gray-500">Code parrain</span>
              <span className="text-white">{affiliateProfile?.referralCode || 'Non attribue'}</span>
            </div>
            <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
              <span className="text-gray-500">Total deja recu</span>
              <span className="text-green-400 font-bold">{totalReceived.toFixed(2)}€</span>
            </div>
            <div className="bg-black border border-gray-800 rounded-lg p-4 flex justify-between gap-4">
              <span className="text-gray-500">Total historique</span>
              <span className="text-white font-bold">{totalExpected.toFixed(2)}€</span>
            </div>
          </div>

          {isAffiliate ? (
            <div className="space-y-4">
              <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-bold text-white">Filleuls</h4>
                  <p className="text-xs text-gray-500 mt-1">Plan, statut d abonnement, canal de paiement et commission associee.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-[#111] text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="p-3">Pseudo</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Abonnement</th>
                        <th className="p-3">Canal</th>
                        <th className="p-3">Commission</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3">Doit recevoir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {referrals.length === 0 ? (
                        <tr>
                          <td className="p-4 text-gray-500" colSpan={7}>Aucun filleul pour le moment.</td>
                        </tr>
                      ) : referrals.map((referral) => {
                        const shouldReceive = referral.subscriptionActive && referral.commissionAmount > 0;
                        return (
                          <tr key={referral.id} className="hover:bg-white/5">
                            <td className="p-3 text-white">{referral.pseudo}</td>
                            <td className="p-3 text-gray-300">{formatPlanLabel(referral.subscriptionPlan)}</td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <span className={referral.subscriptionActive ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                  {referral.subscriptionActive ? 'Actif' : 'Inactif'}
                                </span>
                                <p className="text-[11px] text-gray-500">{formatSubscriptionStatusLabel(referral.subscriptionStatus || 'NONE')}</p>
                              </div>
                            </td>
                            <td className="p-3 text-gray-300">{formatPaymentProviderLabel(referral.paymentProvider)}</td>
                            <td className="p-3 text-primary font-bold">{referral.commissionAmount.toFixed(2)}€</td>
                            <td className="p-3 text-gray-300">{formatCommissionModelLabel(referral.commissionModel)}</td>
                            <td className="p-3">
                              <span className={shouldReceive ? 'text-yellow-400 font-bold' : 'text-gray-500'}>
                                {shouldReceive ? formatCommissionStatus(referral.commissionStatus) : formatFollowUpLabel(referral.followUpRequired, referral.paymentProvider)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-bold text-white">Historique des commissions</h4>
                  <p className="text-xs text-gray-500 mt-1">Le cumul est utile, mais il doit toujours etre affiche avec le detail des paiements.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111] text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="p-3">Source</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Montant</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Methode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {commissionHistory.length === 0 ? (
                        <tr>
                          <td className="p-4 text-gray-500" colSpan={5}>Aucune commission enregistree.</td>
                        </tr>
                      ) : commissionHistory.map((commission) => (
                        <tr key={commission.id} className="hover:bg-white/5">
                          <td className="p-3 text-white">{commission.sourceUser}</td>
                          <td className="p-3 text-gray-300">{commission.dateCreated}</td>
                          <td className="p-3 text-primary font-bold">{commission.amount.toFixed(2)}€</td>
                          <td className="p-3">
                            <span className={commission.status === 'PAID' ? 'text-green-400 font-bold' : commission.status === 'READY_TO_PAY' ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                              {formatCommissionStatus(commission.status)}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300">{commission.payoutMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
              Ce compte n'est pas encore inscrit au programme affiliation.
            </div>
          )}
        </div>

        <div className="mt-8 border border-red-500/40 bg-red-500/10 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-red-300 font-bold">Zone sensible</h3>
              <p className="text-xs text-red-200/80 mt-1">Action irréversible : suppression définitive du compte.</p>
            </div>
            <button
              onClick={() => setShowDangerZone((value) => !value)}
              className="border border-red-400/50 text-red-200 px-3 py-2 rounded text-sm font-bold hover:bg-red-500/20"
            >
              {showDangerZone ? 'Masquer' : 'Supprimer mon compte'}
            </button>
          </div>

          {showDangerZone && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-red-100/90">
                Entrez votre email exact, votre mot de passe (si compte classique), puis tapez <strong>SUPPRIMER</strong>.
              </p>
              <div>
                <label className="text-xs text-red-200 uppercase font-bold">Email de confirmation</label>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(event) => setDeleteEmail(event.target.value)}
                  className="w-full bg-black border border-red-500/40 rounded p-3 text-white focus:border-red-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-red-200 uppercase font-bold">Mot de passe actuel (optionnel si connexion sociale)</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className="w-full bg-black border border-red-500/40 rounded p-3 text-white focus:border-red-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-red-200 uppercase font-bold">Tapez SUPPRIMER</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  className="w-full bg-black border border-red-500/40 rounded p-3 text-white focus:border-red-300 focus:outline-none"
                />
              </div>
              <button
                onClick={async () => {
                  const ok = await onDeleteAccount({
                    email: deleteEmail.trim().toLowerCase(),
                    password: deletePassword,
                    confirmText: deleteConfirmText.trim().toUpperCase()
                  });
                  if (ok) {
                    setShowDangerZone(false);
                  }
                }}
                className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-500 transition-colors"
              >
                Confirmer la suppression définitive
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-700 text-gray-300 font-bold py-3 rounded hover:text-white hover:border-gray-500">
            Fermer
          </button>
          {user.isAdmin && canOpenAdmin && (
            <button onClick={onOpenAdmin} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded hover:bg-yellow-400">
              Ouvrir admin
            </button>
          )}
          <button onClick={onLogout} className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-500">
            Deconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC<{ 
  isSubscribed: boolean; 
  isAuthenticated: boolean;
  isAdmin: boolean;
  canOpenAdmin: boolean;
  toggleSubscribe: () => void;
  toggleLogin: () => void;
  openAccount: () => void;
  openAdmin: () => void;
}> = ({ isSubscribed, isAuthenticated, isAdmin, canOpenAdmin, toggleSubscribe, toggleLogin, openAccount, openAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-primary' : 'text-gray-400 hover:text-white';

  return (
    <nav className="sticky top-0 left-0 right-0 bg-secondary/95 backdrop-blur border-b border-gray-800 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-primary w-6 h-6" />
          <span className="font-mono font-bold text-xl tracking-tighter">BLACK<span className="text-primary">PAPERS</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-mono text-sm">
          <Link to="/" className={isActive('/')}>ACCUEIL</Link>
          <Link to="/blog" className={isActive('/blog')}>BLOG & ACTU</Link>
          <Link to="/reviews" className={isActive('/reviews')}>AVIS & PREUVES</Link>
          <Link to="/sample" className={`${isActive('/sample')} border border-primary/30 px-2 py-1 rounded bg-primary/10`}>EXEMPLE VIP</Link>
          {isSubscribed && <Link to="/signals" className={isActive('/signals')}>TRADES QUOTIDIENS</Link>}
          <Link to="/dashboard" className={isActive('/dashboard')}>ZONE VIP</Link>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated && (
             <button 
                onClick={toggleLogin}
                className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
             >
                <LogIn size={16} />
                CONNEXION
             </button>
          )}
          {isAuthenticated && (
            <button onClick={openAccount} className="hidden md:flex items-center gap-2 text-sm font-bold text-primary border border-primary/30 bg-primary/10 px-3 py-2 rounded hover:bg-primary hover:text-black transition-colors">
              <User size={16} />
              {isAdmin ? 'Compte Admin' : 'Connecté'}
            </button>
          )}
          {isAdmin && canOpenAdmin && (
            <button
              onClick={openAdmin}
              className="hidden md:flex items-center gap-2 text-sm font-bold text-yellow-300 border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 rounded hover:bg-yellow-500 hover:text-black transition-colors"
            >
              <Shield size={16} />
              ADMIN
            </button>
          )}
          
          <button 
            onClick={toggleSubscribe}
            className={`px-4 py-2 rounded font-bold text-sm transition-all flex items-center gap-2 ${isSubscribed 
              ? 'bg-gray-800 text-green-500 border border-green-500/30' 
              : 'bg-primary text-black hover:bg-primary-dark'}`}
          >
            {isSubscribed ? <><User size={16}/> COMPTE VIP</> : <><FileKey size={16}/> S'ABONNER</>}
          </button>
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-secondary border-b border-gray-800 p-4 space-y-4">
          <Link to="/" className="block text-gray-300" onClick={() => setIsOpen(false)}>Accueil</Link>
          <Link to="/blog" className="block text-gray-300" onClick={() => setIsOpen(false)}>Blog</Link>
          <Link to="/reviews" className="block text-gray-300" onClick={() => setIsOpen(false)}>Avis</Link>
          <Link to="/sample" className="block text-primary font-bold" onClick={() => setIsOpen(false)}>EXEMPLE VIP</Link>
          {isSubscribed && <Link to="/signals" className="block text-gray-300" onClick={() => setIsOpen(false)}>Trades Quotidiens</Link>}
          <Link to="/dashboard" className="block text-gray-300" onClick={() => setIsOpen(false)}>Zone VIP</Link>
          {!isAuthenticated ? (
            <button onClick={() => { toggleLogin(); setIsOpen(false); }} className="block text-primary w-full text-left font-bold">Connexion</button>
          ) : (
            <>
              <button onClick={() => { openAccount(); setIsOpen(false); }} className="block text-primary w-full text-left font-bold">Compte</button>
              {isAdmin && canOpenAdmin && <button onClick={() => { openAdmin(); setIsOpen(false); }} className="block text-yellow-400 w-full text-left font-bold">Admin</button>}
            </>
          )}
        </div>
      )}
    </nav>
  );
};

// --- APP ROOT ---

export default function App() {
  const enableAdminConsole = import.meta.env.VITE_ENABLE_ADMIN_CONSOLE === 'true';
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [showTrainingCenter, setShowTrainingCenter] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [prefillResetEmail, setPrefillResetEmail] = useState('');
  const [prefillResetToken, setPrefillResetToken] = useState('');
  const [prefillSignupEmail, setPrefillSignupEmail] = useState<string>(() => localStorage.getItem(LEAD_STORAGE_KEY) || '');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  // State for posts and reviews
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminTrades, setAdminTrades] = useState<Trade[]>([]);
  const [adminMarketAnalysis, setAdminMarketAnalysis] = useState('');
  const [crmOverview, setCrmOverview] = useState<CrmOverview | null>(null);
  const [lemonSubscriptionConfig, setLemonSubscriptionConfig] = useState<LemonSubscriptionConfig | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [oauthCallbackBaseUrl, setOauthCallbackBaseUrl] = useState('');
  const [socialProviders, setSocialProviders] = useState<Record<OAuthProvider, boolean>>({
    google: false,
    facebook: false,
    apple: false,
    linkedin: false
  });

  const applySessionState = (user: SessionUser | null) => {
    const permissions = getUserPermissions(user);
    setCurrentUser(user);
    setIsSubscribed(Boolean(permissions.vipAccess));
    setIsAdmin(Boolean(user?.isAdmin));
    setRequiresOnboarding(Boolean(user?.needsOnboarding && permissions.canAccessTraining));
    if (!user?.isAdmin) {
      setAdminUsers([]);
      setAdminTrades([]);
      setAdminMarketAnalysis('');
      setCrmOverview(null);
    }
  };

  const loadPublicContent = async () => {
    try {
      const res = await apiFetch('/api/content');
      if (!res.ok) throw new Error('content_fetch_failed');
      const data = await res.json();
      if (Array.isArray(data?.posts)) setPosts(data.posts);
      if (Array.isArray(data?.reviews)) setReviews(data.reviews);
    } catch {
      // Keep client-side fallback content when backend content is unavailable.
    }
  };

  const loadOAuthProviders = async () => {
    try {
      const res = await apiFetch('/api/auth/oauth/providers', { method: 'GET' });
      if (!res.ok) throw new Error('oauth_providers_unavailable');
      const data = await res.json();
      const nextProviders = data?.providers || {};
      setOauthCallbackBaseUrl(typeof data?.callbackBaseUrl === 'string' ? data.callbackBaseUrl : '');
      setSocialProviders({
        google: Boolean(nextProviders.google),
        facebook: Boolean(nextProviders.facebook),
        apple: Boolean(nextProviders.apple),
        linkedin: Boolean(nextProviders.linkedin)
      });
    } catch {
      setOauthCallbackBaseUrl('');
      setSocialProviders({
        google: false,
        facebook: false,
        apple: false,
        linkedin: false
      });
    }
  };

  const loadSubscriptionConfig = async () => {
    try {
      const res = await apiFetch('/api/subscription/config');
      if (!res.ok) throw new Error('subscription_config_unavailable');
      const data = await res.json();
      const normalized: LemonSubscriptionConfig = {
        lemon: {
          mode: data?.lemon?.mode === 'api' ? 'api' : 'url',
          apiEnabled: Boolean(data?.lemon?.apiEnabled),
          webhookEnabled: Boolean(data?.lemon?.webhookEnabled),
          plans: {
            bourse: Boolean(data?.lemon?.plans?.bourse),
            crypto: Boolean(data?.lemon?.plans?.crypto),
            combo: Boolean(data?.lemon?.plans?.combo)
          },
          successUrl: typeof data?.lemon?.successUrl === 'string' ? data.lemon.successUrl : '',
          cancelUrl: typeof data?.lemon?.cancelUrl === 'string' ? data.lemon.cancelUrl : ''
        },
        plans: Array.isArray(data?.plans)
          ? data.plans.map((plan: string) => String(plan || '').toLowerCase()).filter(Boolean)
          : ['bourse', 'crypto', 'combo'],
        mode: data?.mode === 'api' ? 'api' : 'url'
      };
      setLemonSubscriptionConfig(normalized);
      return true;
    } catch {
      setLemonSubscriptionConfig(null);
      return false;
    }
  };

  const loadAdminTrades = async () => {
    try {
      const res = await apiFetch('/api/trades');
      if (!res.ok) throw new Error('admin_trades_fetch_failed');
      const data = await res.json();
      if (Array.isArray(data?.trades)) setAdminTrades(data.trades);
      if (typeof data?.marketAnalysis === 'string') setAdminMarketAnalysis(data.marketAnalysis);
      return true;
    } catch {
      return false;
    }
  };

  const loadAdminBootstrap = async () => {
    try {
      const res = await apiFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('admin_bootstrap_failed');
      const data = await res.json();
      if (Array.isArray(data?.users)) setAdminUsers(data.users);
      if (Array.isArray(data?.posts)) setPosts(data.posts);
      if (Array.isArray(data?.reviews)) setReviews(data.reviews);
      if (data?.crm && typeof data.crm === 'object') setCrmOverview(data.crm);
      await loadAdminTrades();
      return true;
    } catch {
      return false;
    }
  };

  const loadAdminCrmOverview = async () => {
    try {
      const res = await apiFetch('/api/admin/crm/overview');
      if (!res.ok) throw new Error('admin_crm_overview_failed');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setCrmOverview(data);
      }
      return true;
    } catch {
      return false;
    }
  };

  const loadServerSession = async () => {
    try {
      const res = await apiFetch('/api/auth/session', { method: 'GET' });
      if (!res.ok) throw new Error('session_invalid');
      const data = await res.json();
      applySessionState(data?.user || null);
      if (data?.user?.isAdmin) {
        await loadAdminBootstrap();
      }
      return true;
    } catch {
      applySessionState(null);
      return false;
    }
  };

  useEffect(() => {
    loadOAuthProviders();
    loadSubscriptionConfig();
    loadServerSession().finally(() => {
      loadPublicContent();
    });
  }, []);

  useEffect(() => {
    if (currentUser && requiresOnboarding) {
      setShowTrainingCenter(true);
    }
  }, [currentUser, requiresOnboarding]);

  useEffect(() => {
    loadPublicContent();
  }, [currentUser]);

  const authenticateWithServer = async (
    path: '/api/auth/login' | '/api/auth/signup',
    email: string,
    password: string,
    extraPayload: Record<string, unknown> = {}
  ) => {
    try {
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, ...extraPayload })
      });
      const data = await res.json();
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || 'auth_failed');
      }
      applySessionState(data.user);
      const sessionOk = await loadServerSession();
      if (!sessionOk) {
        throw new Error('session_cookie_blocked');
      }
      await loadPublicContent();
      return true;
    } catch (err) {
      alert(getFriendlyAuthError(err instanceof Error ? err.message : 'auth_failed'));
      return false;
    }
  };

  const verifySubscriptionWithServer = async (planId: string) => {
    if (!currentUser) {
      alert("Connectez-vous avant de confirmer l'abonnement.");
      return false;
    }
    try {
      const res = await apiFetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'subscription_failed');
      await loadServerSession();
      await loadPublicContent();
      if (data?.requiresManualValidation) {
        alert("Demande d'abonnement envoyée. Activation en attente de validation serveur du paiement.");
      }
      return true;
    } catch {
      alert("Validation d'abonnement impossible côté serveur.");
      return false;
    }
  };

  const startLemonCheckoutWithServer = async (planId: string) => {
    if (!currentUser) {
      alert('Connectez-vous avant de démarrer le paiement.');
      setShowLoginModal(true);
      return false;
    }
    const normalizedPlan = normalizeRequestedPlan(planId);
    setIsStartingCheckout(true);
    try {
      const res = await apiFetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: normalizedPlan })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'lemon_checkout_failed');
      }
      if (!data?.checkoutUrl) {
        throw new Error('lemon_checkout_url_missing');
      }
      setShowPayModal(false);
      window.location.assign(data.checkoutUrl);
      return true;
    } catch (error) {
      const code = error instanceof Error ? error.message : 'lemon_checkout_failed';
      alert(getSubscriptionApiErrorMessage(code));
      return false;
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const completeOnboardingWithServer = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'onboarding_complete_failed');
      setRequiresOnboarding(false);
      setShowTrainingCenter(false);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'onboarding_complete_failed';
      if (code === 'vip_required_for_training') {
        alert("La formation complète est réservée aux comptes VIP.");
      } else {
        alert("Impossible de finaliser la formation pour l'instant. Réessayez.");
      }
    }
  };

  // Hook to check for referral code in URL
  const LocationChecker = () => {
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
      const ref = searchParams.get('ref');
      if (ref) {
        const safeRef = sanitizeReferralCode(ref);
        if (safeRef) {
          setReferralCode(safeRef);
        }
      }

      const authStatus = searchParams.get('auth_status');
      const authError = searchParams.get('auth_error');
      const checkoutStatus = searchParams.get('checkout');
      const resetToken = searchParams.get('reset_token');

      if (authStatus === 'success' || authStatus === 'email_verified') {
        setShowLoginModal(false);
        setShowSignupModal(false);
        loadServerSession().finally(() => {
          loadPublicContent();
          void loadAdminCrmOverview();
        });
        if (authStatus === 'email_verified') {
          alert("Email vérifié avec succès. Bienvenue.");
        }
      } else if (authStatus === 'error') {
        alert(getFriendlyAuthError(authError || 'oauth_failed'));
      }

      if (checkoutStatus === 'success') {
        alert('Paiement confirmé. Votre statut est en cours de synchronisation.');
        loadServerSession().finally(() => {
          loadPublicContent();
          void loadAdminCrmOverview();
        });
      } else if (checkoutStatus === 'cancel') {
        alert('Paiement annulé.');
      }

      if (resetToken) {
        setPrefillResetToken(resetToken.trim());
        setShowLoginModal(false);
        setShowSignupModal(false);
        setShowResetPasswordModal(true);
      }

      if (!authStatus && !checkoutStatus && !resetToken) return;

      const nextUrl = new URL(window.location.href);
      [
        'auth_status',
        'auth_error',
        'auth_mode',
        'auth_provider',
        'checkout',
        'reset_token'
      ].forEach((key) => nextUrl.searchParams.delete(key));
      window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    }, [searchParams]);
    
    return null;
  };

  const handleSubscribeClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPayModal(true);
  };
  
  const handleGenericSubscribe = () => {
    setSelectedPlan({ id: 'combo', name: 'Pack Complet', price: 49, description: 'Crypto + Bourse' });
    setShowPayModal(true);
  };

  const handleLeadCapture = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) return false;
    localStorage.setItem(LEAD_STORAGE_KEY, normalized);
    setPrefillSignupEmail(normalized);
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, source: 'home_starter_capture', referralCode: referralCode || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'lead_capture_failed');
      return true;
    } catch {
      return false;
    }
  };

  const handleStartSocialAuth = (provider: OAuthProvider, mode: 'login' | 'signup') => {
    if (!socialProviders[provider]) {
      alert("Ce provider social n'est pas encore activé côté serveur.");
      return;
    }
    setShowLoginModal(false);
    setShowSignupModal(false);
    window.location.assign(buildApiUrl(`/api/auth/oauth/${provider}/start?mode=${mode}`));
  };

  const handleResendVerificationEmail = async (emailOverride?: string) => {
    const fallbackEmail = currentUser?.email || '';
    const requestedEmail = (emailOverride || fallbackEmail).trim().toLowerCase();
    try {
      const payload = requestedEmail.includes('@') ? { email: requestedEmail } : {};
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'resend_failed');
      if (data?.alreadyVerified) {
        alert('Email déjà vérifié.');
      } else {
        alert("Email de vérification envoyé.");
      }
    } catch {
      alert("Impossible d'envoyer l'email de vérification.");
    }
  };

  const handleRequestPasswordReset = async (emailInput: string) => {
    const email = emailInput.trim().toLowerCase();
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'auth_failed');
      }
      alert("Si cet email existe, un lien de réinitialisation vient d'être envoyé.");
      return true;
    } catch (error) {
      alert(getFriendlyAuthError(error instanceof Error ? error.message : 'auth_failed'));
      return false;
    }
  };

  const handleResetPassword = async (tokenInput: string, newPassword: string) => {
    const token = tokenInput.trim();
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || 'auth_failed');
      }
      applySessionState(data.user);
      const sessionOk = await loadServerSession();
      if (!sessionOk) {
        throw new Error('session_cookie_blocked');
      }
      await loadPublicContent();
      setPrefillResetToken('');
      alert('Mot de passe mis à jour. Vous êtes connecté.');
      return true;
    } catch (error) {
      alert(getFriendlyAuthError(error instanceof Error ? error.message : 'auth_failed'));
      return false;
    }
  };

  const handleNewPost = async (post: Post) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour publier.");
      return false;
    }
    try {
      const res = await apiFetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'post_publish_failed');
      if (Array.isArray(data?.posts)) setPosts(data.posts);
      return true;
    } catch {
      alert("Publication impossible côté serveur.");
      return false;
    }
  };

  const handleUpdatePost = async (postId: string, payload: Partial<Post>) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour modifier.");
      return false;
    }
    try {
      const res = await apiFetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'post_update_failed');
      if (Array.isArray(data?.posts)) setPosts(data.posts);
      return true;
    } catch {
      alert("Modification impossible côté serveur.");
      return false;
    }
  };

  const handleGenerateRssDrafts = async (limit: number, publishNow: boolean) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour générer des brouillons.");
      return null;
    }
    try {
      const res = await apiFetch('/api/admin/posts/auto-rss-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, publishNow })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'auto_rss_failed');
      if (Array.isArray(data?.posts)) setPosts(data.posts);
      return {
        created: Number(data?.created || 0),
        published: Boolean(data?.published)
      };
    } catch {
      return null;
    }
  };

  const handleUpdateTrades = async (payload: { trades: Trade[]; marketAnalysis: string; snapshotDate?: string }) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour modifier les signaux.");
      return false;
    }
    try {
      const res = await apiFetch('/api/admin/trades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'trades_update_failed');
      if (Array.isArray(data?.trades)) setAdminTrades(data.trades);
      if (typeof data?.marketAnalysis === 'string') setAdminMarketAnalysis(data.marketAnalysis);
      alert('Signaux VIP mis a jour.');
      return true;
    } catch {
      alert("Impossible de sauvegarder les signaux VIP.");
      return false;
    }
  };

  const handleNewReview = async (newReview: Partial<Review>) => {
    const safeVideoUrl = newReview.videoUrl && isSafeExternalUrl(newReview.videoUrl) ? newReview.videoUrl : undefined;
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: newReview.author || 'Anonyme',
          rating: newReview.rating || 5,
          content: newReview.content || '',
          analysis: newReview.analysis || '',
          type: newReview.type || 'TEXT',
          videoUrl: safeVideoUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'review_submit_failed');
      if (data?.review) {
        setReviews(prev => [data.review, ...prev]);
      }
      alert("Votre avis a été soumis à modération. Merci !");
      return true;
    } catch (error) {
      const code = error instanceof Error ? error.message : 'review_submit_failed';
      if (code === 'subscription_required_for_reviews') {
        alert("Activez votre accès VIP pour soumettre un avis.");
      } else if (code === 'invalid_video_url') {
        alert("Le lien vidéo n'est pas valide.");
      } else {
        alert("Impossible d'envoyer l'avis au serveur.");
      }
      return false;
    }
  };

  const handleReviewAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser || !isAdmin) return false;
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'review_update_failed');
      if (Array.isArray(data?.reviews)) setReviews(data.reviews);
      return true;
    } catch {
      alert("Impossible de mettre à jour cet avis.");
      return false;
    }
  };

  const handleCreateTestUser = async (payload: {
    email: string;
    password: string;
    isSubscribed: boolean;
    isAdmin: boolean;
    skipOnboarding: boolean;
    manualVipAccess: boolean;
    subscriptionPlan: string;
    subscriptionStatus: string;
    emailVerified: boolean;
  }) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour créer un compte test.");
      return false;
    }
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'user_create_failed');
      if (Array.isArray(data?.users)) setAdminUsers(data.users);
      void loadAdminCrmOverview();
      alert("Compte test créé.");
      return true;
    } catch {
      alert("Impossible de créer ce compte test.");
      return false;
    }
  };

  const handleUpdateUserAccess = async (
    userId: string,
    payload: {
      isAdmin?: boolean;
      isSubscribed?: boolean;
      manualVipAccess?: boolean;
      needsOnboarding?: boolean;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      emailVerified?: boolean;
    }
  ) => {
    if (!currentUser || !isAdmin) {
      alert("Connectez-vous en admin pour modifier les accès.");
      return false;
    }
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'user_update_failed');
      if (Array.isArray(data?.users)) setAdminUsers(data.users);
      void loadAdminCrmOverview();
      return true;
    } catch {
      alert("Impossible de mettre à jour cet utilisateur.");
      return false;
    }
  };

  const handleDeleteAccount = async (payload: { email: string; password: string; confirmText: string }) => {
    try {
      const res = await apiFetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'account_delete_failed');
    } catch (error) {
      alert(getFriendlyAuthError(error instanceof Error ? error.message : 'account_delete_failed'));
      return false;
    }

    applySessionState(null);
    setShowTrainingCenter(false);
    setShowAccountModal(false);
    setShowAdmin(false);
    localStorage.removeItem(LEAD_STORAGE_KEY);
    setPrefillSignupEmail('');
    await loadPublicContent();
    alert("Compte supprimé avec succès.");
    return true;
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Server-side logout failed; fallback to local reset to avoid dangling privileged UI state.
    } finally {
      applySessionState(null);
      setShowTrainingCenter(false);
      setShowAccountModal(false);
      setShowAdmin(false);
      localStorage.removeItem(LEAD_STORAGE_KEY);
      setPrefillSignupEmail('');
      await loadPublicContent();
    }
  };

  return (
    <Router>
      <LocationChecker />
      <div className="min-h-screen bg-[#121212] text-gray-100 font-sans selection:bg-primary selection:text-black">
        <LiveTicker />
        <DisclaimerBanner />
        
        <Navbar 
          isSubscribed={isSubscribed} 
          isAuthenticated={Boolean(currentUser)}
          isAdmin={isAdmin}
          canOpenAdmin={enableAdminConsole}
          toggleSubscribe={() => {
            if (isSubscribed) {
              setShowAccountModal(true);
              return;
            }
            handleGenericSubscribe();
          }}
          toggleLogin={() => setShowLoginModal(true)}
          openAccount={() => setShowAccountModal(true)}
          openAdmin={() => setShowAdmin(true)}
        />
        
        <Routes>
          <Route path="/" element={<Home onSubscribe={handleGenericSubscribe} onSelectPlan={handleSubscribeClick} posts={posts} onOpenTraining={() => setShowTrainingCenter(true)} showTrainingNudge={Boolean(currentUser && requiresOnboarding)} onLeadCapture={handleLeadCapture} onOpenSignup={() => setShowSignupModal(true)} />} />
          <Route path="/starter-kit" element={<StarterKitPage onOpenSignup={() => setShowSignupModal(true)} onSubscribe={handleGenericSubscribe} />} />
          <Route path="/blog" element={<Blog posts={posts} />} />
          <Route
            path="/reviews"
            element={
              <ReviewsPage
                reviews={reviews}
                canSubmit={Boolean(currentUser && getUserPermissions(currentUser).vipAccess)}
                onOpenSubmit={() => {
                  if (!currentUser) {
                    alert('Connectez-vous pour soumettre un avis.');
                    setShowLoginModal(true);
                    return;
                  }
                  if (!getUserPermissions(currentUser).vipAccess) {
                    alert("Activez votre accès VIP pour soumettre un avis.");
                    handleGenericSubscribe();
                    return;
                  }
                  setShowReviewModal(true);
                }}
              />
            }
          />
          <Route path="/sample" element={<SamplePage onSubscribe={handleGenericSubscribe} reviews={reviews} />} />
          <Route path="/signals" element={<SignalsPage access={getUserPermissions(currentUser)} onSubscribe={handleGenericSubscribe} />} />
          <Route path="/partners" element={<AffiliatePage currentUser={currentUser} onOpenLogin={() => setShowLoginModal(true)} />} />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                isSubscribed={isSubscribed} 
                onSubscribe={handleSubscribeClick} 
                posts={posts}
              />
            } 
          />
        </Routes>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLogin={async (email, password) => {
            const ok = await authenticateWithServer('/api/auth/login', email, password);
            if (ok) setShowLoginModal(false);
          }}
          onResendVerification={(email) => {
            void handleResendVerificationEmail(email);
          }}
          onOpenPasswordReset={(email) => {
            setPrefillResetEmail((email || '').trim().toLowerCase());
            setPrefillResetToken('');
            setShowLoginModal(false);
            setShowResetPasswordModal(true);
          }}
          onOpenSignup={() => setShowSignupModal(true)}
          socialProviders={socialProviders}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          onSocialAuth={handleStartSocialAuth}
        />

        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setPrefillResetToken('');
          }}
          initialEmail={prefillResetEmail}
          initialToken={prefillResetToken}
          onRequestReset={handleRequestPasswordReset}
          onResetPassword={handleResetPassword}
        />

        <SignupModal 
          isOpen={showSignupModal}
          onClose={() => {
            setShowSignupModal(false);
          }}
          onConfirm={async (email, password) => {
            const ok = await authenticateWithServer('/api/auth/signup', email, password, {
              referralCode: referralCode || undefined,
              hutk: getCookieValue('hubspotutk') || undefined,
              pageUri: typeof window !== 'undefined' ? window.location.href : undefined,
              pageName: 'Signup'
            });
            if (ok) {
              setShowSignupModal(false);
              localStorage.removeItem(LEAD_STORAGE_KEY);
              setPrefillSignupEmail('');
              alert("Compte créé. Vérifiez votre email pour activer toutes les options.");
            }
          }}
          defaultEmail={prefillSignupEmail}
          socialProviders={socialProviders}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          onSocialAuth={handleStartSocialAuth}
        />

        <SubscriptionModal 
          isOpen={showPayModal} 
          onClose={() => setShowPayModal(false)}
          onStartLemonCheckout={async (plan) => {
            setSelectedPlan(plan);
            return startLemonCheckoutWithServer(plan.id || selectedPlan?.id || 'combo');
          }}
          onConfirmCrypto={async (plan) => {
            setSelectedPlan(plan);
            const ok = await verifySubscriptionWithServer(plan.id || selectedPlan?.id || 'combo');
            if (ok) setShowPayModal(false);
            return ok;
          }}
          isStartingCheckout={isStartingCheckout}
          lemonConfig={lemonSubscriptionConfig}
          plan={selectedPlan}
          referralCode={referralCode}
        />

        <ReviewSubmissionModal 
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleNewReview}
        />

        <AccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onResendVerification={() => {
            void handleResendVerificationEmail();
          }}
          onOpenAdmin={() => {
            setShowAccountModal(false);
            setShowAdmin(true);
          }}
          canOpenAdmin={enableAdminConsole}
          user={currentUser}
        />

        <AdminConsole 
          isOpen={showAdmin && enableAdminConsole && isAdmin} 
          onClose={() => setShowAdmin(false)} 
          onPublish={handleNewPost}
          onUpdatePost={handleUpdatePost}
          onGenerateRssDrafts={handleGenerateRssDrafts}
          onUpdateTrades={handleUpdateTrades}
          trades={adminTrades}
          marketAnalysis={adminMarketAnalysis}
          onCreateTestUser={handleCreateTestUser}
          onUpdateUserAccess={handleUpdateUserAccess}
          posts={posts}
          users={adminUsers}
          crmOverview={crmOverview}
          lemonConfig={lemonSubscriptionConfig}
          onRefreshCrm={loadAdminCrmOverview}
          reviews={reviews}
          onReviewAction={handleReviewAction}
        />

        {currentUser && requiresOnboarding && (
          <OnboardingTrainingGate isOpen={showTrainingCenter} onClose={() => setShowTrainingCenter(false)} onComplete={completeOnboardingWithServer} />
        )}

        {currentUser && requiresOnboarding && !showTrainingCenter && (
          <button
            onClick={() => setShowTrainingCenter(true)}
            className="fixed right-4 bottom-24 z-40 bg-primary text-black font-bold px-4 py-3 rounded-full shadow-[0_0_20px_rgba(0,255,157,0.35)]"
          >
            Ouvrir la Formation
          </button>
        )}

        <footer className="border-t border-gray-800 py-12 mt-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
            <p className="mb-4">&copy; {new Date().getFullYear()} Black Papers. Tous droits réservés.</p>
            <p className="max-w-2xl mx-auto italic mb-4">
              Avertissement : Ce site est une plateforme de divertissement et d'éducation. 
              L'auteur partage ses positions personnelles à titre informatif. 
              Ceci ne constitue pas un conseil en investissement. Le trading comporte des risques de perte en capital.
            </p>
            <div className="flex justify-center gap-6 mt-8">
                <button
                 onClick={() => {
                    if (!enableAdminConsole) {
                      alert("Console admin désactivée pour cet environnement.");
                      return;
                    }
                    if (!isAdmin) {
                      alert("Accès admin refusé.");
                      return;
                    }
                   setShowAdmin(true);
                 }}
                 className="opacity-10 hover:opacity-100 transition-opacity p-2"
               >
                 <Bot size={16} />
               </button>
               <Link to="/partners" className="text-yellow-500/50 hover:text-yellow-500 text-xs uppercase tracking-widest border border-yellow-500/20 px-4 py-2 rounded">
                 Programme Affiliation
               </Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
