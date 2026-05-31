let projects = [];
let profile = null;
let activeFilter = "all";

const grid = document.querySelector("#projectsGrid");
const search = document.querySelector("#projectSearch");
const filterButtons = document.querySelectorAll("[data-filter]");
const navLinks = document.querySelectorAll("[data-nav]");
const themeToggle = document.querySelector("#themeToggle");
const copyEmail = document.querySelector("#copyEmail");
const toast = document.querySelector("#toast");
const menuToggle = document.querySelector(".menu-toggle");
const emptyState = document.querySelector("#emptyState");
const projectTotal = document.querySelector("#projectTotal");
const featuredCase = document.querySelector("#featuredCase");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function renderProfile() {
  if (!profile) return;
  document.title = `${profile.name} · 作品集`;
  document.querySelector("#brandName").textContent = profile.name || "Portfolio";
  document.querySelector(".brand-mark").textContent = (profile.name || "P").trim().slice(0, 1);
  document.querySelector("#profileTitle").textContent = profile.title || "";
  document.querySelector("#profileName").textContent = profile.name || "";
  document.querySelector("#profileIntro").textContent = profile.intro || "";
  document.querySelector("#profileBio").textContent = profile.bio || "有项目想法？一起把它做出来。";
  document.querySelector("#profileAvatar").src = profile.avatar || "";
  document.querySelector("#availabilityText").textContent = profile.availability || "可接新项目";
  document.querySelector("#skillText").textContent = normalizeTags(profile.skills).slice(0, 3).join(" / ");

  document.querySelector("#contactCard").innerHTML = `
    <a href="mailto:${escapeHtml(profile.email || "")}">
      <i data-lucide="mail"></i>
      <span>${escapeHtml(profile.email || "未设置邮箱")}</span>
    </a>
    <a href="tel:${escapeHtml(profile.phone || "")}">
      <i data-lucide="phone"></i>
      <span>${escapeHtml(profile.phone || "未设置电话")}</span>
    </a>
  `;
}

function renderFeaturedCase() {
  const featured = projects.find((project) => project.featured) || projects[0];
  if (!featured) {
    featuredCase.innerHTML = `
      <p class="eyebrow">Case Study</p>
      <h2>还没有作品</h2>
      <p>进入后台上传第一件作品后，这里会自动展示精选案例。</p>
      <a class="wide-btn" href="./login.html">
        <i data-lucide="upload-cloud"></i>
        <span>进入后台</span>
      </a>
    `;
    return;
  }

  featuredCase.innerHTML = `
    <div class="case-image">
      <img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}" />
    </div>
    <p class="eyebrow">Featured Case</p>
    <h2>${escapeHtml(featured.title)}</h2>
    <p>${escapeHtml(featured.summary || `${featured.type} · ${featured.year}`)}</p>
    <div class="case-metrics">
      <span><strong>${escapeHtml(featured.year)}</strong> 项目年份</span>
      <span><strong>${normalizeTags(featured.tags).length}</strong> 核心标签</span>
    </div>
    <a class="wide-btn" href="./project.html?id=${encodeURIComponent(featured.id)}">
      <i data-lucide="file-text"></i>
      <span>查看案例详情</span>
    </a>
  `;
}

function renderProjects() {
  const query = search.value.trim().toLowerCase();
  const visible = projects.filter((project) => {
    const matchesFilter = activeFilter === "all" || project.category === activeFilter;
    const tags = normalizeTags(project.tags);
    const searchText = `${project.title} ${project.type} ${project.year} ${project.summary} ${tags.join(" ")}`.toLowerCase();
    return matchesFilter && searchText.includes(query);
  });

  projectTotal.textContent = projects.length;
  emptyState.classList.toggle("show", visible.length === 0);

  grid.innerHTML = visible
    .map((project) => {
      const tags = normalizeTags(project.tags);
      return `
        <a class="project-card" href="./project.html?id=${encodeURIComponent(project.id)}">
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy" />
          <div class="project-body">
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.summary || "")}</p>
            <div class="project-meta">
              <span>${escapeHtml(project.type)}</span>
              <span>${escapeHtml(project.year)}</span>
              ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </a>
      `;
    })
    .join("");
  renderFeaturedCase();
  lucide.createIcons();
}

async function loadData() {
  const [profileResponse, projectsResponse] = await Promise.all([fetch("/api/profile"), fetch("/api/projects")]);
  profile = await profileResponse.json();
  projects = await projectsResponse.json();
  renderProfile();
  renderProjects();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderProjects();
  });
});

search.addEventListener("input", renderProjects);

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.toggle("active", item === link));
    document.body.classList.remove("nav-open");
  });
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const icon = document.body.classList.contains("dark") ? "sun" : "moon";
  themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
  lucide.createIcons();
});

copyEmail.addEventListener("click", async () => {
  await navigator.clipboard.writeText(profile?.email || "");
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
});

menuToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

document.addEventListener("click", (event) => {
  const clickedSidebar = event.target.closest(".sidebar");
  const clickedMenu = event.target.closest(".menu-toggle");
  if (!clickedSidebar && !clickedMenu) {
    document.body.classList.remove("nav-open");
  }
});

loadData();
lucide.createIcons();
