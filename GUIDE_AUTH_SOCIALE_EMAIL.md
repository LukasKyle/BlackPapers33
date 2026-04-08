# Auth Sociale + Emails Transactionnels

Ce guide couvre la configuration manuelle nécessaire pour activer les providers OAuth et l'envoi d'emails.

## 0) Pourquoi les boutons sociaux sont gris

Le frontend lit `GET /api/auth/oauth/providers`.
Chaque provider passe à `true` uniquement si toutes ses variables backend sont renseignées:

- Google: `OAUTH_GOOGLE_CLIENT_ID` + `OAUTH_GOOGLE_CLIENT_SECRET`
- Facebook: `OAUTH_FACEBOOK_CLIENT_ID` + `OAUTH_FACEBOOK_CLIENT_SECRET`
- LinkedIn: `OAUTH_LINKEDIN_CLIENT_ID` + `OAUTH_LINKEDIN_CLIENT_SECRET`
- Apple: `OAUTH_APPLE_CLIENT_ID` + `OAUTH_APPLE_TEAM_ID` + `OAUTH_APPLE_KEY_ID` + `OAUTH_APPLE_PRIVATE_KEY_BASE64`

Si rien n'est configuré, le message "aucun provider social n'est encore configuré côté serveur" est attendu.

## 1) Variables d'environnement backend

Configurer au minimum:

- `PUBLIC_APP_URL`
- `BACKEND_PUBLIC_URL`
- `SESSION_TOKEN_SECRET`
- `CORS_ORIGIN`

Pour les emails:

- `EMAIL_PROVIDER` (`console` ou `resend`)
- `EMAIL_FROM`
- `RESEND_API_KEY` (si `EMAIL_PROVIDER=resend`)
- `EMAIL_VERIFY_TOKEN_TTL_HOURS`
- `EMAIL_TOKEN_SECRET`

Pour OAuth:

- Google: `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`
- Facebook: `OAUTH_FACEBOOK_CLIENT_ID`, `OAUTH_FACEBOOK_CLIENT_SECRET`
- LinkedIn: `OAUTH_LINKEDIN_CLIENT_ID`, `OAUTH_LINKEDIN_CLIENT_SECRET`
- Apple: `OAUTH_APPLE_CLIENT_ID`, `OAUTH_APPLE_TEAM_ID`, `OAUTH_APPLE_KEY_ID`, `OAUTH_APPLE_PRIVATE_KEY_BASE64`

Sur Render, ces variables doivent être ajoutées dans le service backend (API), pas dans le Static Site frontend.

## 2) URLs de callback OAuth (backend)

Les callbacks doivent pointer vers le backend:

- Google: `${BACKEND_PUBLIC_URL}/api/auth/oauth/google/callback`
- Facebook: `${BACKEND_PUBLIC_URL}/api/auth/oauth/facebook/callback`
- LinkedIn: `${BACKEND_PUBLIC_URL}/api/auth/oauth/linkedin/callback`
- Apple: `${BACKEND_PUBLIC_URL}/api/auth/oauth/apple/callback`

Exemple concret (Render):

- `BACKEND_PUBLIC_URL=https://black-papers-api.onrender.com`
- callback Google = `https://black-papers-api.onrender.com/api/auth/oauth/google/callback`

## 3) Google OAuth

- Compte développeur: oui (Google Cloud Console).
- Domaine validé: recommandé (OAuth consent screen).
- Callback: obligatoire.
- Revue app: nécessaire si scopes sensibles; non nécessaire en mode test interne.
- Scopes utilisés: `openid email profile`.
- Faisable immédiatement: oui (le plus simple à activer en premier).

Step-by-step rapide :

1. Aller sur Google Cloud Console.
2. Créer un projet.
3. Configurer l'écran de consentement OAuth.
4. Créer un client OAuth 2.0 (type Web).
5. Ajouter l'URI de callback Google.
6. Copier `Client ID` et `Client Secret`.
7. Les coller dans Render:
   - `OAUTH_GOOGLE_CLIENT_ID`
   - `OAUTH_GOOGLE_CLIENT_SECRET`
8. Redéployer le backend.

