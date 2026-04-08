
import React from 'react';

export enum ContentType {
  VIDEO = 'VIDEO',
  TRADE_SIGNAL = 'TRADE_SIGNAL',
  PORTFOLIO_UPDATE = 'PORTFOLIO_UPDATE',
  ARTICLE = 'ARTICLE'
}

export interface TradeScenario {
  label: 'A' | 'B' | 'C';
  description: string;
  probability: number; // 0-100
}

export interface TradeLevels {
  entry: number;
  exit: number;
  stopLoss: number;
}

export interface TradeDetails {
  // PHASE 1: AVANT (ANALYSE)
  asset: string; // ex: BTC/USDT
  direction: 'LONG' | 'SHORT';
  macroContext: string;
  technicalZoneImage?: string; // Placeholder for chart URL
  scenarios: TradeScenario[];
  levels: TradeLevels;
  riskRewardRatio: number;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // PHASE 2: APRÈS (JOURNAL)
  isCompleted: boolean;
  executionTime?: string;
  entryReason?: string;
  exitReason?: string;
  mistake?: string;
  lesson?: string;
  pnlPercentage?: number;
  scores?: {
    execution: number; // 1-10
    result: number; // 1-10
  };
  emotionalState?: 'CALM' | 'FOMO' | 'REVENGE' | 'HESITANT' | 'CONFIDENT';
}

export interface Post {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  content: string; // Fallback content or extra notes
  date: string;
  isLocked: boolean;
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
  autoSourceUrl?: string;
  autoSourceName?: string;
  autoPublishedAt?: string;
  tags: string[];
  tradeDetails?: TradeDetails; // Optional, only for TRADE_SIGNAL
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface InsiderSnippet {
  id: string;
  source: 'BLOOMBERG' | 'WHALE_ALERT' | 'REDDIT_WSB' | 'INSIDER_TWITTER' | 'REUTERS';
  text: string;
  timestamp: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PortfolioData {
  date: string;
  value: number;
}

export interface Trade {
  actif: string;
  market?: 'CRYPTO' | 'BOURSE';
  direction: 'Long' | 'Short';
  entree: number;
  sl: number;
  tp: number;
  taille: string;
  raison: string;
  heure: string;
}

export interface Tweet {
  id: string;
  authorName: string;
  handle: string;
  avatar: string; // url or initials
  content: string;
  likes: number;
  retweets: number;
  timestamp: string;
  isVerified: boolean;
}

export interface ExternalRSSNews {
  id: string;
  source: string; // e.g., 'CoinDesk', 'CNBC'
  title: string;
  url: string;
  timeAgo: string;
}

export interface NewsFeedItem {
  id: string;
  source: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  sparkline: number[];
}

export interface CRMContact {
  id: string;
  identifier: string; // Email or Anon ID
  status: 'ACTIVE' | 'EXPIRED' | 'LEAD' | 'BANNED';
  plan: 'CRYPTO' | 'BOURSE' | 'FULL' | 'NONE';
  joinedDate: string;
  affiliateSource?: string; // Ref code
  totalSpent: number; // in USDT
  lastLogin: string;
  notes?: string;
  // New fields for Hybrid Payment Logic
  paymentMethod?: 'LEMON_SQUEEZY' | 'CRYPTO_GATEWAY';
  paymentStatus?: 'PAID' | 'LATE' | 'PENDING_VERIFICATION';
}

// --- ACADEMY TYPES ---
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export type AcademyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  level?: AcademyLevel;
  durationMinutes?: number;
  icon: React.ReactNode;
  content: {
    title: string;
    text: string;
    diagram?: 'CANDLES' | 'TREND' | 'RISK' | 'ORDERBOOK'; // identifiers for rendering SVG
  }[];
}

// --- REVIEWS TYPES ---
export interface Review {
  id: string;
  author: string;
  role: 'USER' | 'INFLUENCER' | 'VIP'; // INFLUENCER gets special styling
  avatar?: string;
  rating: number; // 1-5
  date: string;
  content: string;
  analysis?: string;
  type: 'TEXT' | 'VIDEO';
  videoUrl?: string; // URL for video thumbnail or embed
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  platform?: 'Twitter' | 'YouTube' | 'Telegram'; // Source of the review if influencer
  pnlProof?: boolean; // If true, shows "Verified PnL" badge
  createdAt?: string | null;
  updatedAt?: string | null;
}

// --- AFFILIATE TYPES ---
export interface AffiliateCommission {
  id: string;
  amount: number;
  sourceUser: string; // "User X purchased"
  dateCreated: string;
  status: 'LOCKED' | 'READY_TO_PAY' | 'PAID';
  daysRemaining?: number; // Only for LOCKED (Net-30 countdown)
  payoutMethod: 'FIAT' | 'CRYPTO';
}
