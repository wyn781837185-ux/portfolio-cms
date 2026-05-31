const token = localStorage.getItem("portfolioAdminToken") || "";

if (!token) {
  window.location.href = "./login.html";
}

const state = {
  token,
  projects: [],
  profile: null,
  draggedId: "",
};

const toast = document.querySelector("#toast");
const tabButtons = document.querySelectorAll("[data-panel]");
const panels = document.querySelectorAll(".admin-panel");
const logoutButton = document.querySelector("#logoutButton");

const profileForm = document.querySelector("#profileForm");
const profileAvatar = document.querySelector("#profileAvatar");
const profileAvatarFile = document.querySelector("#profileAvatarFile");
const profileAvatarPreview = document.querySelector("#profileAvatarPreview");

const profileFields = {
  name: document.querySelector("#profileName"),
  title: document.querySelector("#profileTitle"),
  intro: document.querySelector("#profileIntro"),
  bio: document.querySelector("#profileBio"),
  avatar: profileAvatar,
  email: document.querySelector("#profileEmail"),
  phone: document.querySelector("#profilePhone"),
  availability: document.querySelector("#profileAvailability"),
  skills: document.querySelector("#profileSkills"),
};

const projectForm = document.querySelector("#projectForm");
const adminList = document.querySelector("#adminList");
const imageInput = document.querySelector("#imageInput");
const fileInput = document.querySelector("#fileInput");
const imagePreview = document.querySelector("#imagePreview");
const resetForm = document.querySelector("#resetForm");
const saveOrderButton = document.querySelector("#saveOrderButton");
const formTitle = document.querySelector("#formTitle");
const bodyInput = document.querySelector("#bodyInput");

const fields = {
  id: document.querySelector("#projectId"),
  title: document.querySelector("#titleInput"),
  category: document.querySelector("#categoryInput"),
  year: document.querySelector("#yearInput"),
  type: document.querySelector("#typeInput"),
  tags: document.querySelector("#tagsInput"),
  summary: document.querySelector("#summaryInput"),
  featured: document.querySelector("#featuredInput"),
  image: imageInput,
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function headers(json = true) {
  return json
    ? { "Content-Type": "application/json", "X-Admin-Token": state.token }
    : { "X-Admin-Token": state.token };
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function renderImagePreview(input, target) {
  const value = input.value.trim();
  target.innerHTML = value ? `<img src="${escapeHtml(value)}" alt="图片预览" />` : "<span>暂无图片</span>";
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: headers(false),
    body: formData,
  });
  if (!response.ok) throw new Error("upload failed");
  return response.json();
}

function fillProfile(profile) {
  profileFields.name.value = profile.name || "";
  profileFields.title.value = profile.title || "";
  profileFields.intro.value = profile.intro || "";
  profileFields.bio.value = profile.bio || "";
  profileFields.avatar.value = profile.avatar || "";
  profileFields.email.value = profile.email || "";
  profileFields.phone.value = profile.phone || "";
  profileFields.availability.value = profile.availability || "";
  profileFields.skills.value = normalizeTags(profile.skills).join(", ");
  renderImagePreview(profileAvatar, profileAvatarPreview);
}

async function loadProfile() {
  const response = await fetch("/api/profile");
  state.profile = await response.json();
  fillProfile(state.profile);
}

function resetEditor() {
  projectForm.reset();
  fields.id.value = "";
  bodyInput.innerHTML = "";
  formTitle.textContent = "新增作品";
  renderImagePreview(imageInput, imagePreview);
}

