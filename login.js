const form = document.querySelector("#loginForm");
const input = document.querySelector("#tokenInput");
const toast = document.querySelector("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = input.value.trim();
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    showToast("密钥不正确");
    return;
  }

  localStorage.setItem("portfolioAdminToken", token);
  window.location.href = "./admin.html";
});

lucide.createIcons();
