/* Shared live API client for all NUK RentServe pages. */
const API = (() => {
  const BASE = () => CONFIG.API_BASE.replace(/\/+$/, "");
  const readToken = () => sessionStorage.getItem("nuk_access_token");
  const unwrap = payload => payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
  const asArray = payload => {
    const data = unwrap(payload);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };
  const cityOk = city => !city || CONFIG.CITIES.includes(city);
  const normalizeService = raw => {
    const item = { ...(raw || {}) };
    item.id = String(item.id || item._id || "");
    item.name = item.name || item.title || "Service";
    item.city = item.city || item.location || "";
    item.locality = item.locality || item.location || item.city;
    item.category = typeof item.category === "string" ? item.category : item.categoryId?.name || "Service";
    item.phone = item.phone || item.providerId?.phone || "";
    item.experience = item.experience || (item.providerId?.experienceYears != null ? `${item.providerId.experienceYears} years` : "");
    item.available = item.available ?? item.availability ?? true;
    if (!item.priceRange && item.price) item.priceRange = item.price;
    else if (item.priceRange && typeof item.priceRange === "object") {
      const min = item.priceRange.min ?? 0;
      const max = item.priceRange.max ?? min;
      item.priceRange = min === max ? `₹${min}` : `₹${min}–₹${max}`;
    }
    item.verificationStatus = item.verificationStatus || item.providerId?.verificationStatus || (item.status === "published" ? "verified" : "pending");
    return item;
  };
  const normalizeProperty = raw => {
    const item = { ...(raw || {}) };
    item.id = String(item.id || item._id || "");
    item.city = item.city || item.location || "";
    item.locality = item.locality || item.address || "";
    item.available = item.available ?? item.availability ?? true;
    item.type = item.type === "PG" ? "PG" : item.type;
    if (Array.isArray(item.facilities)) item.facilities = item.facilities.join(", ");
    item.phone = item.phone || item.ownerId?.phone || "";
    return item;
  };

  async function req(path, { method = "GET", body, query } = {}) {
    const url = new URL(`${BASE()}/${String(path).replace(/^\/+/, "")}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const headers = { Accept: "application/json" };
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const options = { method, headers, credentials: "include" };
    if (body !== undefined && body !== null) {
      if (body instanceof FormData) options.body = body;
      else { headers["Content-Type"] = "application/json"; options.body = JSON.stringify(body); }
    }
    let response;
    try { response = await fetch(url, options); }
    catch { throw new Error("Cannot reach the backend. Ensure npm run dev is running and CLIENT_ORIGIN is configured."); }
    const payload = await response.json().catch(() => null);
    if (response.status === 401) {
      if (readToken() && typeof Auth !== "undefined" && Auth.expire) Auth.expire();
      throw new Error(payload?.message || "Authentication failed. Check your login details or sign in again.");
    }
    if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status}).`);
    return unwrap(payload);
  }

  function toFormData(kind, input) {
    const src = input instanceof FormData ? input : new FormData();
    if (!(input instanceof FormData)) Object.entries(input || {}).forEach(([k, v]) => src.append(k, v == null ? "" : String(v)));
    const get = name => src.get(name);
    const result = new FormData();
    const append = (key, value) => { if (value !== undefined && value !== null && value !== "") result.append(key, value); };
    const files = [...src.entries()].filter(([k, v]) => v instanceof File && v.name && (k === "images" || k === "image_file" || k === "photo"));
    if (kind === "services") {
      append("title", get("title")); append("description", get("description"));
      append("location", get("city") || get("location")); append("payUnit", get("payUnit") || "fixed");
      append("workHours", get("workHours") || "");
      append("availability", String(get("available") === "true" || get("available") === "on"));
      append("categoryId", get("categoryId") || get("category"));
      const priceText = String(get("priceRange") || "");
      const nums = priceText.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
      const min = nums.length ? nums[0] : 0;
      const max = nums.length > 1 ? nums[1] : min;
      append("priceRange", JSON.stringify({ min: Math.min(min, max), max: Math.max(min, max) }));
    } else {
      append("type", get("type")); append("title", get("title")); append("description", get("description"));
      append("rent", get("rent")); append("deposit", get("deposit") || "0"); append("rentPeriod", get("rentPeriod") || "month");
      append("address", get("locality") || get("address")); append("location", get("city") || get("location"));
      append("facilities", get("facilities"));
      append("availability", String(get("available") === "true" || get("available") === "on"));
    }
    files.forEach(([key, file]) => { if (file instanceof File && file.name) result.append("images", file, file.name); });
    return result;
  }

  async function list(kind, query = {}) {
    const path = kind === "services" ? CONFIG.ENDPOINTS.services : CONFIG.ENDPOINTS.properties;
    const mapped = { ...query };
    if (mapped.city) { mapped.location = mapped.city; delete mapped.city; }
    if (mapped.q) { mapped.search = mapped.q; delete mapped.q; }
    if (mapped.category && kind === "services") mapped.category = mapped.category;
    const data = asArray(await req(path, { query: mapped }));
    const normalized = data.map(kind === "services" ? normalizeService : normalizeProperty);
    return normalized.filter(x => cityOk(x.city));
  }

  async function get(kind, id) {
    const path = kind === "services" ? CONFIG.ENDPOINTS.services : CONFIG.ENDPOINTS.properties;
    const item = unwrap(await req(`${path}/${encodeURIComponent(id)}`));
    return kind === "services" ? normalizeService(item) : normalizeProperty(item);
  }

  async function mine(kind) {
    const path = kind === "services" ? CONFIG.ENDPOINTS.myServices : CONFIG.ENDPOINTS.myProperties;
    return asArray(await req(path)).map(kind === "services" ? normalizeService : normalizeProperty);
  }

  async function create(kind, body) {
    const path = kind === "services" ? CONFIG.ENDPOINTS.services : CONFIG.ENDPOINTS.properties;
    const fd = toFormData(kind, body);
    if (kind === "services") {
      const categoryValue = fd.get("categoryId");
      if (categoryValue && !/^[a-f\d]{24}$/i.test(categoryValue)) {
        const categories = await categoriesList();
        const found = categories.find(c => c.name?.toLowerCase() === String(categoryValue).toLowerCase());
        if (!found) throw new Error("The selected service category is not configured in the backend. Seed or add categories first.");
        fd.set("categoryId", found.id || found._id);
      }
    }
    return unwrap(await req(path, { method: "POST", body: fd }));
  }

  async function update(kind, id, body) {
    const path = kind === "services" ? CONFIG.ENDPOINTS.services : CONFIG.ENDPOINTS.properties;
    const fd = toFormData(kind, body);
    if (kind === "services") {
      const categoryValue = fd.get("categoryId");
      if (categoryValue && !/^[a-f\d]{24}$/i.test(categoryValue)) {
        const categories = await categoriesList();
        const found = categories.find(c => c.name?.toLowerCase() === String(categoryValue).toLowerCase());
        if (!found) throw new Error("The selected service category is not configured in the backend.");
        fd.set("categoryId", found.id || found._id);
      }
    }
    return unwrap(await req(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", body: fd }));
  }

  let categoryCache = null;
  async function categoriesList() {
    if (!categoryCache) categoryCache = asArray(await req("categories")).map(c => ({ ...c, id: String(c.id || c._id || "") }));
    return categoryCache;
  }

  return {
    req,
    request: req,
    list,
    get,
    mine,
    create,
    update,
    async remove(kind, id) {
      const path = kind === "services" ? CONFIG.ENDPOINTS.services : CONFIG.ENDPOINTS.properties;
      return req(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async profile() {
      const user = typeof Auth !== "undefined" ? Auth.user() : null;
      return req(user?.role === "provider" ? CONFIG.ENDPOINTS.providerProfile : CONFIG.ENDPOINTS.myProfile);
    },
    async sendEnquiry(body) { return req(CONFIG.ENDPOINTS.enquiries, { method: "POST", body }); },
    async myEnquiries() {
      const role = typeof Auth !== "undefined" ? Auth.user()?.role : null;
      const path = role === "provider" || role === "admin" ? CONFIG.ENDPOINTS.receivedEnquiries : CONFIG.ENDPOINTS.myEnquiries;
      return asArray(await req(path)).map(item => ({ ...item, id: String(item.id || item._id || ""), from: item.customerId?.name || item.from || "Customer", when: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : item.when }));
    },
    async registerProvider(body) { return req(CONFIG.ENDPOINTS.providerRegister, { method: "POST", body }); },
    bookings: {
      async create(data) { return unwrap(await req("bookings", { method: "POST", body: data })); },
      async mine() { return asArray(await req("bookings/mine")).map(item => ({ ...item, id: String(item.id || item._id || "") })); },
      async received() { return asArray(await req("bookings/received")).map(item => ({ ...item, id: String(item.id || item._id || "") })); },
      async updateStatus(id, status) { return unwrap(await req(`bookings/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } })); }
    },
    categories: { list: categoriesList },
    auth: {
      register: data => req(CONFIG.ENDPOINTS.register, { method: "POST", body: data }),
      login: data => req(CONFIG.ENDPOINTS.login, { method: "POST", body: data }),
      logout: () => req(CONFIG.ENDPOINTS.logout, { method: "POST" }),
      refresh: refreshToken => req(CONFIG.ENDPOINTS.refresh, { method: "POST", body: { refreshToken } })
    },
    providers: {
      profile: () => req("providers/me"),
      update: data => req("providers/me", { method: "PATCH", body: data }),
      register: data => req("providers/register", { method: "POST", body: data })
    },
    jobs: {
      list: query => {
        const mapped = { ...(query || {}) };
        if (mapped.city) { mapped.location = mapped.city; delete mapped.city; }
        if (mapped.q) { mapped.search = mapped.q; delete mapped.q; }
        return req("jobs", { query: mapped });
      },
      get: id => req(`jobs/${encodeURIComponent(id)}`),
      create: data => req("jobs", { method: "POST", body: data }),
      update: (id, data) => req(`jobs/${encodeURIComponent(id)}`, { method: "PATCH", body: data }),
      delete: id => req(`jobs/${encodeURIComponent(id)}`, { method: "DELETE" }),
      apply: (id, data = {}) => req(`jobs/${encodeURIComponent(id)}/applications`, { method: "POST", body: data }),
      applications: id => req(`jobs/${encodeURIComponent(id)}/applications`)
    },
    applications: {
      mine: query => req("applications/my", { query }),
      updateStatus: (id, data) => req(`applications/${encodeURIComponent(id)}/status`, { method: "PATCH", body: data }),
      withdraw: id => req(`applications/${encodeURIComponent(id)}/withdraw`, { method: "PATCH" })
    },
    reviews: {
      list: query => req("reviews", { query }),
      create: data => req("reviews", { method: "POST", body: data }),
      delete: id => req(`reviews/${encodeURIComponent(id)}`, { method: "DELETE" })
    },
    admin: {
      stats: () => req("admin/stats"),
      users: query => req("admin/users", { query }),
      setUserStatus: (id, isActive) => req(`admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { isActive } }),
      async pending() { return asArray(await req(CONFIG.ENDPOINTS.adminPending)); },
      decide(id, decision, note) {
        return req(CONFIG.ENDPOINTS.adminDecide.replace(":id", encodeURIComponent(id)), {
          method: "PATCH", body: { decision, note }
        });
      }
    }
  };
})();
