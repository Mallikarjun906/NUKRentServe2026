# NUK RentServe frontend integration

## Run locally

1. Start MongoDB Atlas access and configure the backend `.env` from `NUKBackend-main/.env.example`.
2. From the backend directory run `npm install` and `npm run dev`.
3. Confirm `http://localhost:5000/api/v1/health` returns a success response.
4. Open the frontend folder with VS Code Live Server. The default frontend origin is `http://127.0.0.1:5500` or `http://localhost:5500`.
5. `js/config.js` points to `http://localhost:5000/api/v1`; change `API_BASE` when deploying the backend.

## Integrated routes

The shared `js/api.js` client uses the actual Express API route groups for auth, users, providers, categories, services, properties, jobs, applications, enquiries, reviews and admin. Authenticated requests send the access token as a Bearer token from `sessionStorage`.

Provider registration accepts an Aadhaar document upload only (JPG, PNG, or PDF, max 5 MB); it does not ask for the Aadhaar number and does not perform automated Aadhaar/e-KYC verification. The file is uploaded to authenticated/private Cloudinary storage and the database stores only its private asset reference. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before enabling this form. The backend checks age (18+), stores the application, and allows an admin to approve, request more information, or reject it. Listings created by service providers before approval remain drafts and are published after approval. Customer and property-owner accounts can list houses, rooms, shops, and PGs from Owner Dashboard.

## Rental booking flow

Customers can open a rental listing and submit a booking request. Owners can review incoming requests from Owner Dashboard and accept or reject them. This is a booking request only; no payment is collected. Customers and property owners can register from register.html by selecting the appropriate account type.

## Important

- Never commit `.env` or real secrets to GitHub.
- For deployed frontend/backend, use HTTPS and set `CLIENT_ORIGIN` to the exact deployed frontend origin(s).
- Create/promote the initial administrator securely in the database; the public registration forms do not allow users to self-assign the admin role.
- Listing images require Cloudinary environment variables. If Cloudinary is not configured, create/edit listings without uploading images.
