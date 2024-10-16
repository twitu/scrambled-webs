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
        const currentUrl = new URL(tabs[0].url);
        currentUrl.searchParams.set('scrambled', response);
        const shareUrl = currentUrl.toString();
        shareLink.href = shareUrl;
        shareLink.textContent = "Share Scrambled Web";
        shareLink.style.display = "block";
      });
    });
  });
});
