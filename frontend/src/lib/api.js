// src/lib/api.js
export const BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL ?? "").trim();
  const base = raw ? raw.replace(/\/+$/, "") : "http://127.0.0.1:8000";
  return base;
})();

async function request(
  method,
  path,
  body,
  { isForm = false, expectBlob = false } = {}
) {
  const url = `${BASE}${path}`;
  const init = { method, headers: {}, body: null };
  if (body) {
    if (isForm) {
      init.body = body;
    } else {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    // attempt to read json error; fall back to text / statusText
    let msg = res.statusText || `HTTP ${res.status}`;
    try {
      const j = await res.clone().json();
      msg = j.detail || j.message || msg;
    } catch {
      try {
        msg = await res.clone().text();
      } catch {}
    }
    throw new Error(msg);
  }
  if (expectBlob) {
    const blob = await res.blob();
    return { blob, fileName: getFileName(res) };
  }

  // ---- tolerate 204 / empty / non-JSON responses
  if (res.status === 204) return null;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  return res.json();
}

function getFileName(res) {
  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(cd);
  return decodeURIComponent(m?.[1] || m?.[2] || "download.bin");
}

/* ----------------- AUTH ----------------- */
export function login(username, password) {
  return request("POST", "/api/auth/login", { username, password });
}

/* ----------------- USERS (admin manages users) ----------------- */
/* These are here to keep existing pages working. Hook them to your
   new backend routes when you add them. */
export function listUsers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/api/users${qs ? `?${qs}` : ""}`);
}
export function getUser(id) {
  return request("GET", `/api/users/${id}`);
}
export function createUser(payload) {
  // Used by Admin pages to add a user
  return request("POST", "/api/users", payload);
}
export function updateUser(id, payload) {
  return request("PUT", `/api/users/${id}`, payload);
}
export function deleteUser(id) {
  return request("DELETE", `/api/users/${id}`);
}
export function changePassword(payload) {
  // Adjust to your real endpoint when implemented
  return request("POST", "/api/users/change-password", payload);
}

/* ----------------- ADMINS (superadmin manages admins) ----------------- */
export function listAdminsCombined(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/api/admins/combined${qs ? `?${qs}` : ""}`);
}
export async function listAdmins(page = 1, page_size = 10) {
  const res = await fetch(
    `${BASE}/users?page=${page}&page_size=${page_size}&roles=admin,superadmin`,
    {
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error(`listAdmins failed: ${res.status}`);
  return res.json();
}
export function updateAdminUser(id, payload) {
  return request("PUT", `/api/admins/${id}`, payload);
}
export function deleteAdminUser(id) {
  return request("DELETE", `/api/admins/${id}`);
}
// Optional (if you add edit/delete for superadmins)
export async function updateSuperadmin(id, payload) {
  const res = await fetch(`${BASE}/superadmins/${id}`, {
    method: "PATCH", // <-- PATCH for superadmins
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateSuperadmin failed: ${res.status}`);
  return res.json();
}
export async function deleteSuperadmin(id) {
  const res = await fetch(`${BASE}/superadmins/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`deleteSuperadmin failed: ${res.status}`);
  return true;
}
export async function getSuperadmin(id) {
  const res = await fetch(`${BASE}/superadmins/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`getSuperadmin failed: ${res.status}`);
  return res.json();
}
export async function getAdmin(id) {
  const r = await fetch(`/api/admins/${id}`);
  if (!r.ok) throw new Error("Failed to fetch admin");
  return r.json();
}
export async function updateAdmin(id, payload) {
  const res = await fetch(`${BASE}/admins/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateAdmin failed: ${res.status}`);
  return res.json();
}

export async function deleteAdmin(id) {
  const res = await fetch(`${BASE}/admins/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`deleteAdmin failed: ${res.status}`);
  return true;
}

/* ----------------- ADMIN USERS (Admin → Users page) ----------------- */
export function listManagedUsers({ page = 1, per_page = 8, q = "" } = {}) {
  const qs = new URLSearchParams({ page, per_page: String(per_page) });
  if (q) qs.set("q", q);
  return request("GET", `/api/admin/users?${qs.toString()}`);
}

export function createManagedUser(payload) {
  return request("POST", "/api/admin/users", payload);
}

export function updateManagedUser(id, payload) {
  return request("PATCH", `/api/admin/users/${id}`, payload);
}

export function toggleManagedUserActive(id, is_active) {
  return request("PATCH", `/api/admin/users/${id}/active`, {
    is_active: !!is_active,
  });
}

export function deleteManagedUser(id) {
  return request("DELETE", `/api/admin/users/${id}`);
}

/* ----------------- DEPARTMENTS (Admin → Departments) ----------------- */
export function listDepartments({
  page = 1,
  per_page = 8,
  q = "",
  only_active = false,
} = {}) {
  const qs = new URLSearchParams({ page, per_page });
  if (q) qs.set("q", q);
  if (only_active) qs.set("only_active", "1");
  return request("GET", `/api/departments?${qs.toString()}`);
}
export function createDepartment(payload) {
  return request("POST", "/api/departments", payload);
}
export function updateDepartment(id, payload) {
  return request("PATCH", `/api/departments/${id}`, payload);
}
export function toggleDepartmentActive(id, is_active) {
  return request("PATCH", `/api/departments/${id}/active`, {
    is_active: !!is_active,
  });
}
export function deleteDepartment(id) {
  return request("DELETE", `/api/departments/${id}`);
}

/* ----------------- SHIFTS (Admin → Shifts) ----------------- */
export function listShifts({
  page = 1,
  per_page = 8,
  q = "",
  only_active = false,
} = {}) {
  const qs = new URLSearchParams({ page, per_page });
  if (q) qs.set("q", q);
  if (only_active) qs.set("only_active", "1");
  return request("GET", `/api/shifts?${qs.toString()}`);
}
export function createShift(payload) {
  return request("POST", "/api/shifts", payload);
}
export function updateShift(id, payload) {
  return request("PATCH", `/api/shifts/${id}`, payload);
}
export function toggleShiftActive(id, is_active) {
  return request("PATCH", `/api/shifts/${id}/active`, {
    is_active: !!is_active,
  });
}
export function deleteShift(id) {
  return request("DELETE", `/api/shifts/${id}`);
}

// Stations
export function listStations({
  page = 1,
  per_page = 8,
  q = "",
  only_active = false,
} = {}) {
  const qs = new URLSearchParams({ page, per_page, q });
  if (only_active) qs.set("only_active", "1");
  return request("GET", `/api/admin/stations?${qs.toString()}`);
}

export function createStation(payload) {
  return request("POST", "/api/admin/stations", payload);
}

export function updateStation(id, payload) {
  return request("PATCH", `/api/admin/stations/${id}`, payload);
}

export function toggleStationActive(id, is_active) {
  return request("PATCH", `/api/admin/stations/${id}/active`, {
    is_active: !!is_active,
  });
}

export function deleteStation(id) {
  return request("DELETE", `/api/admin/stations/${id}`);
}

/*----------------Create admin--------------------*/
export async function createAdmin(payload) {
  const res = await fetch(`${BASE}/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createAdmin failed: ${res.status}`);
  return res.json();
}
/*----------------Create superadmin--------------------*/
export async function createSuperadmin(payload) {
  const res = await fetch(`${BASE}/superadmins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createSuperadmin failed: ${res.status}`);
  return res.json();
}

/* ----------------- UPLOADS ----------------- */
export function uploadsInit(username) {
  return request(
    "GET",
    `/api/uploads/init?username=${encodeURIComponent(username)}`
  );
}
export { uploadsInit as istInitUpload };

// Returns { blob, fileName }
export async function generateUploadReport({
  username,
  shift,
  station,
  department,
  percent,
  file,
}) {
  const fd = new FormData();
  fd.append("username", username);
  fd.append("shift", shift);
  fd.append("station", station);
  fd.append("department", department);
  fd.append("percent", String(percent));
  fd.append("file", file);
  fd.append("test_type", "BA");

  const res = await request("POST", "/api/uploads/generate?download=1", fd, {
    isForm: true,
    expectBlob: true,
  });
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition") || "";
  const fileName = /filename="?([^"]+)"?/.exec(dispo)?.[1] || "report.pdf";
  return { blob, fileName };
}

export async function getDropdowns() {
  const res = await fetch(`${BASE}/dropdowns`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`getDropdowns failed: ${res.status} ${text}`);
  }
  return res.json();
}

