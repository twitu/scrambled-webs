let isActive = false;
let draggedElement = null;
let originalStyles = new Map();
let originalSizes = new Map();
let scrambledElements = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isActive = !isActive;
    if (isActive) {
      enableDragging();
    } else {
      disableDragging();
    }
  } else if (request.action === "save") {
    sendResponse(saveState());
  } else if (request.action === "load") {
    loadState(request.state);
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
  
  draggedElement.style.position = "fixed";
  draggedElement.style.zIndex = "9999";
  draggedElement.style.width = originalSizes.get(draggedElement).width + "px";
  draggedElement.style.height = originalSizes.get(draggedElement).height + "px";
  
  const rect = draggedElement.getBoundingClientRect();
  draggedElement.style.left = rect.left + "px";
  draggedElement.style.top = rect.top + "px";
}

function drag(e) {
  if (!draggedElement) return;
  e.preventDefault();
  const left = e.clientX - draggedElement.offsetWidth / 2 + "px";
  const top = e.clientY - draggedElement.offsetHeight / 2 + "px";
  draggedElement.style.left = left;
  draggedElement.style.top = top;
  scrambledElements.set(draggedElement, { left, top });
}

function stopDragging(e) {
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
}

function saveState() {
  const state = {
    url: window.location.href,
    elements: []
  };

  scrambledElements.forEach((styles, element) => {
    state.elements.push({
      selector: generateUniqueSelector(element),
      left: styles.left,
      top: styles.top
    });
  });

  return btoa(JSON.stringify(state));
}

function loadState(encodedState) {
  const state = JSON.parse(atob(encodedState));
  if (state.url !== window.location.href) {
    console.error("State URL does not match current URL");
    return;
  }

  state.elements.forEach(elem => {
    const element = document.querySelector(elem.selector);
    if (element) {
      saveOriginalStyles(element);
      saveOriginalSize(element);
      element.style.position = "fixed";
      element.style.left = elem.left;
      element.style.top = elem.top;
      element.style.zIndex = "9999";
      scrambledElements.set(element, { left: elem.left, top: elem.top });
    }
  });

  enableDragging();
}

function generateUniqueSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  let selector = element.tagName.toLowerCase();
  if (element.className) {
    selector += `.${element.className.split(' ').join('.')}`;
  }
  const siblings = element.parentNode.children;
  if (siblings.length > 1) {
    const index = Array.from(siblings).indexOf(element);
    selector += `:nth-child(${index + 1})`;
  }
  return selector;
}
