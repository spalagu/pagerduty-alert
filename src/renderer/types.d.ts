declare namespace Electron {
  interface IpcRenderer {
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
    on: (channel: string, callback: (...args: any[]) => void) => void
    removeListener: (channel: string, callback: (...args: any[]) => void) => void
  }
}

declare interface Window {
  electron: {
    ipcRenderer: Electron.IpcRenderer
    closeNotification: () => Promise<void>
  }
} 