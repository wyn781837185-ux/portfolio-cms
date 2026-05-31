const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 5174);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "portfolio-admin";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "portfolio";
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const IMAGE_EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const defaultProfile = {
  name: "林之远",
  title: "UI Designer · Frontend Maker",
  intro: "把复杂产品变成清晰、漂亮、能落地的数字体验。作品数据由后台管理，上传后会自动展示在这个页面。",
  bio: "我专注个人品牌、SaaS 工具、数据看板和移动端界面，也会把设计落成稳定的前端页面。",
  avatar: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80",
  email: "hello@linstudio.design",
  phone: "+86 138 0000 0000",
  availability: "可接新项目",
  skills: ["UI Design", "Frontend", "CMS", "Dashboard"],
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function isAuthed(req) {
  return req.headers["x-admin-token"] === ADMIN_TOKEN;
}

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function ensureStorage() {
  if (USE_SUPABASE) return;
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fsp.access(PROJECTS_FILE);
  } catch {
    await fsp.writeFile(PROJECTS_FILE, "[]", "utf8");
  }
  try {
    await fsp.access(PROFILE_FILE);
  } catch {
    await fsp.writeFile(PROFILE_FILE, `${JSON.stringify(defaultProfile, null, 2)}\n`, "utf8");
  }
}

async function readJson(file, fallback) {
  await ensureStorage();
  try {
    const content = await fsp.readFile(file, "utf8");
    return JSON.parse(content || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

async function writeJson(file, payload) {
  await ensureStorage();
  await fsp.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function cleanProfile(input) {
  return {
    name: String(input.name || "").trim(),
    title: String(input.title || "").trim(),
    intro: String(input.intro || "").trim(),
    bio: String(input.bio || "").trim(),
    avatar: String(input.avatar || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    availability: String(input.availability || "").trim(),
    skills: normalizeTags(input.skills),
  };
}

function cleanProject(input, existing = {}) {
  return {
    ...existing,
    title: String(input.title || "").trim(),
    category: ["product", "web", "brand"].includes(input.category) ? input.category : "product",
    type: String(input.type || "").trim(),
    year: String(input.year || "").trim(),
    summary: String(input.summary || "").trim(),
    body: String(input.body || "").trim(),
    tags: normalizeTags(input.tags),
    image: String(input.image || "").trim(),
    featured: Boolean(input.featured),
    updatedAt: new Date().toISOString(),
  };
}

function validateProject(project) {
  return Boolean(project.title && project.type && project.year && project.image);
}

function splitBuffer(buffer, separator) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(separator, start);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + separator.length;
    index = buffer.indexOf(separator, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!match) return [];

  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  return splitBuffer(buffer, boundary)
    .map((part) => {
      let current = part;
      if (current.subarray(0, 2).toString() === "\r\n") current = current.subarray(2);
      if (current.subarray(-2).toString() === "\r\n") current = current.subarray(0, -2);
      if (current.toString() === "--") return null;

      const headerEnd = current.indexOf(Buffer.from("\r\n\r\n"));
      if (headerEnd === -1) return null;

      const rawHeaders = current.subarray(0, headerEnd).toString("utf8");
      const body = current.subarray(headerEnd + 4);
      const name = /name="([^"]+)"/i.exec(rawHeaders)?.[1] || "";
      const filename = /filename="([^"]*)"/i.exec(rawHeaders)?.[1] || "";
      const type = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders)?.[1]?.trim() || "";
      return { name, filename, type, body };
    })
    .filter(Boolean);
}

async function supabaseFetch(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function readProfile() {
  if (!USE_SUPABASE) return readJson(PROFILE_FILE, defaultProfile);
  const rows = await supabaseFetch("/rest/v1/portfolio_profile?id=eq.main&select=data&limit=1");
  return rows?.[0]?.data || defaultProfile;
}

async function writeProfile(profile) {
  if (!USE_SUPABASE) {
    await writeJson(PROFILE_FILE, profile);
    return profile;
  }
  await supabaseFetch("/rest/v1/portfolio_profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: "main", data: profile }),
  });
  return profile;
}

async function readProjects() {
  if (!USE_SUPABASE) return readJson(PROJECTS_FILE, []);
  const rows = await supabaseFetch("/rest/v1/portfolio_projects?select=id,data,sort_order&order=sort_order.asc");
  return (rows || []).map((row) => ({ id: row.id, ...(row.data || {}) }));
}

