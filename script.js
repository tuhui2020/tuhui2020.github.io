const GITHUB_USER = "tuhui2020";

function isEnglishPage() {
  return document.documentElement.lang.toLowerCase().startsWith("en");
}

async function loadSharedNav() {
  const mount = document.querySelector("[data-include='nav']");
  if (!mount) return;

  try {
    const response = await fetch("nav.html");
    if (!response.ok) throw new Error(`导航加载失败: ${response.status}`);
    mount.innerHTML = await response.text();
    applyWordmarkThreshold();
  } catch (error) {
    mount.innerHTML = `
      <header class="site-header">
        <a class="site-identity" href="index.html" aria-label="返回涂汇的个人主页">
          <img class="site-logo-image" src="images/wolf_logo.jpg" alt="">
          <span class="site-name">TU HUI</span>
        </a>
        <nav class="site-nav" aria-label="主导航">
          <a href="index.html" data-nav="home">首页</a>
          <a href="index.html#research">研究</a>
          <a href="projects.html" data-nav="projects">项目</a>
        </nav>
        <div class="header-actions">
          <div class="language-switch" aria-label="语言切换">
            <a href="index.html" data-lang-link="zh">中文</a>
            <a href="index-en.html" data-lang-link="en">EN</a>
          </div>
          <a class="header-github" href="https://github.com/tuhui2020" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>
    `;
    console.error(error);
  }
}

