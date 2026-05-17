# Security Audit — v1.0

**Date:** 2026-05-17  
**Scope:** Full application stack (NestJS backend, React frontend, PostgreSQL, Docker)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Authentication | ✅ Pass | httpOnly cookies, dual-token rotation |
| Authorization (RBAC) | ✅ Pass | Service-layer membership checks |
| Injection prevention | ✅ Pass | Prisma parameterized queries, whitelist DTO validation |
| XSS | ✅ Pass | DOMPurify on all rich-text output |
| CSRF | ✅ Pass | SameSite=Strict + same-origin fetch; sendBeacon whitelisted |
| Security headers | ✅ Pass | Helmet + strict CSP in production |
| Rate limiting | ✅ Pass | 10/min auth, 120/min global (in-memory) |
| Upload security | ✅ Pass | Magic-byte MIME validation, path sanitization |
| WebSocket auth | ✅ Pass | Cookie-based auth on handshake |
| Secret management | ✅ Pass | Env-var only, no hardcoded secrets |
| Dependencies | ⚠️ Monitor | `npm audit` runs in CI; review monthly |
| DoS protection | ⚠️ Partial | Rate limiting done; no WAF/CDN layer |

---

## 1. Authentication

**Mechanism:** httpOnly cookie pair — `access_token` (15 min) + `refresh_token` (7 days).

**Findings:**
- ✅ `httpOnly: true` prevents JavaScript access
- ✅ `secure: true` in production (requires HTTPS)
- ✅ `sameSite: 'strict'` — blocks cross-site cookie sending
- ✅ JWT extraction: cookie-first, Bearer fallback for API clients
- ✅ `JWT_SECRET` and `JWT_REFRESH_SECRET` are separate and required at startup
- ✅ App exits in production if `JWT_SECRET` is missing
- ✅ Passwords hashed with bcrypt (cost factor 10+)

**Risk:** Refresh token is 7 days. If device is lost, only password change + logout-all mitigates.  
**Recommendation:** Add `POST /auth/logout-all` endpoint (deferred to v1.1).

---

## 2. Authorization (RBAC)

**Mechanism:** Project membership checked in service layer via `_assertMember()`.

**Findings:**
- ✅ JwtAuthGuard on all protected routes
- ✅ Activity endpoints verify project membership before returning data
- ✅ Comment endpoints verified after Phase A fix
- ✅ No IDOR patterns found in issue/project CRUD

**Risk:** API-key module and webhooks module are scaffolded but authorization depth not fully reviewed.  
**Recommendation:** Audit `api-keys` and `webhooks` service layer before enabling in production.

---

## 3. Injection

**Findings:**
- ✅ All DB queries via Prisma ORM with parameterized inputs
- ✅ `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true` rejects unknown fields
- ✅ No raw SQL concatenation found
- ✅ File paths for uploads sanitized (no `../` traversal)

---

## 4. XSS

**Findings:**
- ✅ React's JSX escapes by default
- ✅ All `dangerouslySetInnerHTML` calls wrapped with DOMPurify (Phase A)
- ✅ Tiptap rich-text output sanitized before render
- ✅ CSP `script-src: 'self'` blocks inline scripts in production

---

## 5. CSRF

**Strategy:** Defense-in-depth using three layers:

1. **SameSite=Strict cookies** — browser will not send cookies on cross-site requests
2. **CORS** — `origin` restricted to `FRONTEND_URL` only
3. **Content-Type validation** — JSON API only accepts `application/json`

**No csurf middleware needed** because SameSite=Strict + CORS already prevent all cross-origin form submissions and AJAX requests.

**Exception:** `/api/telemetry/crash` accepts `text/plain` (sendBeacon). This endpoint is write-only (logs crashes, returns 204) and has no side effects. Risk: minimal.

---

## 6. Security Headers (Helmet)

Production CSP:
```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
connect-src 'self' ws: wss:
font-src 'self' https://fonts.gstatic.com
object-src 'none'
upgrade-insecure-requests
```

Additional headers via Helmet:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: no-referrer`
- `X-DNS-Prefetch-Control: off`

**Note:** `crossOriginEmbedderPolicy: false` to allow third-party embeds (deliberate).

---

## 7. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 10 req | 60s |
| POST /auth/register | 10 req | 60s |
| All other routes | 120 req | 60s |

**Limitation:** In-memory store — rate limit resets on restart and does not work across multiple instances.  
**Recommendation:** Add Redis throttler store before horizontal scaling.

---

## 8. Upload Security

**Findings:**
- ✅ Magic-byte MIME validation (not just Content-Type header)
- ✅ Files stored in `/uploads` outside webroot with restricted mime allow-list
- ✅ File size limit enforced at Multer layer
- ✅ Original filenames are not used for storage paths (UUID-based)

---

## 9. WebSocket

**Findings:**
- ✅ WS auth on handshake: extracts `access_token` cookie via regex
- ✅ WS connections rejected if token invalid/expired
- ✅ `try/catch` on all WS event handlers (Phase A)

---

## 10. Secrets Management

**Findings:**
- ✅ All secrets via environment variables, never hardcoded
- ✅ `docker-compose.yml` now uses `${VAR:?error}` syntax — fails loudly if not set
- ✅ `.env` files in `.gitignore`
- ✅ `.env.*.example` files committed as templates

**Checklist before production:**
- [ ] Generate `JWT_SECRET` with `openssl rand -hex 32`
- [ ] Generate `JWT_REFRESH_SECRET` with a different `openssl rand -hex 32`
- [ ] Generate `DB_PASSWORD` with a strong random password
- [ ] Verify `.env` is not tracked by git: `git ls-files .env`

---

## 11. Dependencies

Run regularly:
```bash
npm audit --audit-level=high --prefix backend
npm audit --audit-level=high --prefix frontend
```

CI runs `npm audit` on every push (`continue-on-error: true` — review results, don't silently ignore).

---

## Known Accepted Risks

| Risk | Accepted Reason |
|------|-----------------|
| In-memory rate limiting | Acceptable for v1.0 single-instance |
| No WAF/DDoS protection | Deferred — handled at infra layer (Cloudflare/nginx) |
| `api-keys` module not fully audited | Module disabled by default in v1.0 |
| No `logout-all` endpoint | Deferred to v1.1 |
