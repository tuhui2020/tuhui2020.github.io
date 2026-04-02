const GITHUB_USER = "tuhui2020";

async function loadSharedNav() {
  const mount = document.querySelector("[data-include='nav']");
  if (!mount) {
    return;
  }

  try {
    const response = await fetch("nav.html");
    if (!response.ok) {
      throw new Error(`导航加载失败: ${response.status}`);
    }

    mount.innerHTML = await response.text();
  } catch (error) {
    mount.innerHTML = `
      <header class="site-header">
        <a class="brand" href="index.html" aria-label="返回主页">
          <div class="brand-icon-wrap"><div class="brand-icon-fallback">W</div></div>
          <div class="brand-wordmark-wrap"><div class="brand-wordmark-fallback">Wolfox</div></div>
        </a>
        <nav class="site-nav" aria-label="主导航">
          <a href="index.html" data-nav="home">主页面</a>
          <a href="projects.html" data-nav="projects">章节</a>
          <a href="resources.html" data-nav="resources">资料</a>
        </nav>
      </header>
    `;
    console.error(error);
  }
}

function setActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) {
    return;
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === currentPage);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return new Intl.DateTimeFormat("zh-CN", {
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
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderRepos(repos) {
  const grid = document.getElementById("repo-grid");
  const status = document.getElementById("repo-status");

  if (!grid || !status) {
    return;
  }

  if (!Array.isArray(repos) || repos.length === 0) {
    status.textContent = "没有读取到公开项目。";
    return;
  }

  status.textContent = `已读取到 ${repos.length} 个公开项目。`;

  const cards = repos.map((repo) => {
    const description = repo.description || "这个项目暂时没有填写说明。";
    const language = repo.language || "未标注语言";
    const readmeUrl = `readme.html?repo=${encodeURIComponent(repo.name)}`;

    return `
      <article class="repo-card">
        <div class="repo-card-top">
          <div>
            <h3>${repo.name}</h3>
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
  });

  grid.innerHTML = cards.join("");
}

async function loadRepos() {
  const grid = document.getElementById("repo-grid");
  const status = document.getElementById("repo-status");

  if (!grid || !status) {
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status}`);
    }

    const repos = await response.json();
    renderRepos(repos);
  } catch (error) {
    status.textContent = "读取 GitHub 项目失败，请稍后重试。";
    grid.innerHTML = `
      <article class="repo-card">
        <h3>加载失败</h3>
        <p>当前无法从 GitHub API 读取项目信息。部署到 GitHub Pages 后，请确认网络可以访问 GitHub API。</p>
      </article>
    `;
    console.error(error);
  }
}

async function loadReadmePage() {
  const title = document.getElementById("readme-title");
  const subtitle = document.getElementById("readme-subtitle");
  const container = document.getElementById("readme-content");

  if (!title || !subtitle || !container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");

  if (!repo) {
    title.textContent = "没有指定项目";
    subtitle.textContent = "请从章节页重新选择项目。";
    container.innerHTML = "<p>缺少项目参数，无法读取 README。</p>";
    return;
  }

  title.textContent = repo;
  subtitle.textContent = `正在读取 ${repo} 的 README 文件...`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${encodeURIComponent(repo)}/readme`);
    if (!response.ok) {
      throw new Error(`README 请求失败: ${response.status}`);
    }

    const readme = await response.json();
    const markdown = decodeBase64Utf8(readme.content || "");
    subtitle.textContent = `README 来源：${GITHUB_USER}/${repo}`;

    if (window.marked) {
      container.innerHTML = window.marked.parse(markdown, {
        mangle: false,
        headerIds: false,
      });
    } else {
      container.innerHTML = `<pre>${escapeHtml(markdown)}</pre>`;
    }
  } catch (error) {
    subtitle.textContent = "当前无法读取 README。";
    container.innerHTML = `
      <p>没有成功从 GitHub 获取 README 文件。</p>
      <p>你可以稍后重试，或者返回章节页后直接打开项目地址。</p>
    `;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedNav();
  setActiveNav();

  if (document.body.dataset.page === "projects") {
    loadRepos();
  }

  if (document.body.dataset.page === "readme") {
    loadReadmePage();
  }
});
