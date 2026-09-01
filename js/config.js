/* ===== API CONFIG =====
   Change API_BASE if your Spring Boot app runs on a different host/port. */
const API_BASE = "http://localhost:8080/api";

const API = {
  productsAll: `${API_BASE}/products`,
  productsByCategory: (category) =>
    `${API_BASE}/products/category?category=${encodeURIComponent(category)}`,
  productById: (id) => `${API_BASE}/products/Id?id=${id}`,

  register: `${API_BASE}/users/register`,
  login: (username, password) =>
    `${API_BASE}/users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  forgotPassword: (email) =>
    `${API_BASE}/users/forgot/request?email=${encodeURIComponent(email)}`,
  verifyOtp: (email, otp) =>
    `${API_BASE}/users/verify/otp?email=${encodeURIComponent(email)}&otp=${otp}`,
  resetPassword: (email, password) =>
    `${API_BASE}/users/reset/password?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,

  placeOrder: (username) => `${API_BASE}/orders/place?username=${encodeURIComponent(username)}`,
  ordersByUser: (id) => `${API_BASE}/orders/by/user?id=${id}`,
  cancelOrder: (id) => `${API_BASE}/orders/cancel?id=${id}`,
  getProductsByOrderId: (id) => `${API_BASE}/orders/getByProductId?id=${id}`,
  deleteUser: (id) => `${API_BASE}/users/delete/user?id=${id}`,

  addToCart: (userId, productId) =>
    `${API_BASE}/users/addToCart?userId=${userId}&productId=${productId}`,
  removeCart: (userId, productId) =>
    `${API_BASE}/users/removeCart?userId=${userId}&productId=${productId}`,
  getCartItems: (userId) => `${API_BASE}/users/getCartItems?userId=${userId}`,
};

/* Fire-and-forget calls to persist cart changes on the backend against the logged-in user.
   Silently no-ops for guests, since these endpoints need a userId. */
function syncAddToCartServer(productId) {
  const user = getUser();
  if (!user) return;
  fetch(API.addToCart(user.id, productId), { method: "PATCH" }).catch(() => {});
}
function syncRemoveFromCartServer(productId) {
  const user = getUser();
  if (!user) return;
  fetch(API.removeCart(user.id, productId), { method: "PATCH" }).catch(() => {});
}

/* ===== USER (SESSION) HELPERS =====
   Backend has no token — we just persist the returned user object. */
const USER_KEY = "agribegri_user";

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function logoutUser() {
  localStorage.removeItem(USER_KEY);
}
function isLoggedIn() {
  return !!getUser();
}

/* ===== CART HELPERS =====
   No cart API on the backend, so the cart is stored locally as { productId: qty } */
const CART_KEY = "agribegri_cart";

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : {};
}
function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(productId, qty = 1) {
  if (isLoggedIn()) {
    // Logged-in users: backend is the only source of truth, don't touch localStorage
    for (let i = 0; i < qty; i++) syncAddToCartServer(productId);
    updateCartBadge();
    return;
  }
  const cart = getCart();
  const key = String(productId);
  cart[key] = (cart[key] || 0) + qty;
  setCart(cart);
}
function updateCartQty(productId, qty) {
  const cart = getCart();
  const key = String(productId);
  const previousQty = cart[key] || 0;
  const diff = qty - previousQty;

  if (qty <= 0) {
    delete cart[key];
  } else {
    cart[key] = qty;
  }
  setCart(cart);

  if (diff > 0) {
    for (let i = 0; i < diff; i++) syncAddToCartServer(productId);
  } else if (diff < 0) {
    for (let i = 0; i < -diff; i++) syncRemoveFromCartServer(productId);
  }
}
function removeFromCart(productId) {
  const cart = getCart();
  const qty = cart[String(productId)] || 0;
  delete cart[String(productId)];
  setCart(cart);
  for (let i = 0; i < qty; i++) syncRemoveFromCartServer(productId);
}
function clearCart() {
  setCart({});
}
function getCartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  const user = getUser();
  if (!user) {
    badge.textContent = getCartCount();
    return;
  }

  // Logged-in users: backend is the source of truth (a product appears once per unit).
  fetch(API.getCartItems(user.id))
    .then((res) => (res.ok ? res.json() : []))
    .then((list) => {
      badge.textContent = (list || []).length;
    })
    .catch(() => {
      badge.textContent = getCartCount(); // fall back to local cache if the call fails
    });
}

/* Small helper: safely format currency */
function formatPrice(amount) {
  const n = Number(amount) || 0;
  return "₹" + n.toLocaleString("en-IN");
}