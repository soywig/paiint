import { CanvasManager } from "./js/managers/CanvasManager.js";
import { ToolManager } from "./js/managers/ToolManager.js";

// ===== Helper: Sets active class on a group of buttons =====
// Avoids repetitive code and ensures UI consistency.
function setActiveButton(buttons, activeButton) {
  buttons.forEach((btn) => btn.classList.remove("active"));
  if (activeButton) activeButton.classList.add("active");
}

// INITIALIZATION //

const canvas = document.getElementById("paint");
const colorButtons = Array.from(
  document.querySelectorAll("#toolbar .color-button")
);
const sizeButtons = Array.from(
  document.querySelectorAll("#toolbar .size-button")
);
const toolButtons = Array.from(
  document.querySelectorAll("#toolbar .tool-button")
);
const clearBtn = document.getElementById("clear");
const exportBtn = document.getElementById("export");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

const toolManager = new ToolManager();
const canvasManager = new CanvasManager(canvas, toolManager);

const darkModeToggle = document.getElementById("dark-mode-toggle");

// EVENT LISTENERS //

// Color selection
colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(colorButtons, button);
    toolManager.setColor(button.getAttribute("data-color"));
    setActiveButton(
      toolButtons,
      toolButtons.find(
        (btn) => btn.getAttribute("data-tool") === toolManager.currentTool
      )
    );
  });
});

// Brush size selection
sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(sizeButtons, button);
    toolManager.setSize(parseInt(button.getAttribute("data-size"), 10));
  });
});

// Tool selection
toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(toolButtons, button);
    toolManager.setTool(button.getAttribute("data-tool"));
  });
});

// Clear and export
clearBtn.addEventListener("click", () => canvasManager.clear());
exportBtn.addEventListener("click", () => canvasManager.export());

// Undo and redo
undoBtn.addEventListener("click", () => canvasManager.undo());
redoBtn.addEventListener("click", () => canvasManager.redo());

// Canvas drawing events
canvas.addEventListener("mousedown", canvasManager.start);
canvas.addEventListener("mouseup", canvasManager.end);
canvas.addEventListener("mouseleave", canvasManager.end);
canvas.addEventListener("mousemove", canvasManager.draw);

// Dark mode toggle
darkModeToggle.addEventListener("change", () => {
  if (darkModeToggle.checked) {
    canvas.classList.add("dark-mode-canvas");
  } else {
    canvas.classList.remove("dark-mode-canvas");
  }
});

// Set initial active color button
setActiveButton(colorButtons, colorButtons[0]);
