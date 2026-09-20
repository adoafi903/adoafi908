const PRODUCTS_URL = "products.json";
const AGE_GATE_KEY = "age_gate_confirmed";

const GENRE_LABELS = {
  電子書籍: "📖 電子書籍",
  アダルト写真集: "📸 アダルト写真集",
  DL動画: "🎬 DL動画",
  DVD: "💿 DVD",
};

const SORTERS = {
  popular: (items) => [...items].sort((a, b) => b.pvCount - a.pvCount),
  recommend: (items) => [...items].sort((a, b) => b.cvrScore - a.cvrScore),
};

const selectedImageMap = new Map();

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function setupAgeGate() {
  const gate = document.getElementById("age-gate");
  let confirmed = false;
  try {
    confirmed = localStorage.getItem(AGE_GATE_KEY) === "1";
  } catch (e) {
    confirmed = false;
  }

  if (confirmed) {
    gate.style.display = "none";
  }

  document.getElementById("age-gate-yes").addEventListener("click", () => {
    try {
      localStorage.setItem(AGE_GATE_KEY, "1");
    } catch (e) {
      // localStorageが使えない環境ではセッション中のみ非表示にする
    }
    gate.style.display = "none";
  });
}

function filterAndSort(products, genre, sortType) {
  const filtered = genre === "ALL" ? products : products.filter((p) => p.category === genre);
  return SORTERS[sortType](filtered);
}

function renderResultCount(genre, count) {
  const label = genre === "ALL" ? "すべて" : genre;
  document.getElementById("result-count").innerHTML =
    `表示中: <span class="result-count-genre">${escapeHtml(label)}</span>（${count}件）`;
}

function renderProducts(items) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `<p class="empty-state">該当する作品が見つかりませんでした。</p>`;
    return;
  }

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

    const genreLabel = GENRE_LABELS[product.category] || escapeHtml(product.category);

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
          <span class="badge-category">${genreLabel}</span>
          <h3 class="product-title">
            <a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.title)}</a>
          </h3>
          <p class="product-price">${escapeHtml(product.price)}</p>
        </div>
        <div class="cta-area">
          <a class="cta-btn" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
            👉 サンプルを見る・購入する
          </a>
          <p class="cta-note">※FANZA / DLsite 等の外部公式販売サイトへ遷移します</p>
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
  setupAgeGate();

  const response = await fetch(PRODUCTS_URL);
  const products = await response.json();

  const params = new URLSearchParams(window.location.search);
  const requestedGenre = params.get("genre");
  const validGenres = ["ALL", ...Object.keys(GENRE_LABELS)];

  let currentGenre = validGenres.includes(requestedGenre) ? requestedGenre : "ALL";
  let currentSort = "recommend";

  const genreSelect = document.getElementById("genre-select");
  genreSelect.value = currentGenre;

  function update() {
    const result = filterAndSort(products, currentGenre, currentSort);
    renderResultCount(currentGenre, result.length);
    renderProducts(result);
  }

  update();

  genreSelect.addEventListener("change", () => {
    currentGenre = genreSelect.value;
    update();
  });

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSort = btn.dataset.sort;
      document.querySelectorAll(".sort-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      update();
    });
  });
}

main();
