/**
 * 座位图渲染与交互（唯一应操作座位 DOM 的模块）。
 * TODO: 委托点击/键盘、ARIA、与 Service 同步状态。
 */
export class SeatRenderer {
  /**
   * @param {{ container: HTMLElement, getApp: () => import('../core/SeatBookingApp.js').SeatBookingApp, onChange?: () => void }} _deps
   */
  constructor(_deps) {
    // TODO: 保存 deps、绑定委托
  }

  renderAllSectors() {
    // TODO
  }

  refresh() {
    // TODO
  }
}
