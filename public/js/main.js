// Copyright (c) 2024 Algorealm, Inc.

function qs(tag) {
  return document.querySelector(tag);
}

function qsa(tag) {
  return document.querySelectorAll(tag);
}

function ce(tag) {
  return document.createElement(tag);
}

function clearField(attr) {
  qs(attr).value = "";
}

function appear(attr) {
  qs(attr).classList.remove("hidden");
}

function hide(attr) {
  if (!qs(attr).classList.contains("hidden")) qs(attr).classList.add("hidden");
}
function updateText(html, text) {
  html.innerText = text;
}
let currentPath = '/Users/explorer/other';
let allFiles = [];
let filteredFiles = [];
let currentFilter = 'all';
let currentView = 'grid';
const rootDir = "/Users/explorer";

function initializePortal() {
  updateLastUpdated();
  loadDirectory();
  setupEventListeners();
  setInterval(updateLastUpdated, 60000); // Update every minute
}

function updateLastUpdated() {
  const now = new Date();
  document.getElementById('lastUpdated').textContent =
    now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
}

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', handleSearch);
}

function loadDirectory(directory = '/Users/explorer/other') {
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('filesContainer').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';

  const path = '/get-data';

  // Prepare to send it to the backend
  fetch(path, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: directory
    }),
  }).then(async (res) => {
    await res.json().then((res) => {
      currentPath = directory;
      allFiles = res.data.filter(file => {
        if (path === '') return true;
        return file.path.startsWith('/');
      });

      console.log(res.data)
      console.log(allFiles);

      updateBreadcrumb();
      filterFiles(currentFilter);

      document.getElementById('loadingState').style.display = 'none';
      if (filteredFiles.length > 0) {
        document.getElementById('filesContainer').style.display = 'block';
      } else {
        document.getElementById('emptyState').style.display = 'block';
      }
    })
  });
}

function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  let html = `<span class="breadcrumb-item" onclick="navigateToPath('${rootDir}')">🏠 Root Directory</span>`;
  if (currentPath) {
    const pathParts = currentPath.split('/');
    let buildPath = '/Users/';

    pathParts.forEach((part, index) => {
      if (part) {
        buildPath += (index > 0 ? '/' : '') + part;
        html += '<span class="breadcrumb-separator">></span>';
        html += `<span class="breadcrumb-item" onclick="navigateToPath('${buildPath}')">${part}</span>`;
      }
    });
  }

  breadcrumb.innerHTML = html;
}

function filterFiles(filter) {
  currentFilter = filter;

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event?.target?.classList.add('active');

  switch (filter) {
    case 'audio':
      filteredFiles = allFiles.filter(file => file.type === 'audio');
      break;
    case 'folders':
      filteredFiles = allFiles.filter(file => file.type === 'folder');
      break;
    default:
      filteredFiles = [...allFiles];
  }

  applySearch();
}

function handleSearch() {
  applySearch();
}

function applySearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  let displayFiles = filteredFiles;

  if (searchTerm) {
    displayFiles = filteredFiles.filter(file =>
      file.name.toLowerCase().includes(searchTerm)
    );
  }

  updateStatsInfo(displayFiles);
  renderFiles(displayFiles);
}

function updateStatsInfo(files) {
  const audioCount = files.filter(f => f.type === 'audio').length;
  const folderCount = files.filter(f => f.type === 'folder').length;
  const totalSize = files
    .filter(f => f.size)
    .reduce((sum, f) => sum + parseFloat(f.size.replace(/[^\d.]/g, '')), 0);

  document.getElementById('statsInfo').textContent =
    `${files.length} items • ${audioCount} audio files • ${folderCount} folders • ${totalSize.toFixed(1)} MB total`;
}

function renderFiles(files) {
  renderGridView(files);
  renderListView(files);
}

function renderGridView(files) {
  const container = document.getElementById('gridView');
  container.innerHTML = '';

  files.forEach(file => {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.onclick = () => handleFileClick(file);

    const icon = file.type === 'folder' ? '📁' :
      file.name.endsWith('.mp3') ? '🎵' :
        file.name.endsWith('.wav') ? '🎼' :
          file.name.endsWith('.m4a') ? '🎧' :
            file.name.endsWith('.aac') ? '🔊' : '🎵';

    fileElement.innerHTML = `
            <div class="file-icon ${file.type}">
                ${icon}
            </div>
            <div class="file-name">${file.name}</div>
            <div class="file-info">
                ${file.size ? `<div class="file-size">${file.size}</div>` : '<div class="file-size">Folder</div>'}
                <div class="file-date">Modified: ${file.modified}</div>
            </div>
        `;

    container.appendChild(fileElement);
  });
}

function renderListView(files) {
  const container = document.getElementById('listView');
  container.innerHTML = '';

  files.forEach(file => {
    const fileElement = document.createElement('div');
    fileElement.className = 'list-item';
    fileElement.onclick = () => handleFileClick(file);

    const icon = file.type === 'folder' ? '📁' :
      file.name.endsWith('.mp3') ? '🎵' :
        file.name.endsWith('.wav') ? '🎼' :
          file.name.endsWith('.m4a') ? '🎧' :
            file.name.endsWith('.aac') ? '🔊' : '🎵';

    fileElement.innerHTML = `
            <div class="list-icon ${file.type}">
                ${icon}
            </div>
            <div class="list-details">
                <div class="list-name">${file.name}</div>
                <div class="list-meta">
                    ${file.size ? file.size + ' • ' : 'Folder • '}Modified: ${file.modified}
                </div>
            </div>
        `;

    container.appendChild(fileElement);
  });
}

function handleFileClick(file) {
  if (file.type === 'folder') {
    navigateToPath(file.path);
  } else {
    // Automatically download the audio file
    const link = document.createElement('a');
    link.href = file.path; // Make sure this is the correct URL to the file
    link.download = file.name; // This sets the filename for download
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
  }
}


function navigateToPath(path) {
  // Strip path
  path = path.replace("/Users//", "/");
  loadDirectory(path);
}

function toggleView(viewType) {
  currentView = viewType;

  // Update view buttons
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Toggle views
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');

  if (viewType === 'grid') {
    gridView.classList.add('active');
    listView.classList.remove('active');
  } else {
    gridView.classList.remove('active');
    listView.classList.add('active');
  }
}

function refreshDirectory() {
  loadDirectory(currentPath);
}

// Initialize portal when page loads
window.addEventListener('load', initializePortal);