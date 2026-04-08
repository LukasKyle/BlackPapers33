# Security Notes

## Default Security Posture

This project now runs in a fail-closed mode by default:

- VIP data endpoints are denied unless server-side subscription checks pass.
- Admin console is disabled unless explicitly enabled.
- User-provided external video links are validated (`http/https` only, no localhost).
- Referral codes from URL are sanitized before storage.
- Frontend AI provider calls are disabled (no client-side API secrets).
- Frontend import versions are pinned in `index.html`.

## Required Environment Variables

Set these only in trusted environments:

- `APP_ENV`: `development` | `staging` | `production`.
- `VITE_ENABLE_ADMIN_CONSOLE`:
  - `false` (default): disables admin console access from UI.
  - `true`: enables admin console entry in UI (backend admin auth still required).
- `VITE_API_BASE_URL`: backend API origin for auth/session/subscription checks.
- `ADMIN_BOOTSTRAP_EMAIL`: first admin email.
- `ADMIN_BOOTSTRAP_PASSWORD`: strong bootstrap password (required in production/staging on first store init).
- `ENABLE_LOCAL_RANDOM_ADMIN_BOOTSTRAP`: local-only convenience, must be `false` in production/staging.
- `ALLOW_DEV_SUBSCRIPTION_STUB`: optional dev stub, forbidden in production/staging.
- `MAX_JSON_BODY_BYTES`: maximum accepted JSON payload size.
- `SESSION_TOKEN_SECRET`: long random secret for session token hashing (required in production/staging).
- `SESSION_COOKIE_SECURE`: must be `true` in production/staging.
- `SESSION_COOKIE_SAME_SITE`: `Lax` / `Strict` / `None`.
- `SESSION_IDLE_TTL_HOURS`: idle session expiration.
- `SESSION_MAX_TTL_DAYS`: absolute session lifetime cap.
- `SESSION_ROTATION_MINUTES`: token rotation interval.
- `RATE_LIMIT_WINDOW_MS`: rate limit window size in milliseconds.
- `RATE_LIMIT_MAX_AUTH`: max login/signup attempts per IP per window.
- `RATE_LIMIT_MAX_PUBLIC_WRITE`: max public write attempts (reviews) per IP per window.
- `RATE_LIMIT_MAX_SUBSCRIPTION`: max subscription verification attempts per IP per window.
- `RATE_LIMIT_MAX_ADMIN`: max admin endpoint requests per IP per window.

## Production Recommendations

- Move authentication, subscription validation, and admin authorization to a backend.
- Never expose privileged API keys in browser bundles.
- Add Subresource Integrity (SRI) or self-host dependencies.
- Add server-side CSP and security headers (do not rely on meta tags only).
- Validate and sanitize all user-generated content on the server before persistence.

## Backend Security Notes

- Backend endpoints gate session and subscription state server-side.
- Session tokens are issued in `HttpOnly` cookies and persisted server-side as hashed values (HMAC-SHA256), with expiration and rotation.
- Passwords are stored hashed with `scrypt`.
- API responses include hardened security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, strict CSP for API).
- Write-heavy endpoints are protected by IP-based rate limiting.
- Social auth endpoint is disabled until provider token verification is implemented server-side.
- Admin access requires both:
  - authenticated admin user (`isAdmin=true`)
  - frontend flag `VITE_ENABLE_ADMIN_CONSOLE=true`
