let cartProducts = []; // [{product, qty}]

function usingServerCart() {
  return isLoggedIn();
}

function loadCart() {
  if (usingServerCart()) {
    loadCartFromServer();
  } else {
    loadCartFromLocalStorage();
  }
}

/* Logged-in: backend returns one entry per unit, e.g. same product twice = qty 2 */
function loadCartFromServer() {
  const user = getUser();
  const wrap = document.getElementById("cartItems");
  wrap.innerHTML = `<p class="empty-msg">Loading cart...</p>`;

  fetch(API.getCartItems(user.id))
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      return res.json();
    })
    .then((products) => {
      const counts = {};
      const productMap = {};
      (products || []).forEach((p) => {
        counts[p.id] = (counts[p.id] || 0) + 1;
        productMap[p.id] = p;
      });
      cartProducts = Object.keys(counts).map((id) => ({
        product: productMap[id],
        qty: counts[id],
      }));
      renderCartItems();
      renderSummary();
    })
    .catch(() => {
      wrap.innerHTML = `<p class="empty-msg">Could not load your cart. Please refresh.</p>`;
    });
}

/* Guest: id -> qty map stored locally, fetch each product's current details */
function loadCartFromLocalStorage() {
  const cart = getCart();
  const ids = Object.keys(cart);
  const wrap = document.getElementById("cartItems");

  if (ids.length === 0) {
    wrap.innerHTML = `<p class="empty-msg">Your cart is empty. <a href="index.html" style="color:var(--primary);font-weight:600;">Continue shopping</a></p>`;
    cartProducts = [];
    renderSummary();
    return;
  }

  Promise.all(
    ids.map((id) =>
      fetch(API.productById(id))
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    )
  ).then((products) => {
    cartProducts = products
      .map((p, i) => (p ? { product: p, qty: cart[ids[i]] } : null))
      .filter(Boolean);
    renderCartItems();
    renderSummary();
  });
}

function renderCartItems() {
  const wrap = document.getElementById("cartItems");
  if (cartProducts.length === 0) {
    wrap.innerHTML = `<p class="empty-msg">Your cart is empty.</p>`;
    return;
  }

  wrap.innerHTML = cartProducts
    .map(
      ({ product, qty }) => `
      <div class="cart-item" data-id="${product.id}">
        <img src="${product.imageUrl || ""}" alt="${escapeHtml(product.title)}"
             onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
        <div class="info">
          <h4>${escapeHtml(product.title)}</h4>
          <p class="unit-price">${formatPrice(product.amount)} each</p>
          <div class="qty-selector">
            <button class="qty-minus" data-id="${product.id}">-</button>
            <span>${qty}</span>
            <button class="qty-plus" data-id="${product.id}">+</button>
          </div>
        </div>
        <div class="line-total">${formatPrice(product.amount * qty)}</div>
        <button class="remove-btn" data-id="${product.id}">Remove</button>
      </div>
    `
    )
    .join("");

  wrap.querySelectorAll(".cart-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      window.location.href = "product.html?id=" + item.dataset.id;
    });
  });
  wrap.querySelectorAll(".qty-minus").forEach((btn) =>
    btn.addEventListener("click", () => changeCartQty(btn.dataset.id, -1))
  );
  wrap.querySelectorAll(".qty-plus").forEach((btn) =>
    btn.addEventListener("click", () => changeCartQty(btn.dataset.id, 1))
  );
  wrap.querySelectorAll(".remove-btn").forEach((btn) =>
    btn.addEventListener("click", () => removeEntireItem(btn.dataset.id))
  );

  wrap.querySelectorAll(".cart-item").forEach((row) => {
    row.style.cursor = "pointer";
    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) return; // don't navigate on qty/remove clicks
      window.location.href = "product.html?id=" + row.dataset.id;
    });
  });
}

function changeCartQty(id, delta) {
  const entry = cartProducts.find((e) => String(e.product.id) === String(id));
  if (!entry) return;
  const max = entry.product.macCount ?? 99;
  const newQty = Math.min(Math.max(1, entry.qty + delta), Math.max(max, 1));
  const actualDelta = newQty - entry.qty;
  if (actualDelta === 0) return;

  if (usingServerCart()) {
    const user = getUser();
    const call = actualDelta > 0 ? API.addToCart : API.removeCart;
    fetch(call(user.id, id), { method: "PATCH" })
      .then(() => loadCartFromServer())
      .catch(() => loadCartFromServer());
  } else {
    updateCartQty(id, newQty);
    loadCartFromLocalStorage();
  }
}

function removeEntireItem(id) {
  const entry = cartProducts.find((e) => String(e.product.id) === String(id));
  if (!entry) return;

  if (usingServerCart()) {
    const user = getUser();
    // Remove one unit at a time to clear all of this product from the server cart
    const removeAll = async () => {
      for (let i = 0; i < entry.qty; i++) {
        await fetch(API.removeCart(user.id, id), { method: "PATCH" }).catch(() => {});
      }
      loadCartFromServer();
    };
    removeAll();
  } else {
    removeFromCart(id);
    loadCartFromLocalStorage();
  }
}

function renderSummary() {
  const totalItems = cartProducts.reduce((sum, e) => sum + e.qty, 0);
  const totalAmount = cartProducts.reduce((sum, e) => sum + e.product.amount * e.qty, 0);
  document.getElementById("sumItems").textContent = totalItems;
  document.getElementById("sumTotal").textContent = formatPrice(totalAmount);
}

function placeOrder() {
  const msg = document.getElementById("cartMsg");
  if (cartProducts.length === 0) {
    msg.className = "form-msg error";
    msg.textContent = "Your cart is empty.";
    return;
  }
  if (!isLoggedIn()) {
    window.location.href = "login.html?redirect=" + encodeURIComponent("cart.html");
    return;
  }

  const user = getUser();
  const productQuantity = {};
  cartProducts.forEach((e) => (productQuantity[e.product.id] = e.qty));
  const totalAmount = cartProducts.reduce((sum, e) => sum + e.product.amount * e.qty, 0);

  msg.className = "form-msg";
  msg.textContent = "Placing order...";

  fetch(API.placeOrder(user.userName), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productQuantity, totalAmount }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Order failed");
      return res.json();
    })
    .then(async () => {
      // Clear the server-side cart now that the order has been placed
      for (const entry of cartProducts) {
        for (let i = 0; i < entry.qty; i++) {
          await fetch(API.removeCart(user.id, entry.product.id), { method: "PATCH" }).catch(() => {});
        }
      }
      clearCart(); // also clear any leftover local guest cache
      msg.className = "form-msg success";
      msg.textContent = "Order placed successfully!";
      loadCart();
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Could not place order. Check product availability and try again.";
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
});

