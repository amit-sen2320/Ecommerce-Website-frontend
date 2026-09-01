function renderAuthArea() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  const user = getUser();
  if (user) {
    authArea.innerHTML = `
      <div class="account-menu">
        <button id="accountBtn" class="header-link account-btn">
          Hi, ${escapeHtml(user.name || user.userName)} <span class="caret">&#9662;</span>
        </button>
        <div class="account-dropdown" id="accountDropdown">
          <a href="orders.html">Orders</a>
          <button id="deleteAccountBtn" class="dropdown-danger">Delete account</button>
          <button id="logoutBtn">Logout</button>
        </div>
      </div>
    `;

    const dropdown = document.getElementById("accountDropdown");
    document.getElementById("accountBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));

    document.getElementById("logoutBtn").addEventListener("click", () => {
      logoutUser();
      clearCart();
      window.location.href = "index.html";
    });

    document.getElementById("deleteAccountBtn").addEventListener("click", () => {
      const confirmed = confirm(
        "This will permanently delete your account. This can't be undone. Continue?"
      );
      if (!confirmed) return;

      fetch(API.deleteUser(user.id), { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("failed");
          logoutUser();
          clearCart();
          alert("Your account has been deleted.");
          window.location.href = "index.html";
        })
        .catch(() => {
          alert("Could not delete your account. Please try again.");
        });
    });
  } else {
    authArea.innerHTML = `
      <a href="login.html" class="header-link">Login</a>
      <a href="register.html" class="header-link">Register</a>
    `;
  }
}

function wireSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  if (!input || !btn) return;

  const doSearch = () => {
    const q = input.value.trim();
    if (!q) return;
    window.location.href = "index.html?search=" + encodeURIComponent(q);
  };

  btn.addEventListener("click", doSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // Pre-fill search box if we're on the results page
  const params = new URLSearchParams(window.location.search);
  const existing = params.get("search");
  if (existing) input.value = existing;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  renderAuthArea();
  wireSearch();
  updateCartBadge();
});

