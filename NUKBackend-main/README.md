# NUK RentServe Backend

REST API for local service providers and rental properties across supported Karnataka cities. Built with Express, MongoDB/Mongoose, JWT, and Cloudinary.

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas
- Cloudinary account for image uploads

## Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set the values.
3. Generate two different JWT secrets, each at least 32 characters.
4. Start MongoDB.
5. Run development server: `npm run dev`

The server starts on `http://localhost:5000`; health check: `GET /health` or `GET /api/v1/health`. NUK RentServe frontend base URL is `http://localhost:5000/api/v1`.

## Authentication
- `POST /api/auth/register` accepts name, email, phone, password, location and optional role `provider`. Public registration never permits admin role assignment.
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout` (Bearer access token)

Send access tokens as `Authorization: Bearer <accessToken>`.

## Main endpoints
- `GET/PATCH /api/users/me`
- `GET/PATCH /api/providers/me` (provider)
- `GET /api/categories`; `POST/PATCH /api/categories` (admin)
- `GET /api/services`; `GET /api/services/:id`; `POST/PATCH/DELETE /api/services`
- `GET /api/properties`; `GET /api/properties/:id`; `POST/PATCH/DELETE /api/properties`
- `POST /api/enquiries`; `GET /api/enquiries/my`; `GET /api/enquiries/received`; `PATCH /api/enquiries/:id/status`
- `GET/POST /api/reviews`; `DELETE /api/reviews/:id`
- `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id/status`

## Image uploads
For service/property create or update, use `multipart/form-data` with the `images` field (multiple files). Cloudinary credentials are required. Max 5 MB per image, JPEG/PNG/WebP only, up to 10 files per request. Property schema limits 10 stored images; service schema limits 8 stored images. Listing owners can delete their own images:
- `DELETE /api/services/:id/images/:imageId`
- `DELETE /api/properties/:id/images/:imageId`

Cloudinary stores the image bytes; MongoDB stores the secure URL and Cloudinary public ID. Do not commit `.env`.

## Example requests
Register a provider:
```json
{
  "name": "Owner Name",
  "email": "owner@example.com",
  "phone": "9876543210",
  "password": "use-a-strong-password",
  "location": "Mahalingpur",
  "role": "provider"
}
```

Create a property with Postman:
- Method: `POST /api/properties`
- Authorization: Bearer token for a provider
- Body type: `form-data`
- `type`: `room`
- `title`: `Student room near college`
- `rent`: `4500`
- `rentPeriod`: `month`
- `address`: `Example address`
- `location`: `Mahalingpur`
- `images`: select one or more files (key type File)

For service listings, `priceRange` can be a JSON string such as `{"min":100,"max":200}` and `categoryId` must refer to an active category.

## Production checklist
Before production, add email verification/OTP, password reset, refresh-token rotation reuse detection, object-level access tests, moderation/report workflows, and monitoring. Review image deletion failure handling and configure a restrictive `CLIENT_ORIGIN`.

## Job applications (added)
- `POST /api/jobs/:id/applications` — customer/student applies to a published, available job. JSON body: `{ "coverMessage": "I am available evenings" }`.
- `GET /api/applications/my` — current student's applications.
- `GET /api/jobs/:id/applications` — listing owner/admin views applicants.
- `PATCH /api/applications/:id/status` — owner/admin sets `shortlisted`, `accepted`, or `rejected`; optional `ownerNote`.
- `PATCH /api/applications/:id/withdraw` — student withdraws their own application.

## Upload images with Postman
Use `Authorization: Bearer <accessToken>`, choose **Body → form-data**, and add one or more file fields named `images`. The upload endpoints are `POST /api/properties` and `POST /api/services` or `POST /api/jobs`. Cloudinary credentials must be configured. Listing fields should be sent as form-data strings; nested `priceRange` must be JSON text such as `{"min":100,"max":200}` and arrays such as `facilities`/`requiredSkills` as JSON text such as `["Cooking","Cleaning"]`.

## Listing and property image deletion
`DELETE /api/services/:id/images/:imageId`, `DELETE /api/jobs/:id/images/:imageId`, and `DELETE /api/properties/:id/images/:imageId` require the listing owner or admin. Image IDs are the subdocument `_id` values returned in the listing response, not Cloudinary public IDs.


## NUK RentServe frontend integration
- Set `js/config.js`: `API_BASE_URL: "http://localhost:5000/api/v1"` and `DEMO_MODE: false`.
- Public endpoints used by the frontend: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/services`, `GET /api/v1/services/:id`, `GET /api/v1/properties`, `GET /api/v1/properties/:id`, and `POST /api/v1/providers/register`.
- Provider form submissions are saved as pending applications. Date of birth is validated but not stored. The form accepts an Aadhaar document file (JPG, PNG, or PDF up to 5 MB) only; it does not ask for the Aadhaar number or perform automated Aadhaar/e-KYC verification. The document is uploaded as an authenticated/private Cloudinary asset. Configure Cloudinary credentials before enabling provider registration uploads.
- Listing APIs return frontend-friendly card fields alongside the stored listing fields. Existing `/api/...` routes remain available.
- Configure `CLIENT_ORIGIN` to the exact origin(s) serving the frontend. Do not use a wildcard origin for a credentialed production deployment.
- Never put MongoDB credentials or JWT secrets in frontend JavaScript.


## Email OTP and admin setup

1. Copy `.env.example` to `.env` and set MongoDB, strong JWT secrets, SMTP credentials, and Cloudinary credentials for private identity documents. Never commit `.env`.
2. For Gmail, enable 2-Step Verification and create a Google App Password. Use it as `SMTP_PASS`.
3. Run `npm install` and `npm run create-admin` after setting `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, and a unique `ADMIN_PASSWORD` (12+ characters) in `.env`.
4. Start with `npm run dev`. Serve `NUKFrontend-main` with VS Code Live Server.
5. Open `admin-login.html` to sign in as the seeded administrator. Provider OTP endpoints are `/api/v1/auth/send-otp` and `/api/v1/auth/verify-otp`; provider registration must include the returned `emailVerificationToken`.

**Identity document note:** Admin document access is authenticated at the application endpoint. Confirm Cloudinary's authenticated asset and private-download behavior in your own account before production use. OCR is not enabled; name matching is manual by design.
