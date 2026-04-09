# Guide de test grandeur nature (frontend + backend)

## 1) Lancer le projet en local

```bash
npm ci
cp .env.example .env
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## 2) Variables minimales pour tester

Dans `.env`:

```env
APP_ENV=development
VITE_API_BASE_URL=http://localhost:8787
VITE_ENABLE_ADMIN_CONSOLE=true
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=<MOT_DE_PASSE_FORT>
SESSION_TOKEN_SECRET=<SECRET_LONG_ALEATOIRE>
ALLOW_DEV_SUBSCRIPTION_STUB=false
SESSION_PERSISTENT_LOGIN=true
PERSISTENT_SESSION_TTL_DAYS=3650
```

## 3) Premier accès admin

1. Ouvrir le site.
2. Cliquer `Connexion`.
3. Se connecter avec `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`.
4. Ouvrir `ADMIN`.

Si vous ne connaissez plus le mot de passe admin:

```bash
npm run admin:reset -- --email=admin@local.dev --password='MotDePasseTresFort!2026'
```

Puis reconnectez-vous avec cet email/mot de passe.

## 3 bis) Dépannage connexion qui ne tient pas (modale qui se ferme puis rien)

Symptôme : le login semble passer, mais vous retombez en état non connecté.

Cause la plus fréquente : cookie de session non persisté (CORS / SameSite / Secure).

Checklist rapide :

1. Vérifier dans DevTools `Network` :
   - `POST /api/auth/login` doit renvoyer `200`.
   - la réponse doit contenir `Set-Cookie: bp_session=...`.
2. Vérifier que le frontend appelle le bon backend (`VITE_API_BASE_URL`).
3. En HTTPS sur Render :
   - `SESSION_COOKIE_SECURE=true`
   - `SESSION_COOKIE_SAME_SITE=None`
4. Vérifier `CORS_ORIGIN` :
   - doit être l'URL exacte du frontend (ou la liste exacte autorisée).
5. Tester la session backend :
   - `GET /api/auth/session` doit renvoyer l'utilisateur connecté.

Si `POST /api/auth/login` retourne `200` mais que `GET /api/auth/session` retourne `401`, le cookie est bloqué côté navigateur.

## 3 ter) Tester "mot de passe oublié"

1. Depuis la modale `Connexion`, cliquer `Mot de passe oublié ?`.
2. Entrer l'email du compte.
3. Vérifier l'email reçu :
   - `EMAIL_PROVIDER=console` : lien affiché dans les logs backend.
   - `EMAIL_PROVIDER=resend` : email réel.
4. Ouvrir le lien (il contient `reset_token`).
5. Définir un nouveau mot de passe (8+ caractères).
6. Vérifier que la connexion fonctionne avec le nouveau mot de passe.

## 4) Tester Lemon Squeezy (mode serveur)

### A. Préparer la config

Ajoutez dans `.env`:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_VARIANT_ID_BOURSE`
- `LEMON_VARIANT_ID_CRYPTO`
- `LEMON_VARIANT_ID_COMBO`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`

### B. Vérifier l’API

```bash
curl -s http://localhost:8787/api/subscription/config
```

Attendu: plans Lemon actifs par offre (`bourse/crypto/combo`).

## 5) Tester la capture lead et CRM

1. Sur la home, entrez un email dans le bloc starter.
2. Vérifiez l’appel `POST /api/leads` (DevTools Network).
3. Vérifiez l’envoi de l’email Starter Kit:
   - `EMAIL_PROVIDER=console`: lien affiché dans les logs backend.
   - `EMAIL_PROVIDER=resend`: email réel envoyé au contact.
4. En admin > `CRM CLIENTS`, vérifiez le lead dans `Derniers leads`.

## 6) Gérer utilisateurs, signaux, articles sans coder

- Onglet `CRM CLIENTS`:
  - créer compte test
  - modifier plan, statut, VIP manuel, email vérifié
- Onglet `SIGNAUX VIP`:
  - ajouter/modifier trades
  - sauvegarder l’analyse marché
- Onglet `IA GÉNÉRATEUR`:
  - publier/modifier articles
  - importer 5 articles RSS auto (brouillons ou publiés)

## 7) Données locales de test

Le stockage backend est dans:
- `backend/data/store.json`

Ce fichier contient utilisateurs, sessions, leads, posts, reviews, signaux.

## 8) Réinitialiser l’environnement local

1. Stopper le serveur.
2. Supprimer `backend/data/store.json`.
3. Relancer `npm run dev`.

## 9) Checklist rapide avant passage staging

1. Inscription / login / logout OK
2. Vérification email OK
3. Checkout Lemon démarre depuis la modale
4. `/api/trades` refusé sans VIP
5. Segmentation bourse/crypto respectée
6. Admin accessible uniquement compte admin

## 9 bis) Rappel mise en production : email onboarding + starter kit

À valider avant passage public :
1. L’email onboarding doit reprendre le même contenu que l’email starter kit.
2. Le client doit recevoir dans cet email :
   - le lien vers le module 1 (jargon),
   - le lien vers le module 2 (choix plateforme),
   - le lien vers la vidéo du starter kit.
3. Vérifier en environnement réel :
   - `EMAIL_PROVIDER=resend`,
   - domaine expéditeur validé,
   - délivrabilité (SPF/DKIM/DMARC).
4. Supprimer avant production tous les comptes de test et tout mot de passe en dur :
   - aucun identifiant de test dans `store.json`,
   - aucun mot de passe en clair dans le code, la doc ou les fichiers versionnés,
   - rotation des secrets (`ADMIN_BOOTSTRAP_PASSWORD`, clés API, tokens) avant ouverture publique.
5. Vérifier strictement la configuration session/cookies en production :
   - `SESSION_TOKEN_SECRET` : obligatoire, long, aléatoire, jamais versionné.
   - `SESSION_COOKIE_NAME` : cohérent et stable (`bp_session` recommandé).
   - `SESSION_COOKIE_SECURE=true` en HTTPS.
   - `SESSION_COOKIE_SAME_SITE=None` si frontend et backend sont sur des sous-domaines différents.
   - `SESSION_IDLE_TTL_HOURS` : durée d’inactivité acceptable (ex: 12h).
   - `SESSION_MAX_TTL_DAYS` : durée max de session (ex: 14j).
   - `SESSION_ROTATION_MINUTES` : rotation régulière (ex: 30 min).
   - `SESSION_PERSISTENT_LOGIN` / `PERSISTENT_SESSION_TTL_DAYS` : activer seulement si besoin métier validé.

## 10) Step-by-step admin (non technique)

1. Ouvrir le site.
2. Cliquer `Connexion`.
3. Entrer l'email admin et le mot de passe admin.
4. Ouvrir `Compte` puis cliquer `Ouvrir admin`.
5. Vérifier l'accès admin :
   - la console admin s'affiche,
   - les onglets CRM / Signaux / Articles sont visibles.
6. Vérifier côté backend :
   - `GET /api/admin/health` doit répondre `{"ok":true,"role":"admin"}`.
7. Si échec :
   - lancer `npm run admin:reset -- --email=<EMAIL_ADMIN> --password='<MOT_DE_PASSE_FORT>'`,
   - se reconnecter avec ces nouveaux identifiants,
   - revalider `GET /api/admin/health`.
