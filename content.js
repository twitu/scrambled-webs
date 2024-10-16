let isActive = false;
let draggedElement = null;
let originalStyles = new Map();
let originalSizes = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isActive = !isActive;
    if (isActive) {
      enableDragging();
    } else {
      disableDragging();
    }
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
  draggedElement.style.left = e.clientX - draggedElement.offsetWidth / 2 + "px";
  draggedElement.style.top = e.clientY - draggedElement.offsetHeight / 2 + "px";
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
