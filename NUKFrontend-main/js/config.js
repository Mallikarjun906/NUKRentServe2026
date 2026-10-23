
const localApi = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const CONFIG = {
  API_BASE: localApi
    ? "http://localhost:5000/api/v1"
    : "https://nukrentserve2026.onrender.com/api/v1",
  DEMO_MODE: false,
  MIN_AGE: 18,
  MAX_UPLOAD_MB: 5,

  CITIES: [
    "Bagalkot", "Belagavi", "Hubballi", "Dharwad",
    "Vijayapura", "Gadag", "Koppal"
  ],

  SERVICE_CATEGORIES: [
    "Carpenter", "Plumber", "Electrician", "Painter",
    "Cleaning", "Appliance Repair", "Other Services"
  ],

  PROPERTY_TYPES: [
    { id: "house", label: "House" },
    { id: "shop", label: "Shop" },
    { id: "room", label: "Room" },
    { id: "PG", label: "PG" }
  ],

  ENDPOINTS: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",

    services: "/services",
    properties: "/properties",
    myServices: "/services/mine",
    myProperties: "/properties/mine",
    myProfile: "/users/me",
    providerProfile: "/providers/me",
    categories: "/categories",
    enquiries: "/enquiries",
    myEnquiries: "/enquiries/my",
    receivedEnquiries: "/enquiries/received",
    providerRegister: "/providers/register",
    adminPending: "/admin/provider-applications",
    adminDecide: "/admin/provider-applications/:id"
  }
};
