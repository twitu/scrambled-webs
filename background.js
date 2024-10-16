chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggle" });
});

chrome.runtime.onInstalled.addListener(() => {
  const SCRAMBLED_WEBS_URL = 'https://scrambledwebs.fun/';

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.startsWith(SCRAMBLED_WEBS_URL)) {
      const url = new URL(tab.url);
      const encodedState = url.searchParams.get('state');
      
      if (encodedState) {
        const decodedState = JSON.parse(atob(encodedState));
        
        chrome.tabs.update(tabId, { url: decodedState.url }, () => {
          chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, updatedTab) {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tabId, { action: "load", state: encodedState });
            }
          });
        });
      }
    }
  });
});
