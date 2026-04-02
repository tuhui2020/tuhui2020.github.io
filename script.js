const GITHUB_USER = "tuhui2020";
const EXTERNAL_PROJECTS = [
  {
    name: "示例外部项目",
    owner: "octocat",
    source: "GitHub / octocat",
    description: "这里用于展示其他人的项目。你可以把它改成你想引用的仓库。",
    html_url: "https://github.com/octocat/Hello-World",
  },
];

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
    applyWordmarkThreshold();
  } catch (error) {
    mount.innerHTML = `
      <header class="site-header">
        <a class="site-logo-link" href="index.html" aria-label="返回主页">
          <div class="site-logo-panel"><div class="site-logo-fallback">W</div></div>
        </a>
        <div class="nav-center">
          <a class="nav-wordmark-wrap" href="index.html" aria-label="返回主页">
            <div class="brand-wordmark-fallback">Wolfox</div>
          </a>
          <nav class="site-nav" aria-label="主导航">
            <a href="index.html" data-nav="home">主页面</a>
            <a href="projects.html" data-nav="projects">章节</a>
            <a href="resources.html" data-nav="resources">资料</a>
          </nav>
        </div>
        <div class="site-author">作者：涂Per</div>
      </header>
    `;
    console.error(error);
  }
}

function applyWordmarkThreshold() {
  const image = document.getElementById("nav-wordmark");
  if (!image) {
    return;
  }

  const threshold = Number(image.dataset.threshold || 185);

  const process = () => {
    const canvas = document.createElement("canvas");
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
      if (gray >= threshold) {
        data[index + 3] = 0;
      } else {
        data[index] = 34;
        data[index + 1] = 28;
        data[index + 2] = 24;
        data[index + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL("image/png");
  };

  if (image.complete) {
    process();
  } else {
    image.addEventListener("load", process, { once: true });
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

  grid.innerHTML = repos.map((repo) => {
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
  }).join("");
}

function renderExternalProjects(projects) {
  const grid = document.getElementById("other-repo-grid");
  const status = document.getElementById("other-repo-status");

  if (!grid || !status) {
    return;
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    status.textContent = "还没有添加其他人的项目。";
    grid.innerHTML = "";
    return;
  }

  status.textContent = `已整理 ${projects.length} 个其他人的项目。`;

  grid.innerHTML = projects.map((project) => `
    <article class="repo-card repo-card-external">
      <div class="repo-card-top">
        <div>
          <h3>${project.name}</h3>
          <p>${project.description || "这个外部项目暂时没有填写说明。"}</p>
        </div>
        <span class="repo-badge source">来源</span>
      </div>
      <div class="repo-meta">
        <span>作者 ${project.owner || "未知作者"}</span>
        <span>来源 ${project.source || "未标注"}</span>
      </div>
      <div class="repo-links">
        <a class="button primary small" href="${project.html_url}" target="_blank" rel="noreferrer">项目地址</a>
      </div>
    </article>
  `).join("");
}

function openMaterialInViewer(node) {
  const viewer = document.getElementById("materials-viewer");
  const title = document.getElementById("viewer-title");
  const status = document.getElementById("viewer-status");

  if (!viewer || !title || !status) {
    return;
  }

  title.textContent = node.name;
  status.textContent = node.path || node.url;
  viewer.src = node.url;
}

function bindViewerFullscreen() {
  const button = document.getElementById("viewer-fullscreen");
  const viewer = document.getElementById("materials-viewer");

  if (!button || !viewer) {
    return;
  }

  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === viewer) {
        await document.exitFullscreen();
        return;
      }

      await viewer.requestFullscreen();
    } catch (error) {
      console.error(error);
    }
  });
}

function renderMaterialsNode(node) {
  if (node.type === "file") {
    const safeNode = encodeURIComponent(JSON.stringify({
      name: node.name,
      path: node.path,
      url: node.url,
    }));

    return `
      <li class="materials-item file">
        <button class="materials-link materials-file-button" type="button" data-material="${safeNode}">${node.name}</button>
      </li>
    `;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  const childMarkup = children.map(renderMaterialsNode).join("");
  return `
    <li class="materials-item folder">
      <details open>
        <summary>${node.name}</summary>
        ${childMarkup ? `<ul class="materials-list">${childMarkup}</ul>` : ""}
      </details>
    </li>
  `;
}

function bindMaterialsViewer() {
  document.querySelectorAll(".materials-file-button").forEach((button) => {
    button.addEventListener("click", () => {
      const raw = button.dataset.material;
      if (!raw) {
        return;
      }
      const node = JSON.parse(decodeURIComponent(raw));
      openMaterialInViewer(node);
    });
  });
}

async function loadMaterials() {
  const status = document.getElementById("materials-status");
  const root = document.getElementById("materials-root");

  if (!status || !root) {
    return;
  }

  try {
    const response = await fetch("materials-manifest.json");
    if (!response.ok) {
      throw new Error(`资料目录请求失败: ${response.status}`);
    }

    const tree = await response.json();
    const nodes = Array.isArray(tree.children) ? tree.children : [];
    status.textContent = "";
    root.innerHTML = `<ul class="materials-list root">${nodes.map(renderMaterialsNode).join("")}</ul>`;
    bindMaterialsViewer();
    bindViewerFullscreen();
  } catch (error) {
    status.textContent = "资料目录读取失败。";
    root.innerHTML = "";
    console.error(error);
  }
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
    renderExternalProjects(EXTERNAL_PROJECTS);
  }

  if (document.body.dataset.page === "readme") {
    loadReadmePage();
  }

  if (document.body.dataset.page === "resources") {
    loadMaterials();
  }
});
