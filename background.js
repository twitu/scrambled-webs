chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggle" });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      const url = new URL(tab.url);
      const scrambledState = url.searchParams.get('scrambled');
      
      if (scrambledState) {
        chrome.tabs.sendMessage(tabId, { action: "load", state: scrambledState });
      }
    }
  });
});
