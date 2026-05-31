function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags : [];
}

function fallbackBody(project) {
  return `
    <h2>项目介绍</h2>
    <p>${escapeHtml(project.summary || "这个作品还没有填写详细介绍，可以在后台的富文本详情里补充。")}</p>
  `;
}

async function loadProject() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    document.querySelector("#projectBody").innerHTML = "<p>没有找到作品 ID。</p>";
    return;
  }

  const response = await fetch(`/api/projects/${encodeURIComponent(id)}`);
  if (!response.ok) {
    document.querySelector("#projectBody").innerHTML = "<p>作品不存在或已被删除。</p>";
    return;
  }

  const project = await response.json();
  document.title = `${project.title} · 作品详情`;
  document.querySelector("#projectType").textContent = `${project.type} · ${project.year}`;
  document.querySelector("#projectTitle").textContent = project.title;
  document.querySelector("#projectSummary").textContent = project.summary || "";
  document.querySelector("#projectImage").src = project.image;
  document.querySelector("#projectImage").alt = project.title;
  document.querySelector("#projectTags").innerHTML = normalizeTags(project.tags)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
  document.querySelector("#projectBody").innerHTML = project.body || fallbackBody(project);
}

loadProject();
lucide.createIcons();
