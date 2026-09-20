const PRODUCTS_URL = "products.json";

const SORTERS = {
  popularity: (items) => [...items].sort((a, b) => b.views - a.views),
  recommended: (items) => {
    const maxSales = Math.max(1, ...items.map((p) => p.sales));
    // クリック率(clicks/views)と売上を1:1で正規化して合成した「おすすめ度」
    return [...items].sort((a, b) => recommendScore(b, maxSales) - recommendScore(a, maxSales));
  },
};

function recommendScore(product, maxSales) {
  const ctr = product.views > 0 ? product.clicks / product.views : 0;
  const salesRatio = product.sales / maxSales;
  return ctr * 0.5 + salesRatio * 0.5;
}

function renderProducts(items) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  for (const product of items) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${escapeHtml(product.packageImageUrl)}" alt="${escapeHtml(product.title)}" loading="lazy">
      <div class="product-body">
        <p class="product-title">${escapeHtml(product.title)}</p>
        <p class="product-stats">閲覧 ${product.views.toLocaleString()} ・ クリック ${product.clicks.toLocaleString()} ・ 購入 ${product.sales.toLocaleString()}</p>
        <a class="affiliate-btn" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener sponsored">詳細を見る</a>
      </div>
    `;
    grid.appendChild(card);
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function main() {
  const response = await fetch(PRODUCTS_URL);
  const products = await response.json();

  let currentSort = "popularity";
  renderProducts(SORTERS[currentSort](products));

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSort = btn.dataset.sort;
      document.querySelectorAll(".sort-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderProducts(SORTERS[currentSort](products));
    });
  });
}

main();
