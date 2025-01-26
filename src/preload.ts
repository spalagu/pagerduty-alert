import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // 发送消息
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args)
    },
    // 调用主进程方法并等待结果
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args)
    },
    // 监听消息
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, callback)
    },
    // 移除监听器
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback)
    }
  },
  closeNotification: () => ipcRenderer.invoke('close-notification')
}) 