let disabledFiles = [];
let currentRuleIds = new Set();

chrome.storage.local.get(['disabledFiles'], function(result) {
  disabledFiles = result.disabledFiles || [];
  updateBlockingRules();
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.disabledFiles) {
    disabledFiles = changes.disabledFiles.newValue || [];
    updateBlockingRules();
  }
});

function generateUniqueRuleId() {
  let newId;
  do {
    newId = Math.floor(Math.random() * 1000000) + 1; 
  } while (currentRuleIds.has(newId));
  currentRuleIds.add(newId);
  return newId;
}

async function updateBlockingRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    
    currentRuleIds.clear();
    
    existingRules.forEach(rule => currentRuleIds.add(rule.id));
    
    if (existingRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from(currentRuleIds)
      });
    }
    
    currentRuleIds.clear();

    if (disabledFiles.length > 0) {
      const rules = disabledFiles.map(file => {
        const ruleId = generateUniqueRuleId();
        return {
          id: ruleId,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: file,
            resourceTypes: ["script", "stylesheet"]
          }
        };
      });

      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDisabledFiles") {
    sendResponse({ disabledFiles: disabledFiles });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  updateBlockingRules();
});

function blockFiles(disabledFiles) {
  const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
  links.forEach(link => {
    const fileURL = link.href || link.src;
    if (disabledFiles.some(disabledFile => fileURL.includes(disabledFile))) {
      link.remove(); 
    }
  });
}
