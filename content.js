let isActive = false;
let draggedElement = null;
let originalStyles = new Map();
let originalSizes = new Map();
let scrambledElements = new Map();
let dragOffset = { x: 0, y: 0 };
let globalZIndex = 9999;

// Add this near the top of the file
window.hasScrambledWebsLoaded = true;

// Mutation Observer to watch for DOM changes
const observer = new MutationObserver((mutations) => {
  if (isActive) {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scrambleNewElement(node);
          }
        });
      }
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Check if the page should be scrambled when it loads
const urlParams = new URLSearchParams(window.location.search);
const scrambledState = urlParams.get('scrambled');
if (scrambledState) {
  // Delay the initial scrambling to allow more elements to load
  setTimeout(() => {
    isActive = true;
    loadState(scrambledState);
    enableDragging();
  }, 1000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isActive = !isActive;
    if (isActive) {
      enableDragging();
    } else {
      disableDragging();
    }
    sendResponse({ isScrambled: isActive });
  } else if (request.action === "save") {
    sendResponse(saveState());
  } else if (request.action === "getState") {
    sendResponse({ isScrambled: isActive });
  }
  return true; // Indicates that the response is sent asynchronously
});

// Add this event listener
window.addEventListener("message", (event) => {
  if (event.data.type === "SCRAMBLED_WEBS_LOAD_STATE") {
    isActive = true;
    setTimeout(() => {
      loadState(event.data.state);
      enableDragging();
    }, 1000);
  }
});

function enableDragging() {
  document.body.classList.add("scrambled-webs-active");
  document.addEventListener("mousedown", startDragging);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDragging);
}

function disableDragging() {
  document.body.classList.remove("scrambled-webs-active");
  document.removeEventListener("mousedown", startDragging);
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDragging);
  restoreElements();
}

function startDragging(e) {
  if (!isActive) return;
  draggedElement = e.target;
  if (draggedElement === document.body) return;
  
  e.preventDefault();
  saveOriginalStyles(draggedElement);
  saveOriginalSize(draggedElement);
  
  const rect = draggedElement.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  
  draggedElement.style.position = "fixed";
  draggedElement.style.width = rect.width + "px";
  draggedElement.style.height = rect.height + "px";
  draggedElement.style.zIndex = (++globalZIndex).toString();
  
  // Add the dragging class
  draggedElement.classList.add('scrambled-webs-dragging');
}

function drag(e) {
  if (!draggedElement) return;
  e.preventDefault();
  const left = e.clientX - dragOffset.x + "px";
  const top = e.clientY - dragOffset.y + "px";
  draggedElement.style.left = left;
  draggedElement.style.top = top;
  scrambledElements.set(draggedElement, { left, top, zIndex: draggedElement.style.zIndex });
}

function stopDragging(e) {
  if (draggedElement) {
    // Remove the dragging class
    draggedElement.classList.remove('scrambled-webs-dragging');
  }
  draggedElement = null;
}

function saveOriginalStyles(element) {
  originalStyles.set(element, {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    zIndex: element.style.zIndex,
    width: element.style.width,
    height: element.style.height
  });
}

function saveOriginalSize(element) {
  const rect = element.getBoundingClientRect();
  originalSizes.set(element, {
    width: rect.width,
    height: rect.height
  });
}

function restoreElements() {
  originalStyles.forEach((styles, element) => {
    Object.assign(element.style, styles);
  });
  originalStyles.clear();
  originalSizes.clear();
  scrambledElements.clear();
}

function saveState() {
  const state = {
    elements: []
  };

  document.querySelectorAll('*').forEach((element) => {
    if (isElementScrambled(element)) {
      state.elements.push({
        selector: generateComplexSelector(element),
        tagName: element.tagName,
        left: element.style.left,
        top: element.style.top,
        zIndex: element.style.zIndex,
        width: element.style.width,
        height: element.style.height
      });
    }
  });

  return btoa(JSON.stringify(state));
}

function loadState(encodedState) {
  try {
    const state = JSON.parse(atob(encodedState));

    state.elements.forEach(elem => {
      const element = findElementBySelector(elem.selector, elem.tagName);
      if (element) {
        scrambleElement(element, elem);
      } else {
        console.warn(`Element not found: ${elem.selector}`);
      }
    });

    globalZIndex = Math.max(...state.elements.map(elem => parseInt(elem.zIndex)), 9999);
  } catch (error) {
    console.error("Error loading scrambled state:", error);
  }
}

function generateComplexSelector(element) {
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    }
    if (element.className) {
      selector += `.${element.className.trim().replace(/\s+/g, '.')}`;
    }
    let sibling = element;
    let nth = 1;
    while (sibling = sibling.previousElementSibling) {
      if (sibling.tagName === element.tagName) nth++;
    }
    if (nth !== 1) selector += `:nth-of-type(${nth})`;
    path.unshift(selector);
    element = element.parentNode;
  }
  return path.join(' > ');
}

function findElementBySelector(selector, tagName) {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}. Falling back to alternative method.`);
    return findElementByTraversal(document.body, selector, tagName);
  }
}

function findElementByTraversal(root, selector, tagName) {
  const elements = root.getElementsByTagName(tagName);
  for (let element of elements) {
    if (generateComplexSelector(element) === selector) {
      return element;
    }
  }
  return null;
}

function isElementScrambled(element) {
  return scrambledElements.has(element);
}

function scrambleElement(element, styles) {
  element.style.position = "fixed";
  element.style.left = styles.left;
  element.style.top = styles.top;
  element.style.zIndex = styles.zIndex;
  element.style.width = styles.width;
  element.style.height = styles.height;
  scrambledElements.set(element, { left: styles.left, top: styles.top, zIndex: styles.zIndex });
}

function scrambleNewElement(element) {
  if (isElementScrambled(element)) {
    const styles = scrambledElements.get(element);
    element.style.position = "fixed";
    element.style.left = styles.left;
    element.style.top = styles.top;
    element.style.zIndex = styles.zIndex;
    element.style.width = styles.width;
    element.style.height = styles.height;
  }
}
