const PRODUCTS_URL = "products.json";
const AGE_GATE_KEY = "age_gate_confirmed";
const FAVORITES_KEY = "favorite_ids";

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
let allProducts = [];

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

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch (e) {
    // localStorageが使えない環境ではお気に入りは保存されない
  }
}

let favoriteIds = new Set(loadFavorites());

function isFavorite(id) {
  return favoriteIds.has(id);
}

function toggleFavorite(id) {
  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
  } else {
    favoriteIds.add(id);
  }
  saveFavorites([...favoriteIds]);
  updateFavoritesFabCount();
}

function updateFavoritesFabCount() {
  document.getElementById("favorites-fab-count").textContent = favoriteIds.size;
}

function renderRankingBanner(products) {
  const banner = document.querySelector(".ranking-banner");
  const track = document.getElementById("ranking-banner-track");
  if (!banner || !track) return;

  const mangaRanking = products
    .filter((p) => p.category === "電子書籍")
    .sort((a, b) => b.cvrScore - a.cvrScore);

  if (mangaRanking.length === 0) {
    banner.hidden = true;
    return;
  }

  const itemsHtml = mangaRanking
    .map(
      (p) => `
        <a class="ranking-banner-item" href="${escapeHtml(p.affiliateUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.title)}">
          <img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.title)}" loading="lazy">
        </a>`
    )
    .join("");

  // 途切れなくループさせるため、同じ並びを2セット連結する
  track.innerHTML = itemsHtml + itemsHtml;
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
    const favActive = isFavorite(product.id);

    card.innerHTML = `
      <div class="product-media-col">
        <div class="product-media">
          <a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
            <img class="product-media-main" src="${escapeHtml(currentImg)}" alt="${escapeHtml(product.title)}">
          </a>
          ${product.discountBadge ? `<span class="badge-discount">${escapeHtml(product.discountBadge)}</span>` : ""}
          <button type="button" class="favorite-btn ${favActive ? "is-active" : ""}" aria-label="お気に入り登録">
            ${favActive ? "★" : "☆"}
          </button>
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
          ${product.comment ? `<p class="product-comment">${escapeHtml(product.comment)}</p>` : ""}
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

    card.querySelector(".favorite-btn").addEventListener("click", () => {
      toggleFavorite(product.id);
      renderProducts(items);
    });

    list.appendChild(card);
  }
}

function renderFavoritesModal() {
  const body = document.getElementById("favorites-modal-body");
  const favoriteProducts = allProducts.filter((p) => favoriteIds.has(p.id));

  if (favoriteProducts.length === 0) {
    body.innerHTML = `<p class="empty-state">お気に入りはまだありません。</p>`;
    return;
  }

  body.innerHTML = favoriteProducts
    .map(
      (p) => `
        <label class="favorites-row">
          <input type="checkbox" class="favorites-row-checkbox" data-id="${escapeHtml(p.id)}" checked>
          <img class="favorites-row-thumb" src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.title)}">
          <span class="favorites-row-info">
            <span class="favorites-row-title">${escapeHtml(p.title)}</span>
            <span class="favorites-row-price">${escapeHtml(p.price)}</span>
          </span>
          <button type="button" class="favorites-row-remove" data-id="${escapeHtml(p.id)}" aria-label="お気に入りから削除">✕</button>
        </label>
      `
    )
    .join("");

  body.querySelectorAll(".favorites-row-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleFavorite(btn.dataset.id);
      renderFavoritesModal();
    });
  });
}

function setupFavoritesModal() {
  const fab = document.getElementById("favorites-fab");
  const modal = document.getElementById("favorites-modal");
  const closeBtn = document.getElementById("favorites-modal-close");
  const bulkBuyBtn = document.getElementById("bulk-buy-btn");

  fab.addEventListener("click", () => {
    renderFavoritesModal();
    modal.hidden = false;
  });

  closeBtn.addEventListener("click", () => {
    modal.hidden = true;
  });

  bulkBuyBtn.addEventListener("click", () => {
    const checkedIds = [...document.querySelectorAll(".favorites-row-checkbox:checked")].map((el) => el.dataset.id);
    const targets = allProducts.filter((p) => checkedIds.includes(p.id));

    if (targets.length === 0) {
      alert("購入する作品を選択してください。");
      return;
    }

    for (const product of targets) {
      window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
    }
  });

  updateFavoritesFabCount();
}

async function main() {
  setupAgeGate();
  setupFavoritesModal();

  const response = await fetch(PRODUCTS_URL);
  allProducts = await response.json();

  renderRankingBanner(allProducts);

  const params = new URLSearchParams(window.location.search);
  const requestedGenre = params.get("genre");
  const validGenres = ["ALL", ...Object.keys(GENRE_LABELS)];

  let currentGenre = validGenres.includes(requestedGenre) ? requestedGenre : "ALL";
  let currentSort = "recommend";

  const genreSelect = document.getElementById("genre-select");
  genreSelect.value = currentGenre;

  function update() {
    const result = filterAndSort(allProducts, currentGenre, currentSort);
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