function configureSharedNav() {
  const english = isEnglishPage();
  const identity = document.querySelector(".site-identity");
  const nav = document.querySelector(".site-nav");
  const github = document.querySelector(".header-github");
  const navLinks = document.querySelectorAll(".site-nav a");
  const languageSwitch = document.querySelector(".language-switch");

  if (identity) {
    identity.href = english ? "index-en.html" : "index.html";
    identity.setAttribute("aria-label", english ? "Return to TU Hui's homepage" : "返回涂汇的个人主页");
  }

  if (nav) nav.setAttribute("aria-label", english ? "Main navigation" : "主导航");
  if (github) github.setAttribute("aria-label", english ? "Open GitHub profile" : "打开 GitHub 主页");
  if (languageSwitch) languageSwitch.setAttribute("aria-label", english ? "Language" : "语言切换");

  if (english && navLinks.length >= 3) {
    const labels = ["Home", "Research", "Projects"];
    const hrefs = ["index-en.html", "index-en.html#research", "projects.html"];
    navLinks.forEach((link, index) => {
      link.textContent = labels[index];
      link.href = hrefs[index];
    });
  }

  document.querySelectorAll("[data-lang-link]").forEach((link) => {
    const active = link.dataset.langLink === (english ? "en" : "zh");
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function applyWordmarkThreshold() {
  const image = document.getElementById("nav-wordmark");
  if (!image) return;

  const threshold = Number(image.dataset.threshold || 185);
  const process = () => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (gray >= threshold) {
        data[i + 3] = 0;
      } else {
        data[i] = 34;
        data[i + 1] = 28;
        data[i + 2] = 24;
        data[i + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL("image/png");
  };

  if (image.complete) process();
  else image.addEventListener("load", process, { once: true });
}

function setActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === currentPage);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return isEnglishPage() ? "Unknown date" : "未知时间";
  return new Intl.DateTimeFormat(isEnglishPage() ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function decodeBase64Utf8(content) {
  const binary = atob(content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderRepos(repos) {
  const grid = document.getElementById("repo-grid");
  const status = document.getElementById("repo-status");
  if (!grid || !status) return;

  if (!Array.isArray(repos) || repos.length === 0) {
    status.textContent = "没有读取到公开项目。";
    return;
  }

  status.textContent = `已读取到 ${repos.length} 个公开项目。`;
  grid.innerHTML = repos.map((repo) => {
    const description = repo.description || "这个项目暂时没有填写说明。";
    const language = repo.language || "未标注语言";
    const readmeUrl = `readme.html?repo=${encodeURIComponent(repo.name)}`;
    return `
      <article class="repo-card">
        <div class="repo-card-top">
          <div class="repo-text">
            <h3 class="repo-name">${repo.name}</h3>
            <p>${description}</p>
          </div>
          <span class="repo-badge">${language}</span>
        </div>
        <div class="repo-meta">
          <span>Stars ${repo.stargazers_count}</span>
          <span>Forks ${repo.forks_count}</span>
          <span>更新于 ${formatDate(repo.updated_at)}</span>
        </div>
        <div class="repo-links">
          <a class="button secondary small" href="${readmeUrl}">读取 README</a>
          <a class="button primary small" href="${repo.html_url}" target="_blank" rel="noreferrer">项目地址</a>
        </div>
      </article>
    `;
  }).join("");
}

async function loadRepos() {
  const grid = document.getElementById("repo-grid");
  const status = document.getElementById("repo-status");
  if (!grid || !status) return;

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    if (!response.ok) throw new Error(`GitHub API 请求失败: ${response.status}`);
    const repos = await response.json();
    renderRepos(repos);
  } catch (error) {
    status.textContent = "读取 GitHub 项目失败，请稍后重试。";
    grid.innerHTML = '<article class="repo-card"><h3>加载失败</h3><p>当前无法从 GitHub API 读取项目信息。</p></article>';
    console.error(error);
  }
}

function renderHomeRepos(repos) {
  const list = document.getElementById("home-repo-list");
  const status = document.getElementById("home-repo-status");
  if (!list || !status) return;

  const recent = Array.isArray(repos) ? repos.slice(0, 3) : [];
  if (recent.length === 0) {
    status.textContent = isEnglishPage() ? "No public projects were found." : "暂时没有读取到公开项目。";
    return;
  }

  status.textContent = "";
  recent.forEach((repo, index) => {
    const article = document.createElement("article");
    article.className = "home-repo-item";

    const number = document.createElement("span");
    number.className = "home-repo-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = repo.name;
    const description = document.createElement("p");
    description.textContent = repo.description || (isEnglishPage() ? "No description is available for this project." : "这个项目暂时没有填写说明。");
    copy.append(title, description);

    const meta = document.createElement("div");
    meta.className = "home-repo-meta";
    const language = document.createElement("span");
    language.textContent = repo.language || (isEnglishPage() ? "Language not specified" : "未标注语言");
    const updated = document.createElement("span");
    updated.textContent = formatDate(repo.updated_at);
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = isEnglishPage() ? "View ↗" : "查看 ↗";
    meta.append(language, updated, link);

    article.append(number, copy, meta);
    list.append(article);
  });
}

async function loadHomeRepos() {
  const list = document.getElementById("home-repo-list");
  const status = document.getElementById("home-repo-status");
  if (!list || !status) return;

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=3&sort=updated`);
    if (!response.ok) throw new Error(`GitHub API 请求失败: ${response.status}`);
    renderHomeRepos(await response.json());
  } catch (error) {
    status.textContent = isEnglishPage() ? "Projects are temporarily unavailable. Please view them on GitHub." : "项目暂时无法读取，可前往 GitHub 查看。";
    console.error(error);
  }
}

async function loadReadmePage() {
  const title = document.getElementById("readme-title");
  const subtitle = document.getElementById("readme-subtitle");
  const container = document.getElementById("readme-content");
  if (!title || !subtitle || !container) return;

  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");

  if (!repo) {
    title.textContent = "没有指定项目";
    subtitle.textContent = "请从项目页重新选择项目。";
    container.innerHTML = "<p>缺少项目参数，无法读取 README。</p>";
    return;
  }

  title.textContent = repo;
  subtitle.textContent = `正在读取 ${repo} 的 README 文件...`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${encodeURIComponent(repo)}/readme`);
    if (!response.ok) throw new Error(`README 请求失败: ${response.status}`);
    const readme = await response.json();
    const markdown = decodeBase64Utf8(readme.content || "");
    subtitle.textContent = `README 来源：${GITHUB_USER}/${repo}`;
    container.innerHTML = window.marked ? window.marked.parse(markdown, { mangle: false, headerIds: false }) : `<pre>${escapeHtml(markdown)}</pre>`;
  } catch (error) {
    subtitle.textContent = "当前无法读取 README。";
    container.innerHTML = "<p>没有成功从 GitHub 获取 README 文件。</p><p>你可以稍后重试，或者返回项目页后直接打开项目地址。</p>";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedNav();
  configureSharedNav();
  setActiveNav();

  if (document.body.dataset.page === "home") loadHomeRepos();
  if (document.body.dataset.page === "projects") loadRepos();
  if (document.body.dataset.page === "readme") loadReadmePage();
});
