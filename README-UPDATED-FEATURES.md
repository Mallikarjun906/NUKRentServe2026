# NUK RentServe — updated features and setup

## Added in this package
- Nodemailer six-digit email OTP for customer/owner registration and provider registration.
- OTP hash storage, five-minute expiry, resend cooldown, attempt limits, and a short-lived verification token consumed by the backend registration flow.
- Admin seed script and dedicated admin login page.
- Admin provider review UI with approve, reject, request-more-info, and manual identity-name review actions.
- Authenticated admin endpoint for retrieving uploaded identity documents from private Cloudinary storage.
- Optional Aadhaar name-match review fields and approval guard when a document is uploaded.
- `.env.example` and setup documentation.

## Setup
1. Open a terminal in `NUKBackend-main`.
2. Copy `.env.example` to `.env` and fill in your own MongoDB URI, two independent JWT secrets (each at least 32 characters), SMTP settings, and Cloudinary credentials.
3. For Gmail SMTP, enable 2-Step Verification and create a Google App Password. Put it in `SMTP_PASS`; never use your regular Gmail password.
4. Run `npm install`.
5. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`.
6. Run `npm run create-admin` once. The script refuses to promote an existing non-admin account.
7. Run `npm run dev`.
8. Serve `NUKFrontend-main` using VS Code Live Server. Add the exact frontend origin to `CLIENT_ORIGIN` if it is not already listed in the backend CORS configuration.
9. Open `admin-login.html` to sign in as the administrator.

## OTP endpoints
- `POST /api/v1/auth/send-otp` with `{ "email": "user@example.com", "purpose": "provider-registration" }` or `customer-registration`.
- `POST /api/v1/auth/verify-otp` with `{ "email": "user@example.com", "otp": "123456", "purpose": "provider-registration" }` or `customer-registration`.
- Registration must include the returned `emailVerificationToken`; verification tokens are bound to the email and purpose and are consumed on registration.

## Admin endpoints
- `GET /api/v1/admin/provider-applications`
- `GET /api/v1/admin/provider-applications/:id/document`
- `PATCH /api/v1/admin/provider-applications/:id/identity-review`
- `PATCH /api/v1/admin/provider-applications/:id` with `{ "decision": "approve|info|reject", "note": "..." }`

All admin endpoints require a valid access token for a user whose database role is `admin`.

## Verification status and important limitations
- JavaScript syntax checks passed with Node.js `--check` for backend and frontend JS files.
- Full Jest/integration tests were not run in this environment because dependency installation did not complete before the execution timeout. Run `npm ci` then `npm test` locally.
- Real SMTP delivery and private Cloudinary document retrieval require valid credentials and must be tested in your own environment before production.
- OCR is not configured. Admins manually compare the registered name to the document and record the result; a name match alone is not proof of identity.
- Review applicable privacy/legal requirements before collecting Aadhaar documents in production. Use HTTPS and restrict admin access.
