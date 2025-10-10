export class PencilTool {
  constructor(toolManager, canvasManager) {
    this.toolManager = toolManager;
    this.canvasManager = canvasManager;
  }
  onStart(e) {
    const { x, y } = this.canvasManager.getScaledCoords(e);
    this.canvasManager.lastX = Math.round(x);
    this.canvasManager.lastY = Math.round(y);
    this.canvasManager.ctx.beginPath();
    this.canvasManager.ctx.moveTo(
      this.canvasManager.lastX,
      this.canvasManager.lastY
    );
    this.onDraw(e);
  }
  onDraw(e) {
    const { x, y } = this.canvasManager.getScaledCoords(e);
    const rx = Math.round(x);
    const ry = Math.round(y);
    const dx = rx - this.canvasManager.lastX;
    const dy = ry - this.canvasManager.lastY;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    this.canvasManager.ctx.fillStyle = this.toolManager.getStrokeStyle();
    for (let i = 0; i <= dist; i++) {
      const ix = this.canvasManager.lastX + (dx * i) / dist;
      const iy = this.canvasManager.lastY + (dy * i) / dist;
      this.canvasManager.ctx.fillRect(
        Math.round(ix) - Math.floor(this.toolManager.currentSize / 2),
        Math.round(iy) - Math.floor(this.toolManager.currentSize / 2),
        this.toolManager.currentSize,
        this.toolManager.currentSize
      );
    }
    this.canvasManager.lastX = rx;
    this.canvasManager.lastY = ry;
  }
  onEnd() {
    this.canvasManager.ctx.beginPath();
  }
}
