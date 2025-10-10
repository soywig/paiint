export class BucketTool {
  constructor(toolManager, canvasManager) {
    this.toolManager = toolManager;
    this.canvasManager = canvasManager;
  }
  onStart(e) {
    const { x, y } = this.canvasManager.getScaledCoords(e);
    const rx = Math.round(x);
    const ry = Math.round(y);
    this.canvasManager.bucketFill(rx, ry);
  }
  onDraw(e) {
    // Bucket tool does not draw on drag
  }
  onEnd() {
    // No action needed on end for bucket tool
  }
}
