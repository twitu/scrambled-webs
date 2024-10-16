document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  let isActive = false;

  toggleButton.addEventListener("click", () => {
    isActive = !isActive;
    toggleButton.textContent = isActive ? "Disable Scrambling" : "Enable Scrambling";
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" });
    });
  });
});
