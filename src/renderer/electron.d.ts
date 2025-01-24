export interface IpcRenderer {
  invoke(channel: 'get-config'): Promise<any>
  invoke(channel: 'save-config', config: any): Promise<void>
  invoke(channel: 'config-changed'): Promise<void>
  invoke(channel: 'show-settings-window'): Promise<void>
  invoke(channel: 'close-settings-window'): Promise<void>
  invoke(channel: string, ...args: any[]): Promise<any>
  on(channel: string, callback: (...args: any[]) => void): void
  removeListener(channel: string, callback: (...args: any[]) => void): void
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer
    }
  }
} 