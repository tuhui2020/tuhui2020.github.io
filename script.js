const GITHUB_USER = "tuhui2020";

const ASSET_VERSION = "20260729-2";

function isEnglishPage() {
  return document.documentElement.lang.toLowerCase().startsWith("en");
}

async function loadSharedNav() {
  const mount = document.querySelector("[data-include='nav']");
  if (!mount) return;

  try {
    const response = await fetch(`nav.html?v=${ASSET_VERSION}`);
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
  const currentPage = document.body.dataset.page;
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
    const hrefs = ["index-en.html", "index-en.html#research", "projects-en.html"];
    navLinks.forEach((link, index) => {
      link.textContent = labels[index];
      link.href = hrefs[index];
    });
  }

  document.querySelectorAll("[data-lang-link]").forEach((link) => {
    const targetLanguage = link.dataset.langLink;
    const homeTarget = targetLanguage === "en" ? "index-en.html" : "index.html";
    const projectTarget = targetLanguage === "en" ? "projects-en.html" : "projects.html";
    const readmeTarget = targetLanguage === "en" ? "readme-en.html" : "readme.html";

    if (currentPage === "projects") link.href = `${projectTarget}${window.location.hash}`;
    else if (currentPage === "readme") link.href = `${readmeTarget}${window.location.search}${window.location.hash}`;
    else link.href = `${homeTarget}${window.location.hash}`;

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
    status.textContent = isEnglishPage() ? "No public repositories were found." : "没有读取到公开项目。";
    return;
  }

  const english = isEnglishPage();
  status.textContent = english
    ? `${repos.length} public repositories loaded.`
    : `已读取到 ${repos.length} 个公开项目。`;
  grid.innerHTML = repos.map((repo) => {
    const description = repo.description || (english ? "No description has been provided for this repository." : "这个项目暂时没有填写说明。");
    const language = repo.language || (english ? "Not specified" : "未标注语言");
    const readmePage = english ? "readme-en.html" : "readme.html";
    const readmeUrl = `${readmePage}?repo=${encodeURIComponent(repo.name)}`;
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
          <span>${english ? "Updated" : "更新于"} ${formatDate(repo.updated_at)}</span>
        </div>
        <div class="repo-links">
          <a class="button secondary small" href="${readmeUrl}">${english ? "Read README" : "读取 README"}</a>
          <a class="button primary small" href="${repo.html_url}" target="_blank" rel="noreferrer">${english ? "Repository" : "项目地址"}</a>
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
    if (isEnglishPage()) {
      status.textContent = "Unable to load GitHub repositories. Please try again later.";
      grid.innerHTML = '<article class="repo-card"><h3>Unable to load</h3><p>Repository data is currently unavailable from the GitHub API.</p></article>';
    } else {
      status.textContent = "读取 GitHub 项目失败，请稍后重试。";
      grid.innerHTML = '<article class="repo-card"><h3>加载失败</h3><p>当前无法从 GitHub API 读取项目信息。</p></article>';
    }
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
  const english = isEnglishPage();

  if (!repo) {
    title.textContent = english ? "No repository selected" : "没有指定项目";
    subtitle.textContent = english ? "Please select a repository from the projects page." : "请从项目页重新选择项目。";
    container.innerHTML = english ? "<p>The repository parameter is missing, so the README cannot be loaded.</p>" : "<p>缺少项目参数，无法读取 README。</p>";
    return;
  }

  title.textContent = repo;
  subtitle.textContent = english ? `Loading the README for ${repo}...` : `正在读取 ${repo} 的 README 文件...`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${encodeURIComponent(repo)}/readme`);
    if (!response.ok) throw new Error(`README 请求失败: ${response.status}`);
    const readme = await response.json();
    const markdown = decodeBase64Utf8(readme.content || "");
    subtitle.textContent = english ? `README source: ${GITHUB_USER}/${repo}` : `README 来源：${GITHUB_USER}/${repo}`;
    container.innerHTML = window.marked ? window.marked.parse(markdown, { mangle: false, headerIds: false }) : `<pre>${escapeHtml(markdown)}</pre>`;
  } catch (error) {
    subtitle.textContent = english ? "The README is currently unavailable." : "当前无法读取 README。";
    container.innerHTML = english
      ? "<p>The README could not be retrieved from GitHub.</p><p>Please try again later, or return to the projects page and open the repository directly.</p>"
      : "<p>没有成功从 GitHub 获取 README 文件。</p><p>你可以稍后重试，或者返回项目页后直接打开项目地址。</p>";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedNav();
  configureSharedNav();
  setActiveNav();

  if (document.body.dataset.page === "projects") loadRepos();
  if (document.body.dataset.page === "readme") loadReadmePage();
});
