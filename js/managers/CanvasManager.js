import { TOOLS } from "../enums/Tools.js";

/**
 * Handles all canvas operations. */
export class CanvasManager {
  constructor(canvas, toolManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.toolManager = toolManager;
    this.painting = false;
    this.lastX = 0;
    this.lastY = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoStackSize = 20;
    // Bindings for event handlers
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.draw = this.draw.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);

    // Touch support handlers
    this._touchStart = this._touchStart.bind(this);
    this._touchMove = this._touchMove.bind(this);
    this._touchEnd = this._touchEnd.bind(this);

    this.canvas.addEventListener("touchstart", this._touchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this._touchMove, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this._touchEnd, {
      passive: false,
    });
  }

  getScaledCoords(e) {
    // Handles display scaling so drawing occurs at correct logical pixel.
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  start(e) {
    e.preventDefault();
    const currentToolInstance = this.toolManager.getCurrentToolInstance(this);
    if (this.toolManager.currentTool === TOOLS.BUCKET) {
      this._saveStateForUndo();
      currentToolInstance.onStart(e);
      this.redoStack = [];
    } else {
      this.painting = true;
      currentToolInstance.onStart(e);
      this._saveStateForUndo();
      this.redoStack = [];
    }
  }

  end(e) {
    e && e.preventDefault();
    if (!this.painting && this.toolManager.currentTool !== TOOLS.BUCKET) return;
    this.painting = false;
    const currentToolInstance = this.toolManager.getCurrentToolInstance(this);
    currentToolInstance.onEnd();
  }

  draw(e) {
    e.preventDefault();
    if (!this.painting) return;
    const currentToolInstance = this.toolManager.getCurrentToolInstance(this);
    currentToolInstance.onDraw(e);
  }

  clear() {
    // Single point of control for clearing the canvas.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  export() {
    // Encapsulates export logic for extensibility (e.g., add JPEG support later).
    const link = document.createElement("a");
    link.href = this.canvas.toDataURL("image/png");
    link.download = "drawing.png";
    link.click();
  }

  bucketFill(x, y) {
    // Encapsulates flood fill logic, making it reusable and testable.
    if (x < 0 || x >= this.canvas.width || y < 0 || y >= this.canvas.height)
      return;
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const { data, width, height } = imageData;
    const idx = (y * width + x) * 4;
    const targetColor = [
      data[idx],
      data[idx + 1],
      data[idx + 2],
      data[idx + 3],
    ];

    // Convert fill color to RGBA using a temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = this.toolManager.getStrokeStyle();
    tempCtx.fillRect(0, 0, 1, 1);
    const fillColorData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillColor = [
      fillColorData[0],
      fillColorData[1],
      fillColorData[2],
      fillColorData[3],
    ];

    // If already filled, do nothing
    if (targetColor.every((v, i) => v === fillColor[i])) return;

    // Inner helpers for flood fill
    function colorMatch(idx, color) {
      return (
        data[idx] === color[0] &&
        data[idx + 1] === color[1] &&
        data[idx + 2] === color[2] &&
        data[idx + 3] === color[3]
      );
    }
    function setColor(idx, color) {
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }
    // BFS flood fill
    const queue = [];
    const visited = new Uint8Array(width * height);
    queue.push([x, y]);
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      const i = (cy * width + cx) * 4;
      if (visited[cy * width + cx]) continue;
      if (!colorMatch(i, targetColor)) continue;
      setColor(i, fillColor);
      visited[cy * width + cx] = 1;
      queue.push([cx + 1, cy]);
      queue.push([cx - 1, cy]);
      queue.push([cx, cy + 1]);
      queue.push([cx, cy - 1]);
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  _saveStateForUndo() {
    // Save current canvas state to undo stack
    try {
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.undoStack.push(imageData);
      if (this.undoStack.length > this.maxUndoStackSize) {
        this.undoStack.shift();
      }
    } catch (e) {
      // Security error or other issues can occur with getImageData
      console.warn("Unable to save undo state:", e);
    }
  }

  undo() {
    if (this.undoStack.length === 0) return;
    try {
      const currentState = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.redoStack.push(currentState);
      const prevState = this.undoStack.pop();
      this.ctx.putImageData(prevState, 0, 0);
      // Reset painting state to avoid issues
      this.painting = false;
    } catch (e) {
      console.warn("Undo failed:", e);
    }
  }

  redo() {
    if (this.redoStack.length === 0) return;
    try {
      const currentState = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.undoStack.push(currentState);
      const nextState = this.redoStack.pop();
      this.ctx.putImageData(nextState, 0, 0);
      // Reset painting state to avoid issues
      this.painting = false;
    } catch (e) {
      console.warn("Redo failed:", e);
    }
  }

  _touchStart(e) {
    this.start(e);
  }
  _touchMove(e) {
    this.draw(e);
  }
  _touchEnd(e) {
    this.end(e);
  }
}
