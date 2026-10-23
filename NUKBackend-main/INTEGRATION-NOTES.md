# NUK RentServe integration notes

- Frontend uses `/api/v1` endpoints and Bearer access tokens.
- `/providers/register` creates a provider account and a pending provider application without OTP or email verification. `/auth/register` also creates customer and owner accounts without OTP. Identity numbers and identity-document uploads are not collected by the provider registration API.
- Admin application review endpoints: `GET /api/v1/admin/provider-applications` and `PATCH /api/v1/admin/provider-applications/:id` with `{ "decision": "approve|info|reject", "note": "optional" }`.
- `GET /api/v1/services/mine` and `GET /api/v1/properties/mine` are authenticated owner/provider listing endpoints.
- Provider listings remain drafts until approval; approval publishes the provider's draft services and properties.
- Default service categories are inserted at server startup if missing.
