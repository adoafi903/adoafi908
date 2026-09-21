function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

const DEFAULT_AD_SLOT_HTML = "<!-- ここにアドアフィ(DMM/DLsite等)またはGoogleアフィリエイト(AdSense等)のコードを貼る -->";

// 広告タグに<script>が含まれる場合、innerHTMLだけでは実行されないため
// スクリプト要素を作り直して差し込むことで実行されるようにする
function insertExecutableHtml(container, html) {
  container.innerHTML = html;
  container.querySelectorAll("script").forEach((oldScript) => {
    const newScript = document.createElement("script");
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

async function loadColumns() {
  const res = await fetch("columns.json");
  return res.json();
}

function renderColumnList(columns) {
  const list = document.getElementById("column-list");
  if (!list) return;

  list.innerHTML = columns
    .map(
      (c) => `
        <a class="column-card" href="column-article.html?id=${encodeURIComponent(c.id)}">
          <span class="column-card-date">${escapeHtml(c.publishedAt)}</span>
          <h2 class="column-card-title">${escapeHtml(c.title)}</h2>
          <p class="column-card-summary">${escapeHtml(c.summary)}</p>
        </a>`
    )
    .join("");
}

async function renderColumnArticle(columns) {
  const container = document.getElementById("column-article");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const article = columns.find((c) => String(c.id) === id);

  if (!article) {
    container.innerHTML = `<p class="empty-state">記事が見つかりませんでした。</p>`;
    return;
  }

  document.title = `${article.title} | コラム`;

  const bodyHtml = article.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");

  let relatedHtml = "";
  if (article.relatedProductIds && article.relatedProductIds.length > 0) {
    const productsRes = await fetch("products.json");
    const products = await productsRes.json();
    const related = products.filter((p) => article.relatedProductIds.includes(p.id));

    if (related.length > 0) {
      relatedHtml = `
        <div class="column-related">
          <p class="column-related-label">この記事で紹介した作品</p>
          <div class="column-related-list">
            ${related
              .map(
                (p) => `
                  <a class="column-related-item" href="${escapeHtml(p.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.title)}">
                    <span>${escapeHtml(p.title)}</span>
                  </a>`
              )
              .join("")}
          </div>
        </div>`;
    }
  }

  container.innerHTML = `
    <p class="column-article-date">${escapeHtml(article.publishedAt)}</p>
    <h1 class="column-article-title">${escapeHtml(article.title)}</h1>
    <div class="column-article-body">${bodyHtml}</div>
    ${relatedHtml}
    <div class="column-ad-slot" id="column-ad-slot"></div>
  `;

  insertExecutableHtml(document.getElementById("column-ad-slot"), article.adSlotHtml || DEFAULT_AD_SLOT_HTML);
}

async function main() {
  const columns = await loadColumns();
  renderColumnList(columns);
  await renderColumnArticle(columns);
}

main();
