# Black Papers

Projet full-stack avec:
- frontend `React + Vite` (site statique)
- backend `Node.js` (API HTTP native)

Le dépôt est préparé pour un déploiement GitHub -> Render avec séparation frontend/backend.

## Structure

- `App.tsx`, `components/`, `hooks/`, `services/`: frontend
- `backend/server.cjs`: API backend
- `backend/data/store.json`: stockage local backend (fichier ignoré par Git)
- `render.yaml`: blueprint Render (backend + frontend)

## Démarrage local

```bash
npm ci
cp .env.example .env
npm run dev
```

URL locale frontend: `http://localhost:5173`  
URL locale backend: `http://localhost:8787`

## Scripts

- `npm run dev`: lance frontend + backend en local
- `npm run start`: lance uniquement le backend
- `npm run build`: build frontend Vite
- `npm run preview`: preview frontend build
- `npm run check`: vérification backend + build frontend
- `npm run admin:reset -- --email=<email> --password=<motdepassefort>`: créer/réinitialiser un admin local

## Variables d’environnement

### Backend (privées, Render Web Service)

- `APP_ENV` (`production` sur Render)
- `PORT`
- `CORS_ORIGIN`
- `PUBLIC_APP_URL`
- `BACKEND_PUBLIC_URL`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD` (secret)
- `ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP`
- `ALLOW_DEV_SUBSCRIPTION_STUB`
- `MAX_JSON_BODY_BYTES`
- `LEMON_SQUEEZY_API_KEY` (secret)
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_WEBHOOK_SECRET` (secret)
- `LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL` (optionnel)
- `LEMON_SQUEEZY_CHECKOUT_CANCEL_URL` (optionnel)
- `LEMON_VARIANT_ID_BOURSE`
- `LEMON_VARIANT_ID_CRYPTO`
- `LEMON_VARIANT_ID_COMBO`
- `LEMON_CHECKOUT_URL_BOURSE` (fallback URL mode)
- `LEMON_CHECKOUT_URL_CRYPTO` (fallback URL mode)
- `LEMON_CHECKOUT_URL_COMBO` (fallback URL mode)
- `SESSION_TOKEN_SECRET` (secret)
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAME_SITE`
- `SESSION_IDLE_TTL_HOURS`
- `SESSION_MAX_TTL_DAYS`
- `SESSION_ROTATION_MINUTES`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_AUTH`
- `RATE_LIMIT_MAX_PUBLIC_WRITE`
- `RATE_LIMIT_MAX_SUBSCRIPTION`
- `RATE_LIMIT_MAX_ADMIN`
- `REQUIRE_EMAIL_VERIFIED`
- `EMAIL_PROVIDER` (`console` ou `resend`)
- `EMAIL_FROM`
- `RESEND_API_KEY` (si `EMAIL_PROVIDER=resend`)
- `EMAIL_VERIFY_TOKEN_TTL_HOURS`
- `EMAIL_TOKEN_SECRET`
- `RSS_REQUEST_TIMEOUT_MS`
- `MARKET_REQUEST_TIMEOUT_MS`
- `MARKET_CACHE_TTL_MS`
- `VIP_ACTIVITY_WINDOW_MINUTES`
- `OAUTH_STATE_TTL_MINUTES`
- `OAUTH_GOOGLE_CLIENT_ID`
- `OAUTH_GOOGLE_CLIENT_SECRET`
- `OAUTH_FACEBOOK_CLIENT_ID`
- `OAUTH_FACEBOOK_CLIENT_SECRET`
- `OAUTH_LINKEDIN_CLIENT_ID`
- `OAUTH_LINKEDIN_CLIENT_SECRET`
- `OAUTH_APPLE_CLIENT_ID`
- `OAUTH_APPLE_TEAM_ID`
- `OAUTH_APPLE_KEY_ID`
- `OAUTH_APPLE_PRIVATE_KEY_BASE64`

### Frontend (publiques, Render Static Site)

- `VITE_API_BASE_URL`
- `VITE_ENABLE_ADMIN_CONSOLE` (mettre `false` en production)
- `VITE_DEV_ALLOWED_HOST` (optionnel, dev tunnel uniquement)

## Déploiement Render (GitHub)

