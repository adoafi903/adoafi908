const PRODUCTS_URL = "products.json";

const SORTERS = {
  popular: (items) => [...items].sort((a, b) => b.pvCount - a.pvCount),
  recommend: (items) => [...items].sort((a, b) => b.cvrScore - a.cvrScore),
};

// 商品ごとに「現在表示中のサムネイル」を保持する
const selectedImageMap = new Map();

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderProducts(items) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  for (const product of items) {
    const currentImg = selectedImageMap.get(product.id) || product.images[0];

    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = product.id;

    const thumbsHtml = product.images.length > 1
      ? `<div class="thumb-row">${product.images
          .map(
            (img, idx) => `
              <button type="button" class="thumb ${img === currentImg ? "is-active" : ""}" data-img="${escapeHtml(img)}">
                <img src="${escapeHtml(img)}" alt="サンプル${idx + 1}">
              </button>`
          )
          .join("")}</div>`
      : "";

    card.innerHTML = `
      <div class="product-media-col">
        <div class="product-media">
          <a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
            <img class="product-media-main" src="${escapeHtml(currentImg)}" alt="${escapeHtml(product.title)}">
          </a>
          ${product.discountBadge ? `<span class="badge-discount">${escapeHtml(product.discountBadge)}</span>` : ""}
        </div>
        ${thumbsHtml}
      </div>
      <div class="product-details-col">
        <div>
          <span class="badge-category">${escapeHtml(product.category)}</span>
          <h3 class="product-title">
            <a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.title)}</a>
          </h3>
          <p class="product-price">${escapeHtml(product.price)}</p>
        </div>
        <div class="cta-area">
          <a class="cta-btn" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
            👉 続きを試し読み・購入する
          </a>
          <p class="cta-note">※外部販売サイト（FANZA/DLsite等）へ遷移します</p>
        </div>
      </div>
    `;

    card.querySelectorAll(".thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedImageMap.set(product.id, btn.dataset.img);
        renderProducts(items);
      });
    });

    list.appendChild(card);
  }
}

async function main() {
  const response = await fetch(PRODUCTS_URL);
  const products = await response.json();

  let currentSort = "recommend";
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
