document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const saveButton = document.getElementById("saveButton");
  const shareLink = document.getElementById("shareLink");
  let isActive = false;

  toggleButton.addEventListener("click", () => {
    isActive = !isActive;
    toggleButton.textContent = isActive ? "Disable Scrambling" : "Enable Scrambling";
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" });
    });
  });

  saveButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "save" }, (response) => {
        const shareUrl = `https://scrambledwebs.fun/?state=${response}`;
        shareLink.href = shareUrl;
        shareLink.textContent = "Share Scrambled Web";
        shareLink.style.display = "block";
      });
    });
  });
});
