let allProducts = [];

function productCardHtml(p) {
  const img = p.imageUrl || "";
  return `
    <div class="product-card" data-id="${p.id}">
      <img class="thumb" src="${img}" alt="${escapeHtml(p.title)}"
           onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
      <p class="p-title">${escapeHtml(p.title)}</p>
      <p class="p-price">${formatPrice(p.amount)}</p>
      <div class="p-actions">
        <button class="btn btn-outline btn-sm add-cart-btn" data-id="${p.id}">Add to cart</button>
        <button class="btn btn-primary btn-sm buy-now-btn" data-id="${p.id}">Buy now</button>
      </div>
    </div>
  `;
}

function wireProductCardEvents(container) {
  container.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      window.location.href = "product.html?id=" + card.dataset.id;
    });
  });
  container.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id, 1);
      btn.textContent = "Added";
      setTimeout(() => (btn.textContent = "Add to cart"), 1200);
    });
  });
  container.querySelectorAll(".buy-now-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "product.html?id=" + btn.dataset.id + "&buyNow=1";
    });
  });
}

function renderByCategory(products) {
  const area = document.getElementById("productArea");
  if (products.length === 0) {
    area.innerHTML = `<p class="empty-msg">No products available right now.</p>`;
    return;
  }

  const categories = [];
  const grouped = {};
  products.forEach((p) => {
    const cat = p.category || "Other";
    if (!grouped[cat]) {
      grouped[cat] = [];
      categories.push(cat);
    }
    grouped[cat].push(p);
  });

  area.innerHTML = categories
    .map(
      (cat) => `
      <div class="category-block">
        <div class="category-heading">
          <span>${escapeHtml(cat)}</span>
          <a href="index.html?category=${encodeURIComponent(cat)}">View all</a>
        </div>
        <div class="product-row">
          ${grouped[cat].map(productCardHtml).join("")}
        </div>
      </div>
    `
    )
    .join("");

  wireProductCardEvents(area);
}

function renderFlatGrid(products, heading) {
  const area = document.getElementById("productArea");
  if (products.length === 0) {
    area.innerHTML = `<p class="empty-msg">No products found.</p>`;
    return;
  }
  area.innerHTML = `
    <div class="category-block">
      <div class="category-heading"><span>${escapeHtml(heading)}</span></div>
      <div class="product-grid">
        ${products.map(productCardHtml).join("")}
      </div>
    </div>
  `;
  wireProductCardEvents(area);
}

function loadProducts() {
  fetch(API.productsAll)
    .then((res) => res.json())
    .then((data) => {
      allProducts = data || [];

      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      const category = params.get("category");

      if (search) {
        const q = search.toLowerCase();
        const results = allProducts.filter((p) =>
          (p.title || "").toLowerCase().includes(q)
        );
        renderFlatGrid(results, `Results for "${search}"`);
      } else if (category) {
        const results = allProducts.filter((p) => p.category === category);
        renderFlatGrid(results, category);
      } else {
        renderByCategory(allProducts);
      }
    })
    .catch(() => {
      document.getElementById("productArea").innerHTML =
        `<p class="empty-msg">Could not load products. Is the backend running on localhost:8080?</p>`;
    });
}

/* ===== BANNER CAROUSEL ===== */
function initBanner() {
  const slides = document.querySelectorAll(".banner-slide");
  const dotsWrap = document.getElementById("bannerDots");
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll("span");

  function goTo(i) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  document.getElementById("bannerNext").addEventListener("click", () => {
    goTo(current + 1);
    resetTimer();
  });
  document.getElementById("bannerPrev").addEventListener("click", () => {
    goTo(current - 1);
    resetTimer();
  });

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 4000);
  }
  resetTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  initBanner();
  loadProducts();
});
