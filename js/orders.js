function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status) {
  return (status || "").toLowerCase();
}

function orderCardHtml(order) {
  const items = order.orderItemDtoList || [];
  return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-top">
        <div>
          <div class="order-id">${escapeHtml(order.orderId || "Order #" + order.id)}</div>
          <div class="order-date">${formatDate(order.orderTime)}</div>
        </div>
        <span class="order-status ${statusClass(order.status)}">${escapeHtml(order.status || "")}</span>
      </div>

      <ul class="order-items">
        ${items
          .map((item) => `<li>${escapeHtml(item.productName)} &times; ${item.productQuantity}</li>`)
          .join("") || "<li>No item details available</li>"}
      </ul>
      <p class="order-hint">Click to view product details</p>
      <div class="order-detail-panel" data-loaded="false"></div>

      <div class="order-bottom">
        <span class="order-total">${formatPrice(order.totalAmount)}</span>
        ${
          statusClass(order.status) === "cancelled"
            ? ""
            : `<button class="btn btn-outline btn-sm cancel-order-btn" data-id="${order.id}">Cancel order</button>`
        }
      </div>
    </div>
  `;
}

function orderProductMiniHtml(p) {
  return `
    <div class="order-product-mini" data-id="${p.id}">
      <img src="${p.imageUrl || ""}" alt="${escapeHtml(p.title)}"
           onerror="this.src='https://via.placeholder.com/70?text=No+Image'">
      <div class="info">
        <p class="title">${escapeHtml(p.title)}</p>
        <p class="cat">${escapeHtml(p.category || "")}</p>
        <p class="price">${formatPrice(p.amount)}</p>
      </div>
    </div>
  `;
}

function toggleOrderDetail(card) {
  const panel = card.querySelector(".order-detail-panel");
  const orderId = card.dataset.orderId;

  if (panel.classList.contains("open")) {
    panel.classList.remove("open");
    return;
  }

  // Close any other open panels so only one is expanded at a time
  document.querySelectorAll(".order-detail-panel.open").forEach((p) => p.classList.remove("open"));

  panel.classList.add("open");
  if (panel.dataset.loaded === "true") return;

  panel.innerHTML = `<p class="empty-msg" style="padding:10px 0;">Loading product details...</p>`;

  fetch(API.getProductsByOrderId(orderId))
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      return res.json();
    })
    .then((products) => {
      panel.dataset.loaded = "true";
      if (!products || products.length === 0) {
        panel.innerHTML = `<p class="empty-msg" style="padding:10px 0;">No product details available.</p>`;
        return;
      }
      panel.innerHTML = products.map(orderProductMiniHtml).join("");
      panel.querySelectorAll(".order-product-mini").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          window.location.href = "product.html?id=" + el.dataset.id;
        });
      });
    })
    .catch(() => {
      panel.innerHTML = `<p class="empty-msg" style="padding:10px 0;">Could not load product details.</p>`;
    });
}

function renderOrders(orders) {
  const area = document.getElementById("ordersArea");
  if (!orders || orders.length === 0) {
    area.innerHTML = `<p class="empty-msg">You haven't placed any orders yet.</p>`;
    return;
  }
  area.innerHTML = orders.map(orderCardHtml).join("");

  area.querySelectorAll(".order-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".cancel-order-btn")) return;
      toggleOrderDetail(card);
    });
  });

  area.querySelectorAll(".cancel-order-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cancelOrder(btn.dataset.id);
    });
  });
}

function cancelOrder(orderId) {
  const confirmed = confirm("Cancel this order? This can't be undone.");
  if (!confirmed) return;

  fetch(API.cancelOrder(orderId), { method: "POST" })
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      // Backend removes the order entirely, so drop the card from view
      const card = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
      if (card) card.remove();
      if (document.querySelectorAll(".order-card").length === 0) {
        document.getElementById("ordersArea").innerHTML =
          `<p class="empty-msg">You haven't placed any orders yet.</p>`;
      }
    })
    .catch(() => {
      alert("Could not cancel this order. Please try again.");
    });
}

function loadOrders() {
  if (!isLoggedIn()) {
    window.location.href = "login.html?redirect=" + encodeURIComponent("orders.html");
    return;
  }
  const user = getUser();

  fetch(API.ordersByUser(user.id))
    .then((res) => {
      if (!res.ok) throw new Error("failed");
      return res.json();
    })
    .then(renderOrders)
    .catch(() => {
      document.getElementById("ordersArea").innerHTML =
        `<p class="empty-msg">Could not load your orders. Please refresh.</p>`;
    });
}

document.addEventListener("DOMContentLoaded", loadOrders);