// List current user's reports
export function listUserReports({
  username,
  date_from,
  date_to,
  shift = "", // "" or "Day"/"Night"
  page = 1,
  page_size = 10,
}) {
  const qs = new URLSearchParams();
  if (username) qs.set("username", username);
  if (date_from) qs.set("date_from", date_from);
  if (date_to) qs.set("date_to", date_to);
  if (shift) qs.set("shift", shift);
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request("GET", `/api/reports/user?${qs.toString()}`);
}

// Admin: list reports across all dept/stations with filters
export function listAdminReports({
  date_from,
  date_to,
  shift = "",
  department = "",
  station = "",
  test_type = "BA", // "BA" | "PA"
  page = 1,
  page_size = 50,
}) {
  const qs = new URLSearchParams();
  if (date_from) qs.set("date_from", date_from);
  if (date_to) qs.set("date_to", date_to);
  if (shift) qs.set("shift", shift);
  if (department) qs.set("department", department);
  if (station) qs.set("station", station);
  if (test_type) qs.set("test_type", test_type);
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request("GET", `/api/reports/admin?${qs.toString()}`);
}

// Download a report by id
export async function downloadReport(reportId) {
  const res = await request(
    "GET",
    `/api/reports/${reportId}/download`,
    undefined,
    {
      expectBlob: true,
    }
  );
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition") || "";
  const fileName = /filename="?([^"]+)"?/.exec(dispo)?.[1] || "report.pdf";
  return { blob, fileName };
}

/* Optional default export for legacy imports like `import api from ...` */
const api = {
  login,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  createAdmin,
  createSuperadmin,
  changePassword,
  listAdmins,
  listAdminsCombined,
  updateAdminUser,
  deleteAdminUser,
  updateSuperadmin,
  deleteSuperadmin,
  istInitUpload: uploadsInit,
  generateUploadReport,
  downloadReport,
  listUserReports,
  listManagedUsers,
  createManagedUser,
  updateManagedUser,
  toggleManagedUserActive,
  deleteManagedUser,
};
export default api;
