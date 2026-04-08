# Guide mise en ligne + CRM + contenu (sans coder)

## 1) Architecture recommandée

- Frontend Vite/React: Render Static Site (`black-papers-web`)
- Backend Node: Render Web Service (`black-papers-api`)
- Données locales backend: disque persistant Render (`backend/data`)

## 2) Déploiement Render (Blueprint)

1. Poussez le repo sur GitHub.
2. Créez un Blueprint Render depuis le repo (`render.yaml`).
3. Vérifiez les variables backend critiques:
   - `APP_ENV=production`
   - `ADMIN_BOOTSTRAP_EMAIL`
   - `ADMIN_BOOTSTRAP_PASSWORD`
   - `SESSION_TOKEN_SECRET`
   - `ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP=false`
   - `ALLOW_DEV_SUBSCRIPTION_STUB=false`
4. Vérifiez les variables frontend:
   - `VITE_API_BASE_URL` (auto lié au service API)
   - `VITE_ENABLE_ADMIN_CONSOLE=false` en prod

## 3) Paiement Lemon Squeezy (production)

Ajoutez dans le service API:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_VARIANT_ID_BOURSE`
- `LEMON_VARIANT_ID_CRYPTO`
- `LEMON_VARIANT_ID_COMBO`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`

Optionnel:
- `LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL`
- `LEMON_SQUEEZY_CHECKOUT_CANCEL_URL`

Webhook Lemon:
- URL: `https://votre-api.onrender.com/api/webhooks/lemon-squeezy`

## 4) Vérifications après déploiement

1. `GET /api/health` -> `ok: true`
2. `GET /api/subscription/config` -> plans Lemon disponibles
3. Checkout depuis la modale -> redirection Lemon
4. Retour checkout -> session rechargée
5. Webhook -> statut abonnement synchronisé
6. `/api/trades` protégé (refus non-abonné)

## 5) CRM sans coder (console admin)

Accès:
1. Connectez-vous avec un compte admin.
2. Ouvrez `ADMIN`.
3. Onglet `CRM CLIENTS`.

Fonctions:
- voir les métriques funnel (leads, VIP, onboarding, annulations)
- consulter les leads capturés
- exporter les leads au format CSV (`/api/admin/crm/leads.csv`)
- créer des comptes test
- modifier plan/statut/VIP manuel/email vérifié

Si vous perdez l’accès admin:

```bash
npm run admin:reset -- --email=admin@votredomaine.com --password='MotDePasseTresFort!2026'
```

## 6) Publier signaux et articles sans coder

- Signaux VIP: onglet `SIGNAUX VIP`
  - ajoutez/modifiez les lignes de trade
  - mettez à jour l’analyse marché
- Articles: onglet `IA GÉNÉRATEUR`
  - publication manuelle ou génération assistée
  - import RSS auto (5 items) en brouillon ou publication directe

## 7) Flux X/Twitter (stratégie honnête)

- Intégration actuelle: curation manuelle backend (`/api/social/x-feed`), modifiable en admin.
- Cette approche évite le scraping non fiable et les faux flux.
- Pour un flux automatique officiel, il faut un compte développeur X et un accès API actif.
## 8) Points d’exploitation importants

- Le backend reste la source de vérité pour l’accès premium.
- Le frontend ne peut pas activer un abonnement seul.
- Gardez `VITE_ENABLE_ADMIN_CONSOLE=false` en production publique.
- Sauvegardez et protégez les variables d’environnement sur Render.
