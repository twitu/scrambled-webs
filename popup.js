document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const saveButton = document.getElementById("saveButton");

  // Check the current state when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getState" }, (response) => {
      updateButtonText(response.isScrambled);
    });
  });

  toggleButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" }, (response) => {
        updateButtonText(response.isScrambled);
      });
    });
  });

  saveButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "save" }, (response) => {
        const currentUrl = new URL(tabs[0].url);
        currentUrl.searchParams.set('scrambled', response);
        const shareUrl = currentUrl.toString();
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          // Show hint
          saveButton.textContent = "Link Copied!";
          
          // Reset text after 2 seconds
          setTimeout(() => {
            saveButton.textContent = "Save Scrambled";
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy: ', err);
          saveButton.textContent = "Failed to copy";
        });
      });
    });
  });

  function updateButtonText(isScrambled) {
    toggleButton.textContent = isScrambled ? "Reset" : "Scramble!";
  }
});
