let isActive = false;
let draggedElement = null;
let originalStyles = new Map();
let originalSizes = new Map();
let scrambledElements = new Map();
let dragOffset = { x: 0, y: 0 };
let globalZIndex = 9999;

// Check if the page should be scrambled when it loads
const urlParams = new URLSearchParams(window.location.search);
const scrambledState = urlParams.get('scrambled');
if (scrambledState) {
  isActive = true;
  loadState(scrambledState);
  enableDragging();
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

  scrambledElements.forEach((styles, element) => {
    state.elements.push({
      selector: generateComplexSelector(element),
      tagName: element.tagName,
      left: styles.left,
      top: styles.top,
      zIndex: styles.zIndex,
      width: element.style.width,
      height: element.style.height
    });
  });

  return btoa(JSON.stringify(state));
}

function loadState(encodedState) {
  try {
    const state = JSON.parse(atob(encodedState));

    state.elements.forEach(elem => {
      const element = findElementBySelector(elem.selector, elem.tagName);
      if (element) {
        saveOriginalStyles(element);
        saveOriginalSize(element);
        element.style.position = "fixed";
        element.style.left = elem.left;
        element.style.top = elem.top;
        element.style.zIndex = elem.zIndex;
        element.style.width = elem.width;
        element.style.height = elem.height;
        scrambledElements.set(element, { left: elem.left, top: elem.top, zIndex: elem.zIndex });
      } else {
        console.warn(`Element not found: ${elem.selector}`);
      }
    });

    globalZIndex = Math.max(...state.elements.map(elem => parseInt(elem.zIndex)), 9999);
    enableDragging();
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
