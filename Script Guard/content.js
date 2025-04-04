function getFileType(url) {
  if (url.endsWith('.js')) return 'js';
  if (url.endsWith('.css')) return 'css';
  return 'other';
}

function getFilesFromPage() {
  const files = [];
  
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    if (script.src) {
      files.push({
        url: script.src,
        type: 'js'
      });
    }
  });
  
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  styles.forEach(style => {
    if (style.href) {
      files.push({
        url: style.href,
        type: 'css'
      });
    }
  });
  
  return files;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "fetchFiles") {
    sendResponse(getFilesFromPage());
  }
});
