let currentProduct = null;
let currentQty = 1;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function stockInfo(macCount) {
  if (macCount === undefined || macCount === null) return { cls: "in", text: "In stock" };
  if (macCount <= 0) return { cls: "out", text: "Out of stock" };
  if (macCount <= 5) return { cls: "low", text: `Only ${macCount} left in stock` };
  return { cls: "in", text: "In stock" };
}

function renderProduct(p) {
  currentProduct = p;
  const stock = stockInfo(p.macCount);
  const area = document.getElementById("productArea");

  area.innerHTML = `
    <div class="product-detail">
      <img class="main-image" src="${p.imageUrl || ""}" alt="${escapeHtml(p.title)}"
           onerror="this.src='https://via.placeholder.com/500x420?text=No+Image'">
      <div>
        <span class="category-tag">${escapeHtml(p.category || "")}</span>
        <h1>${escapeHtml(p.title)}</h1>
        <p class="price">${formatPrice(p.amount)}</p>
        <p class="desc">${escapeHtml(p.description || "No description available.")}</p>
        <p class="stock ${stock.cls}">${stock.text}</p>

        <div class="qty-selector">
          <button id="qtyMinus">-</button>
          <span id="qtyValue">1</span>
          <button id="qtyPlus">+</button>
        </div>

        <div class="detail-actions">
          <button class="btn btn-outline" id="addCartBtn">Add to cart</button>
          <button class="btn btn-primary" id="buyNowBtn">Buy now</button>
        </div>
        <p class="form-msg" id="productMsg"></p>
      </div>
    </div>
  `;

  document.getElementById("qtyMinus").addEventListener("click", () => changeQty(-1));
  document.getElementById("qtyPlus").addEventListener("click", () => changeQty(1));
  document.getElementById("addCartBtn").addEventListener("click", handleAddToCart);
  document.getElementById("buyNowBtn").addEventListener("click", handleBuyNow);
}

function changeQty(delta) {
  const max = currentProduct.macCount ?? 99;
  currentQty = Math.min(Math.max(1, currentQty + delta), Math.max(max, 1));
  document.getElementById("qtyValue").textContent = currentQty;
}

function handleAddToCart() {
  addToCart(currentProduct.id, currentQty);
  const msg = document.getElementById("productMsg");
  msg.className = "form-msg success";
  msg.textContent = "Added to cart.";
}

function handleBuyNow() {
  if (!isLoggedIn()) {
    const redirectUrl = "product.html?id=" + currentProduct.id;
    window.location.href = "login.html?redirect=" + encodeURIComponent(redirectUrl);
    return;
  }

  const user = getUser();
  const msg = document.getElementById("productMsg");
  msg.className = "form-msg";
  msg.textContent = "Placing order...";

  const body = {
    productQuantity: { [currentProduct.id]: currentQty },
    totalAmount: currentProduct.amount * currentQty,
  };

  fetch(API.placeOrder(user.userName), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Order failed");
      return res.json();
    })
    .then(() => {
      msg.className = "form-msg success";
      msg.textContent = "Order placed successfully!";
    })
    .catch(() => {
      msg.className = "form-msg error";
      msg.textContent = "Could not place order. Please try again.";
    });
}

function loadProduct() {
  const id = getProductId();
  if (!id) {
    document.getElementById("productArea").innerHTML =
      `<p class="empty-msg">No product specified.</p>`;
    return;
  }

  fetch(API.productById(id))
    .then((res) => {
      if (!res.ok) throw new Error("Not found");
      return res.json();
    })
    .then(renderProduct)
    .catch(() => {
      document.getElementById("productArea").innerHTML =
        `<p class="empty-msg">Product not found.</p>`;
    });
}

document.addEventListener("DOMContentLoaded", loadProduct);
