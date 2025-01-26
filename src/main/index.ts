import { app, Event } from 'electron'
import { PagerDutyMenuBar } from './main'

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (error) => {
    console.error('未处理的 Promise 拒绝:', error)
})

// 确保应用是单实例的
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    console.log('已有实例运行，退出应用')
    app.quit()
} else {
    console.log('启动应用...')
    try {
        const pagerDuty = new PagerDutyMenuBar()
    } catch (error) {
        console.error('应用启动失败:', error)
    }
}

// 防止应用退出
app.on('window-all-closed', (event: Event) => {
    console.log('阻止窗口关闭导致的应用退出')
    event.preventDefault()
}) 