async function writeAllProjects(projects) {
  if (!USE_SUPABASE) {
    await writeJson(PROJECTS_FILE, projects);
    return projects;
  }

  await supabaseFetch("/rest/v1/portfolio_projects?id=not.is.null", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  const rows = projects.map((project, index) => ({
    id: project.id,
    data: project,
    sort_order: index,
  }));

  if (rows.length) {
    await supabaseFetch("/rest/v1/portfolio_projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
  }
  return projects;
}

async function saveProject(projects, project) {
  if (!USE_SUPABASE) {
    await writeJson(PROJECTS_FILE, projects);
    return project;
  }

  const sortOrder = Math.max(0, projects.findIndex((item) => item.id === project.id));
  await supabaseFetch("/rest/v1/portfolio_projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: project.id, data: project, sort_order: sortOrder }),
  });
  return project;
}

async function deleteProject(projects) {
  return writeAllProjects(projects);
}

async function uploadSupabaseFile(file) {
  const ext = IMAGE_EXTENSIONS[file.type];
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const objectPath = `uploads/${filename}`;
  await supabaseFetch(`/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file.body,
  });
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

async function uploadLocalFile(file) {
  await ensureStorage();
  const ext = IMAGE_EXTENSIONS[file.type];
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  await fsp.writeFile(path.join(UPLOAD_DIR, filename), file.body);
  return `/uploads/${filename}`;
}

async function handleAuth(req, res, pathname) {
  if (pathname !== "/api/auth/login") return false;
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }
  const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
  if (payload.token !== ADMIN_TOKEN) {
    sendJson(res, 401, { error: "Invalid token" });
    return true;
  }
  sendJson(res, 200, { ok: true });
  return true;
}

async function handleProfile(req, res, pathname) {
  if (pathname !== "/api/profile") return false;

  if (req.method === "GET") {
    sendJson(res, 200, await readProfile());
    return true;
  }

  if (req.method === "PUT") {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
    const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    const profile = cleanProfile(payload);
    if (!profile.name || !profile.title || !profile.avatar) {
      sendJson(res, 400, { error: "Missing required fields" });
      return true;
    }
    sendJson(res, 200, await writeProfile(profile));
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

async function handleProjects(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/projects") {
    sendJson(res, 200, await readProjects());
    return true;
  }

  if (req.method === "GET" && pathname.startsWith("/api/projects/")) {
    const id = decodeURIComponent(pathname.replace("/api/projects/", ""));
    const project = (await readProjects()).find((item) => item.id === id);
    sendJson(res, project ? 200 : 404, project || { error: "Project not found" });
    return true;
  }

  if (pathname === "/api/projects/order") {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
    if (req.method !== "PUT") {
      sendJson(res, 405, { error: "Method not allowed" });
      return true;
    }
    const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    const order = Array.isArray(payload.order) ? payload.order : [];
    const projects = await readProjects();
    const byId = new Map(projects.map((project) => [project.id, project]));
    const sorted = order.map((id) => byId.get(id)).filter(Boolean);
    const missing = projects.filter((project) => !order.includes(project.id));
    await writeAllProjects([...sorted, ...missing]);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (!pathname.startsWith("/api/projects")) return false;

  if (!isAuthed(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const projects = await readProjects();

  if (req.method === "POST" && pathname === "/api/projects") {
    const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    const project = cleanProject(payload, { id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    if (!validateProject(project)) {
      sendJson(res, 400, { error: "Missing required fields" });
      return true;
    }
    projects.unshift(project);
    await saveProject(projects, project);
    sendJson(res, 201, project);
    return true;
  }

  const id = decodeURIComponent(pathname.replace("/api/projects/", ""));
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) {
    sendJson(res, 404, { error: "Project not found" });
    return true;
  }

  if (req.method === "PUT") {
    const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    const project = cleanProject(payload, projects[index]);
    if (!validateProject(project)) {
      sendJson(res, 400, { error: "Missing required fields" });
      return true;
    }
    projects[index] = project;
    await saveProject(projects, project);
    sendJson(res, 200, project);
    return true;
  }

  if (req.method === "DELETE") {
    const [removed] = projects.splice(index, 1);
    await deleteProject(projects);
    sendJson(res, 200, removed);
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

async function handleUpload(req, res, pathname) {
  if (pathname !== "/api/upload") return false;
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }
  if (!isAuthed(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const body = await readBody(req, 12 * 1024 * 1024);
  const file = parseMultipart(body, req.headers["content-type"]).find((part) => part.name === "image");
  if (!file || !file.body.length) {
    sendJson(res, 400, { error: "No image uploaded" });
    return true;
  }

  if (!IMAGE_EXTENSIONS[file.type]) {
    sendJson(res, 400, { error: "Unsupported image type" });
    return true;
  }

  const url = USE_SUPABASE ? await uploadSupabaseFile(file) : await uploadLocalFile(file);
  sendJson(res, 201, { url });
  return true;
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  if (filePath === "/admin") filePath = "/admin.html";
  if (filePath === "/login") filePath = "/login.html";

  const absolute = path.normalize(path.join(ROOT, filePath));
  if (!absolute.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(absolute, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const type = MIME_TYPES[path.extname(absolute).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (await handleAuth(req, res, pathname)) return;
    if (await handleProfile(req, res, pathname)) return;
    if (await handleProjects(req, res, pathname)) return;
    if (await handleUpload(req, res, pathname)) return;
    serveStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

if (require.main === module) {
  ensureStorage().then(() => {
    server.listen(PORT, () => {
      console.log(`Portfolio CMS running at http://127.0.0.1:${PORT}`);
      console.log(`Storage: ${USE_SUPABASE ? "Supabase" : "local JSON/uploads"}`);
    });
  });
}

module.exports = server;
