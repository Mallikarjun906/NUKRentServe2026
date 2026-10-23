# NUK RentServe — updated features and setup

## Added in this package
- Customer/owner registration uses email OTP; service provider registration does not require OTP or email verification.
- Admin seed script and dedicated admin login page.
- Admin provider review UI with approve, reject, request-more-info, and manual identity-name review actions.
- Authenticated admin endpoint for retrieving uploaded identity documents from private Cloudinary storage.
- Optional Aadhaar name-match review fields and approval guard when a document is uploaded.
- `.env.example` and setup documentation.

## Setup
1. Open a terminal in `NUKBackend-main`.
2. Configure MongoDB, two independent JWT secrets (each at least 32 characters), and Cloudinary credentials.
3. Configure `BREVO_API_KEY` and `EMAIL_FROM` for customer-registration OTP and password-reset email delivery.
4. Run `npm install`.
5. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`.
6. Run `npm run create-admin` once. The script refuses to promote an existing non-admin account.
7. Run `npm run dev`.
8. Serve `NUKFrontend-main` using VS Code Live Server. Add the exact frontend origin to `CLIENT_ORIGIN` if it is not already listed in the backend CORS configuration.
9. Open `admin-login.html` to sign in as the administrator.

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
