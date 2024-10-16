document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const saveButton = document.getElementById("saveButton");
  const shareLink = document.getElementById("shareLink");

  // Check the current state when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.local.get(['scrambledTabs'], (result) => {
      const scrambledTabs = result.scrambledTabs || {};
      const isScrambled = scrambledTabs[tabs[0].id] || false;
      updateButtonText(isScrambled);
    });
  });

  toggleButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.storage.local.get(['scrambledTabs'], (result) => {
        const scrambledTabs = result.scrambledTabs || {};
        const isScrambled = !scrambledTabs[tabs[0].id];
        scrambledTabs[tabs[0].id] = isScrambled;
        chrome.storage.local.set({scrambledTabs}, () => {
          updateButtonText(isScrambled);
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggle", isScrambled });
        });
      });
    });
  });

  saveButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "save" }, (response) => {
        const currentUrl = new URL(tabs[0].url);
        currentUrl.searchParams.set('scrambled', response);
        const shareUrl = currentUrl.toString();
        shareLink.href = shareUrl;
        shareLink.textContent = "Share Scrambled Web";
        shareLink.style.display = "block";
      });
    });
  });

  function updateButtonText(isScrambled) {
    toggleButton.textContent = isScrambled ? "Reset" : "Scramble!";
  }
});
