chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggle" });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      const url = new URL(tab.url);
      const scrambledState = url.searchParams.get('scrambled');
      
      if (scrambledState) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: injectScrambledState,
          args: [scrambledState]
        });
      }
    }
  });
});

function injectScrambledState(scrambledState) {
  if (window.hasScrambledWebsLoaded) {
    window.postMessage({ type: "SCRAMBLED_WEBS_LOAD_STATE", state: scrambledState }, "*");
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      window.postMessage({ type: "SCRAMBLED_WEBS_LOAD_STATE", state: scrambledState }, "*");
    });
  }
}
