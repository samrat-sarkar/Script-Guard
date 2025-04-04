let currentFiles = [];
let disabledFiles = [];
let currentFilter = 'all';

function getFileType(url) {
  if (url.endsWith('.js')) return 'js';
  if (url.endsWith('.css')) return 'css';
  return 'other';
}

function getFileName(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop();
  } catch (e) {
    return url.split('/').pop();
  }
}

function displayFiles(files) {
  const fileList = document.getElementById('fileList');
  
  if (files.length === 0) {
    fileList.innerHTML = `
      <div class="empty-state">
        <p>No files found on this page</p>
      </div>
    `;
    return;
  }

  fileList.innerHTML = '';

  files.forEach(file => {
    const fileType = getFileType(file);
    if (currentFilter === 'all' || currentFilter === fileType) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      
      const fileName = document.createElement('div');
      fileName.className = 'file-name';
      fileName.textContent = getFileName(file);
      fileName.title = file; 
      
      const fileTypeSpan = document.createElement('span');
      fileTypeSpan.className = 'file-type';
      fileTypeSpan.textContent = fileType.toUpperCase();
      
      const button = document.createElement('button');
      button.className = `toggle-btn ${disabledFiles.includes(file) ? 'disabled' : 'enabled'}`;
      button.textContent = disabledFiles.includes(file) ? 'Enable It' : 'Disable It';
      button.onclick = () => toggleFileStatus(file, button);
      
      fileInfo.appendChild(fileName);
      fileInfo.appendChild(fileTypeSpan);
      fileItem.appendChild(fileInfo);
      fileItem.appendChild(button);
      fileList.appendChild(fileItem);
    }
  });
}

function toggleFileStatus(file, button) {
  const isDisabled = disabledFiles.includes(file);
  
  if (isDisabled) {
    disabledFiles = disabledFiles.filter(f => f !== file);
    button.textContent = 'Disable It';
    button.className = 'toggle-btn enabled';
  } else {
    disabledFiles.push(file);
    button.textContent = 'Enable It';
    button.className = 'toggle-btn disabled';
  }
  
  chrome.storage.local.set({ disabledFiles: disabledFiles }, function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.type;
      displayFiles(currentFiles);
    });
  });

  chrome.storage.local.get(['disabledFiles'], function(result) {
    disabledFiles = result.disabledFiles || [];
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: getFilesFromPage
        },
        (result) => {
          currentFiles = result[0].result;
          displayFiles(currentFiles);
        }
      );
    });
  });
});

function getFilesFromPage() {
  const files = [];
  const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
  
  links.forEach(link => {
    if (link.href) {
      files.push(link.href);
    } else if (link.src) {
      files.push(link.src);
    }
  });
  
  return files;
}

document.getElementById('enableAll').addEventListener('click', () => {
  const visibleFiles = Array.from(document.querySelectorAll('.file-item:not([style*="display: none"])'));
  visibleFiles.forEach(fileItem => {
    const toggleBtn = fileItem.querySelector('.toggle-btn');
    if (toggleBtn.classList.contains('disabled')) {
      toggleBtn.click();
    }
  });
});

document.getElementById('disableAll').addEventListener('click', () => {
  const visibleFiles = Array.from(document.querySelectorAll('.file-item:not([style*="display: none"])'));
  visibleFiles.forEach(fileItem => {
    const toggleBtn = fileItem.querySelector('.toggle-btn');
    if (toggleBtn.classList.contains('enabled')) {
      toggleBtn.click();
    }
  });
});
