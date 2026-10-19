# NUK RentServe — Frontend + Backend Integration

This archive contains `NUKFrontend-main` (plain HTML/CSS/JavaScript) and `NUKBackend-main` (Node.js, Express, MongoDB/Mongoose).

## Features in this revision
- Customer registration includes a visible supported-city dropdown and customer/property-owner account type.
- Property-owner accounts log in to Owner Dashboard; customer accounts can also open Owner Dashboard to list a house, room, shop, or PG.
- Rental detail pages let signed-in customers send booking requests. Owners can accept or reject requests from Owner Dashboard. This is a request workflow only; no payment is taken.
- Service-provider registration accepts one Aadhaar document file only (JPG, PNG, or PDF, max 5 MB). The form does not ask for an Aadhaar number and does not perform automated Aadhaar/e-KYC verification.
- Aadhaar uploads use authenticated/private Cloudinary storage; only a private asset reference is saved in MongoDB. Admin sees whether a document was uploaded, not a public file URL.

## Run locally
1. Extract this ZIP.
2. Open `NUKBackend-main` in VS Code.
3. Copy `.env.example` to `.env` and configure `MONGODB_URI`, strong JWT secrets, and `CLIENT_ORIGIN`.
4. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable private Aadhaar uploads and listing image uploads. Provider registration file upload returns an error until these are configured.
5. Run `npm install`, then `npm run dev` in the backend directory.
6. Check `http://localhost:5000/api/v1/health`.
7. Open `NUKFrontend-main` with VS Code Live Server. The default API base is `http://localhost:5000/api/v1`.

## Important notes
- Do not commit `.env`, Aadhaar files, API secrets, or passwords to GitHub.
- Use HTTPS in production and configure `CLIENT_ORIGIN` to your actual deployed frontend origin.
- An Aadhaar document upload is sensitive personal information. Collect it only with clear consent, restrict access, define a deletion/retention policy, and never expose its URL on public listings. This implementation stores it as an authenticated Cloudinary asset but does not implement UIDAI-based verification.
- Booking requests are not confirmed bookings until the owner accepts them, and no payment processing is included.
- JavaScript syntax checks passed for the frontend and backend files. MongoDB/Cloudinary live integration has not been tested in this environment.
