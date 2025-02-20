import { app } from 'electron'
import { PagerDutyMenuBar } from './main'
import { logService } from '../services/LogService'

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logService.error('未捕获的异常', error)
})

process.on('unhandledRejection', (error) => {
    logService.error('未处理的 Promise 拒绝', error)
})

// 确保应用是单实例的
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    logService.info('已有实例运行，退出应用')
    app.quit()
} else {
    logService.info('启动应用')
    try {
        const pagerDuty = new PagerDutyMenuBar()
    } catch (error) {
        logService.error('应用启动失败', error)
        app.exit(1)
    }
}

// 防止应用退出
app.on('window-all-closed', (event: Electron.Event) => {
    logService.info('阻止窗口关闭导致的应用退出')
    event.preventDefault()
}) 