function fillEditor(project) {
  fields.id.value = project.id;
  fields.title.value = project.title || "";
  fields.category.value = project.category || "product";
  fields.year.value = project.year || "";
  fields.type.value = project.type || "";
  fields.tags.value = normalizeTags(project.tags).join(", ");
  fields.summary.value = project.summary || "";
  fields.featured.checked = Boolean(project.featured);
  fields.image.value = project.image || "";
  bodyInput.innerHTML = project.body || "";
  formTitle.textContent = "编辑作品";
  renderImagePreview(imageInput, imagePreview);
  document.querySelector("[data-panel='projectsPanel']").click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderList() {
  if (!state.projects.length) {
    adminList.innerHTML = '<p class="empty-state show">还没有作品，先新增一个吧。</p>';
    return;
  }

  adminList.innerHTML = state.projects
    .map(
      (project) => `
        <article class="admin-item" draggable="true" data-id="${escapeHtml(project.id)}">
          <button class="drag-handle" type="button" aria-label="拖拽排序">
            <i data-lucide="grip-vertical"></i>
          </button>
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" />
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.type)} · ${escapeHtml(project.year)}</p>
            <small>${normalizeTags(project.tags).map(escapeHtml).join(" / ")}</small>
          </div>
          <div class="item-actions">
            <a class="icon-btn" href="./project.html?id=${encodeURIComponent(project.id)}" target="_blank" aria-label="查看详情">
              <i data-lucide="external-link"></i>
            </a>
            <button class="icon-btn" type="button" data-edit="${escapeHtml(project.id)}" aria-label="编辑作品">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn danger" type="button" data-delete="${escapeHtml(project.id)}" aria-label="删除作品">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </article>
      `,
    )
    .join("");
  lucide.createIcons();
}

async function loadProjects() {
  const response = await fetch("/api/projects");
  state.projects = await response.json();
  renderList();
}

async function verifyToken() {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: state.token }),
  });
  if (!response.ok) {
    localStorage.removeItem("portfolioAdminToken");
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.toggle("active", item === button));
    panels.forEach((panel) => panel.classList.toggle("is-hidden", panel.id !== button.dataset.panel));
  });
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("portfolioAdminToken");
  window.location.href = "./login.html";
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: profileFields.name.value.trim(),
    title: profileFields.title.value.trim(),
    intro: profileFields.intro.value.trim(),
    bio: profileFields.bio.value.trim(),
    avatar: profileFields.avatar.value.trim(),
    email: profileFields.email.value.trim(),
    phone: profileFields.phone.value.trim(),
    availability: profileFields.availability.value.trim(),
    skills: normalizeTags(profileFields.skills.value),
  };
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    showToast("资料保存失败");
    return;
  }
  state.profile = await response.json();
  showToast("个人资料已保存");
});

profileAvatarFile.addEventListener("change", async () => {
  const file = profileAvatarFile.files[0];
  if (!file) return;
  try {
    const result = await uploadImage(file);
    profileAvatar.value = result.url;
    renderImagePreview(profileAvatar, profileAvatarPreview);
    showToast("头像已上传");
  } catch {
    showToast("头像上传失败");
  }
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    title: fields.title.value.trim(),
    category: fields.category.value,
    year: fields.year.value.trim(),
    type: fields.type.value.trim(),
    tags: normalizeTags(fields.tags.value),
    summary: fields.summary.value.trim(),
    featured: fields.featured.checked,
    image: fields.image.value.trim(),
    body: bodyInput.innerHTML.trim(),
  };

  const id = fields.id.value;
  const response = await fetch(id ? `/api/projects/${id}` : "/api/projects", {
    method: id ? "PUT" : "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    showToast("作品保存失败");
    return;
  }

  await loadProjects();
  resetEditor();
  showToast("作品已保存");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  try {
    const result = await uploadImage(file);
    imageInput.value = result.url;
    renderImagePreview(imageInput, imagePreview);
    showToast("封面已上传");
  } catch {
    showToast("封面上传失败");
  }
});

imageInput.addEventListener("input", () => renderImagePreview(imageInput, imagePreview));
profileAvatar.addEventListener("input", () => renderImagePreview(profileAvatar, profileAvatarPreview));
resetForm.addEventListener("click", resetEditor);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    bodyInput.focus();
    document.execCommand(button.dataset.command, false, button.dataset.value || null);
  });
});

adminList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const project = state.projects.find((item) => item.id === editButton.dataset.edit);
    if (project) fillEditor(project);
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    const project = state.projects.find((item) => item.id === id);
    if (!project || !confirm(`确定删除「${project.title}」吗？`)) return;

    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: headers(),
    });

    if (!response.ok) {
      showToast("删除失败");
      return;
    }

    await loadProjects();
    resetEditor();
    showToast("作品已删除");
  }
});

adminList.addEventListener("dragstart", (event) => {
  const item = event.target.closest(".admin-item");
  if (!item) return;
  state.draggedId = item.dataset.id;
  item.classList.add("dragging");
});

adminList.addEventListener("dragend", (event) => {
  event.target.closest(".admin-item")?.classList.remove("dragging");
});

adminList.addEventListener("dragover", (event) => {
  event.preventDefault();
  const dragging = adminList.querySelector(".dragging");
  const target = event.target.closest(".admin-item:not(.dragging)");
  if (!dragging || !target) return;
  const rect = target.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  adminList.insertBefore(dragging, after ? target.nextSibling : target);
});

saveOrderButton.addEventListener("click", async () => {
  const order = [...adminList.querySelectorAll(".admin-item")].map((item) => item.dataset.id);
  const response = await fetch("/api/projects/order", {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ order }),
  });
  if (!response.ok) {
    showToast("排序保存失败");
    return;
  }
  await loadProjects();
  showToast("排序已保存");
});

(async function init() {
  if (!(await verifyToken())) return;
  await Promise.all([loadProfile(), loadProjects()]);
  renderImagePreview(imageInput, imagePreview);
  lucide.createIcons();
})();
