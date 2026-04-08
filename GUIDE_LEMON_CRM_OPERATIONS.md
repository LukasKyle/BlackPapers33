# Guide Lemon Squeezy + CRM + Exploitation

Ce guide couvre le lot 3: paiement Lemon Squeezy, suivi CRM léger, et opérations admin quotidiennes sans modifier le code.

## 1) Lemon Squeezy: ce que vous devez configurer

### A. Créer les offres

Dans Lemon Squeezy:
1. Créez un produit `Black Papers`.
2. Créez 3 variants:
   - `Bourse` (mensuel)
   - `Crypto` (mensuel)
   - `Combo` (mensuel)
3. Copiez les `Variant ID` de chaque offre.

### B. Variables backend à renseigner

Dans Render (service `black-papers-api`), ajoutez:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_VARIANT_ID_BOURSE`
- `LEMON_VARIANT_ID_CRYPTO`
- `LEMON_VARIANT_ID_COMBO`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `LEMON_SQUEEZY_CHECKOUT_SUCCESS_URL` (optionnel)
- `LEMON_SQUEEZY_CHECKOUT_CANCEL_URL` (optionnel)

Si vous ne voulez pas utiliser l’API Lemon immédiatement, vous pouvez temporairement renseigner:
- `LEMON_CHECKOUT_URL_BOURSE`
- `LEMON_CHECKOUT_URL_CRYPTO`
- `LEMON_CHECKOUT_URL_COMBO`

## 2) Webhook Lemon à créer

Dans Lemon Squeezy > Webhooks:
1. URL webhook: `https://VOTRE-API/api/webhooks/lemon-squeezy`
2. Copiez le secret webhook dans `LEMON_SQUEEZY_WEBHOOK_SECRET`.
3. Activez les événements de souscription (création, mise à jour, annulation, expiration).

Le backend met à jour le statut d’abonnement côté serveur, jamais côté frontend.

## 3) Mapping des plans côté produit

- Variant `Bourse` -> `subscriptionPlan = bourse`
- Variant `Crypto` -> `subscriptionPlan = crypto`
- Variant `Combo` -> `subscriptionPlan = combo`

Effet attendu:
- `bourse`: accès signaux bourse uniquement
- `crypto`: accès signaux crypto uniquement
- `combo`: accès aux deux
- accès formation VIP si compte VIP actif

## 4) CRM: options et choix recommandé

### Options réalistes
1. CRM interne (déjà intégré dans la console admin) -> recommandé
2. HubSpot Free (freemium, bon pour pipeline marketing/vente externe)

### Choix appliqué dans le projet

Le projet utilise un CRM interne léger:
- capture lead via `POST /api/leads`
- pipeline dans la console admin (onglet `CRM CLIENTS`)
- suivi onboarding / activation VIP / statut abonnement

## 5) Mini manuel non-technique CRM

### Voir un contact
1. Connectez-vous en admin.
2. Ouvrez `ADMIN` > onglet `CRM CLIENTS`.
3. Consultez le tableau `Derniers leads`.
4. Les leads Starter Kit (capture home) déclenchent aussi un email avec le lien `/starter-kit`.
5. Pour exporter les leads: bouton `Export CSV` (ou endpoint `/api/admin/crm/leads.csv`).

### Suivre un inscrit
1. Vérifiez `Statut lead` (`LEAD`, `REGISTERED`, `VIP_ACTIVE`).
2. Vérifiez `Plan` et `Statut abo`.
3. Vérifiez l’heure de mise à jour (`Maj`).

### Suivre onboarding / activation VIP
1. En haut de l’onglet CRM, regardez:
   - `Onboarding à terminer`
   - `VIP actifs`
   - `Vérification email en attente`
2. Si besoin, modifiez l’utilisateur dans la grille des comptes (plan, statut, VIP manuel).

## 6) Note admin: actions quotidiennes

### Donner un accès VIP manuel
1. Ouvrir `ADMIN` > `CRM CLIENTS`.
2. Dans la ligne utilisateur, bouton `VIP manuel`.

### Modifier abonnement utilisateur
1. Dans la même grille, modifier:
   - `Plan` (`bourse|crypto|combo|NONE`)
   - `Statut` (`ACTIVE|PENDING_VERIFICATION|PAST_DUE|CANCELED|NONE`)

### Publier/modifier signaux et articles
- Signaux VIP: onglet `SIGNAUX VIP`
- Articles: onglet `IA GÉNÉRATEUR` (mode manuel + import RSS auto en brouillons)

### Si l'accès admin est perdu

```bash
npm run admin:reset -- --email=admin@votredomaine.com --password='MotDePasseTresFort!2026'
```

Le mot de passe existant n'est pas lisible (hashé), il faut le réinitialiser.

## 7) Tests post-déploiement à exécuter

1. `GET /api/health` renvoie `ok: true`.
2. `GET /api/subscription/config` renvoie plans Lemon configurés.
3. Démarrer un checkout depuis la modale abonnement -> redirection Lemon.
4. Retour `?checkout=success` -> session rechargée.
5. Webhook Lemon reçu -> statut utilisateur mis à jour.
6. Non-abonné -> `/api/trades` refusé.
7. Abonné bourse -> pas d’accès signaux crypto.
8. Abonné crypto -> pas d’accès signaux bourse.
9. Admin -> accès complet + CRM visible.