Le fichier `render.yaml` est prêt pour créer:
1. `black-papers-api` (Web Service Node)
2. `black-papers-web` (Static Site Vite)

### Étapes

1. Pousser le dépôt sur GitHub.
2. Dans Render, créer un **Blueprint** depuis le repo.
3. Renseigner les secrets backend:
   - `ADMIN_BOOTSTRAP_EMAIL`
   - `ADMIN_BOOTSTRAP_PASSWORD`
   - `SESSION_TOKEN_SECRET`
4. Déployer.

Le frontend reçoit automatiquement l’URL de l’API via `fromService`.

## Notes sécurité

- Auth sociale via flux OAuth serveur (Google/Facebook/LinkedIn/Apple) avec callback backend.
- Vérification email + endpoint de renvoi de lien.
- Restauration de session legacy désactivée.
- Les secrets ne doivent jamais être exposés en `VITE_*`.
- Le backend valide les accès premium et la segmentation Bourse/Crypto côté serveur.

## Flux dynamiques (Lot 2)

- RSS blog: `GET /api/news-feed` (Google News RSS multi-sources + fallback local)
- Ticker home: `GET /api/market-ticker` (stocks + crypto, mode `live|partial|fallback`)
- Tableau actions: `GET /api/stocks` (source backend, pas de simulation frontend)
- Veille X: `GET /api/social/x-feed` (mode curation manuelle honnête)
- Widget VIP: `GET /api/vip/activity` (sessions réelles, accès VIP requis)
- Édition no-code signaux VIP: `PATCH /api/admin/trades` (via console admin frontend)
- Import auto RSS admin: `POST /api/admin/posts/auto-rss-drafts` (brouillons par défaut, publication directe optionnelle)
- Starter kit: `POST /api/leads` enregistre le lead et envoie un email de lien Starter Kit
- Avis: `POST /api/reviews` réservé aux membres VIP, publication après validation admin

## Paiement et CRM (Lot 3)

- Config publique checkout: `GET /api/subscription/config`
- Démarrage checkout Lemon: `POST /api/subscription/checkout` (auth requis)
- Webhook Lemon signé: `POST /api/webhooks/lemon-squeezy`
- Capture leads: `POST /api/leads`
- Vue CRM admin: `GET /api/admin/crm/overview`
- Export CRM admin (CSV): `GET /api/admin/crm/leads.csv`

Le frontend ne valide jamais un abonnement seul: l’activation premium reste pilotée côté serveur.

## Notes X/Twitter

- Ce dépôt utilise une curation manuelle de comptes X (pas de scraping ni faux flux "live").
- Pour un vrai flux automatique X, il faut un compte développeur X + accès API officiel (souvent payant), puis implémenter la sync serveur.

## Hygiène dépôt

- `.env` et variantes locales sont ignorés.
- `dist/` n’est pas versionné.
- `backend/data/store.json` n’est pas versionné.

## Accès admin

- Connexion admin: utilisez un compte avec `isAdmin=true`.
- Si vous avez perdu le mot de passe admin, utilisez le script:

```bash
npm run admin:reset -- --email=admin@votredomaine.com --password='MotDePasseTresFort!2026'
```

- Ce script met à jour (ou crée) un compte admin vérifié avec accès complet.
- Le mot de passe existant n’est pas récupérable (hashé), il faut le réinitialiser.

## Validation post-déploiement

- `GET /api/health` renvoie `200`.
- Inscription / connexion / déconnexion fonctionnelles.
- Accès `/api/trades` refusé sans abonnement actif.
- Accès admin refusé pour un compte non admin.
- Console admin frontend désactivée en production (`VITE_ENABLE_ADMIN_CONSOLE=false`).

## Guides complémentaires

- [GUIDE_BACKEND_TEST.md](./GUIDE_BACKEND_TEST.md)
- [GUIDE_MISE_EN_LIGNE_CRM.md](./GUIDE_MISE_EN_LIGNE_CRM.md)
- [GUIDE_LEMON_CRM_OPERATIONS.md](./GUIDE_LEMON_CRM_OPERATIONS.md)
- [GUIDE_AUTH_SOCIALE_EMAIL.md](./GUIDE_AUTH_SOCIALE_EMAIL.md)
- [SECURITY.md](./SECURITY.md)
