import { BucketTool } from "../BucketTool.js";
import { TOOLS } from "../enums/Tools.js";
import { EraserTool } from "../EraserTool.js";
import { PencilTool } from "../PencilTool.js";

/** Handles the current tool and color/size */
export class ToolManager {
  constructor() {
    this.currentTool = TOOLS.PENCIL;
    this.currentColor = "#000000";
    this.lastColor = "#000000";
    this.currentSize = 2;
    this.toolInstances = new Map();
  }
  setTool(tool) {
    this.currentTool = tool;
  }
  setColor(color) {
    this.currentColor = color;
    this.lastColor = color;
    // Switching color while eraser is active should auto-switch to pencil for intuitive UX
    if (this.currentTool === TOOLS.ERASER) {
      this.setTool(TOOLS.PENCIL);
    }
  }
  setSize(size) {
    this.currentSize = size;
  }
  getStrokeStyle() {
    // Eraser always uses white, others use currentColor
    return this.currentTool === TOOLS.ERASER ? "#ffffff" : this.currentColor;
  }
  getCurrentToolInstance(canvasManager) {
    if (!this.toolInstances.has(TOOLS.PENCIL)) {
      this.toolInstances.set(TOOLS.PENCIL, new PencilTool(this, canvasManager));
      this.toolInstances.set(TOOLS.ERASER, new EraserTool(this, canvasManager));
      this.toolInstances.set(TOOLS.BUCKET, new BucketTool(this, canvasManager));
    }
    return this.toolInstances.get(this.currentTool);
  }
}
