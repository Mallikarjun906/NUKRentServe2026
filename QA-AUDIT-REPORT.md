# NUK RentServe QA Audit Report

## Fixes made during this audit

- Removed duplicate legacy script references from the home page that pointed to missing `js/demo.js` and `js/app.js`, which caused browser 404s.
- Replaced the admin identity-document preview flow that depended on `window.open()` returning a window handle with an in-page document dialog. This avoids false popup-blocked errors when using `noopener` and supports image/PDF previews.
- Preserved the uploaded document MIME type in the provider application record and used it when returning protected document previews, so PNG uploads are not incorrectly labeled as JPEG.

## Checks completed

- JavaScript syntax check (`node --check`) across project JavaScript files.
- HTML local asset-reference scan across all frontend HTML pages.
- JSON syntax checks for package manifests and other JSON files.
- ZIP archive integrity check.
- Secret/configuration review to ensure no real `.env` file is included.

## Checks not completed in this environment

- `npm ci` timed out while attempting dependency installation; therefore Jest tests and full backend startup/integration tests could not run here (`jest` was unavailable).
- Live MongoDB, Gmail SMTP/Nodemailer delivery, Cloudinary private upload/download, and browser-level end-to-end behavior require your own configured environment and were not represented as verified.

## Before production

1. Copy `NUKBackend-main/.env.example` to `NUKBackend-main/.env` and fill in real values locally.
2. Use strong unique JWT secrets and a Gmail App Password or another SMTP credential.
3. Configure Cloudinary private storage if you want Aadhaar document uploads and previews.
4. Run `npm ci`, `npm test`, and `npm run dev` from `NUKBackend-main` on a machine with network access.
5. Test customer/provider OTP, admin login, document preview, identity review, and approve/reject flows with test accounts before accepting real users.
6. Never commit `.env` or real identity documents to GitHub.