## 4) Facebook OAuth

- Compte développeur: oui (Meta for Developers).
- Domaine validé: oui pour production.
- Callback: obligatoire.
- Revue app: souvent requise avant passage live.
- Permissions utilisées: `email`, `public_profile`.
- Faisable immédiatement: oui, mais la revue Meta peut ralentir le passage en production.

Step-by-step rapide :

1. Aller sur Meta for Developers.
2. Créer une app.
3. Ajouter le produit Facebook Login.
4. Définir `Valid OAuth Redirect URIs` avec la callback Facebook backend.
5. Copier App ID / App Secret.
6. Les coller dans Render:
   - `OAUTH_FACEBOOK_CLIENT_ID`
   - `OAUTH_FACEBOOK_CLIENT_SECRET`
7. Passer l'app en mode adapté (dev/live selon votre phase).

## 5) LinkedIn OAuth

- Compte développeur: oui (LinkedIn Developer Portal).
- Domaine validé: oui.
- Callback: obligatoire.
- Revue app: dépend des produits LinkedIn activés.
- Scopes utilisés: `openid profile email`.
- Faisable immédiatement: oui, mais interface dev plus stricte que Google.

Step-by-step rapide :

1. Aller sur LinkedIn Developer Portal.
2. Créer une application.
3. Renseigner les URLs autorisées (callback LinkedIn backend).
4. Activer les produits OAuth/OpenID nécessaires.
5. Copier `Client ID` / `Client Secret`.
6. Les coller dans Render:
   - `OAUTH_LINKEDIN_CLIENT_ID`
   - `OAUTH_LINKEDIN_CLIENT_SECRET`
7. Redéployer le backend.

## 6) Apple Sign In

- Compte développeur: oui (Apple Developer Program payant).
- Domaine validé: oui (Services ID + domaine + return URL).
- Callback: obligatoire.
- Revue app: selon votre distribution.
- Clé privée: convertir la clé `.p8` en base64 et renseigner `OAUTH_APPLE_PRIVATE_KEY_BASE64`.
- Faisable immédiatement: souvent non, car compte Apple Developer payant + configuration plus lourde.

Exemple de conversion base64:

```bash
base64 -i AuthKey_XXXXXXXXXX.p8
```

Step-by-step rapide :

1. Ouvrir Apple Developer (compte payant requis).
2. Créer un `Services ID` pour Sign in with Apple.
3. Configurer le domaine + la return URL (callback Apple backend).
4. Créer une clé Sign in with Apple (`.p8`) + récupérer `Key ID`.
5. Récupérer aussi `Team ID` et `Client ID` (Services ID).
6. Convertir la clé `.p8` en base64.
7. Ajouter dans Render:
   - `OAUTH_APPLE_CLIENT_ID`
   - `OAUTH_APPLE_TEAM_ID`
   - `OAUTH_APPLE_KEY_ID`
   - `OAUTH_APPLE_PRIVATE_KEY_BASE64`
8. Redéployer le backend.

## 7) Vérification email + bienvenue

- À l'inscription email/password: envoi d'un email de vérification.
- À la validation du lien: email marqué vérifié + email de bienvenue envoyé.
- En OAuth:
  - si email provider vérifié => compte validé directement;
  - sinon => email de vérification envoyé.

## 8) Endpoint de contrôle

Pour vérifier les providers actifs côté backend:

```bash
GET /api/auth/oauth/providers
```

Le frontend affiche les boutons sociaux selon ce statut.
Si aucun provider n'est `true`, les boutons restent désactivés et la modale affiche les callbacks attendus.

## 9) Pourquoi un provider reste grisé

1. Une variable manque (client id ou secret incomplet).
2. Callback provider différente de `BACKEND_PUBLIC_URL`.
3. Redéploiement backend non effectué après ajout des variables.
4. App provider encore en mode restreint (non publiée / non autorisée).
5. Domaine non validé côté provider.

Contrôle rapide:

1. Appeler `GET /api/auth/oauth/providers`.
2. Vérifier que le provider ciblé passe à `true`.
3. Tester le bouton social depuis la modale login/signup.
