import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Incident } from '../types'
import { IncidentCard } from './components/IncidentCard'
import { IncidentDetailModal } from './components/IncidentDetailModal'
import { SkeletonCard } from './components/SkeletonCard'
import { EmptyState } from './components/EmptyState'
import { Toaster, toast } from 'react-hot-toast'

export const App: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
    const [error, setError] = useState<string | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [isIpcReady, setIsIpcReady] = useState(false)

    // 更新托盘图标状态
    const updateTrayIcon = useCallback(async (incidents: Incident[]) => {
        await window.electron.ipcRenderer.invoke('update-tray-icon', { incidents })
    }, [])

    // 告警排序函数
    const sortIncidents = useCallback((incidents: Incident[]) => {
        return [...incidents].sort((a, b) => {
            // 第一优先级：未确认的告警排在前面
            if (a.status === 'triggered' && b.status !== 'triggered') return -1
            if (a.status !== 'triggered' && b.status === 'triggered') return 1

            // 第二优先级：高优先级告警排在前面
            if (a.status === b.status) {
                if (a.urgency === 'high' && b.urgency !== 'high') return -1
                if (a.urgency !== 'high' && b.urgency === 'high') return 1
            }

            // 第三优先级：按时间倒序排列
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }, [])

    // 加载告警列表
    const loadIncidents = useCallback(async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setIsLoading(true)
            } else {
                setIsRefreshing(true)
            }
            setError(null)
            
            const data = await window.electron.ipcRenderer.invoke('fetch-incidents')
            
            // 增量更新逻辑
            setIncidents(prevIncidents => {
                // 如果是初始加载，直接设置数据
                if (isInitialLoad) {
                    const sortedIncidents = sortIncidents(data)
                    return sortedIncidents
                }

                // 创建一个Map来存储现有告警，用于快速查找
                const existingIncidentsMap = new Map(
                    prevIncidents.map(incident => [incident.id, incident])
                )

                // 处理新数据
                const updatedIncidents = data.map((newIncident: Incident) => {
                    const existingIncident = existingIncidentsMap.get(newIncident.id)
                    if (existingIncident) {
                        // 如果告警已存在且状态没变，保持原对象引用以避免不必要的重渲染
                        return existingIncident.status === newIncident.status
                            ? existingIncident
                            : newIncident
                    }
                    return newIncident
                })

                const sortedIncidents = sortIncidents(updatedIncidents)
                return sortedIncidents
            })
        } catch (error) {
            console.error('加载告警失败:', error)
            setError('加载告警失败')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [sortIncidents])

    // 暴露获取告警列表的方法
    useEffect(() => {
        // @ts-ignore
        window.getAllIncidents = () => incidents
    }, [incidents])

    // 监听设置事件
    useEffect(() => {
        const handleShowSettings = () => {
            window.electron.ipcRenderer.invoke('show-settings-window')
        }

        const handleConfigChanged = async () => {
            try {
                // 重新加载告警列表
                await loadIncidents(true)
                // 不需要手动调用 updateTrayIcon，因为 loadIncidents 中的 setIncidents 会触发状态更新
            } catch (error) {
                console.error('配置更新失败:', error)
                toast.error('配置更新失败')
            }
        }

        window.electron.ipcRenderer.on('show-settings', handleShowSettings)
        window.electron.ipcRenderer.on('config-changed', handleConfigChanged)

        return () => {
            window.electron.ipcRenderer.removeListener('show-settings', handleShowSettings)
            window.electron.ipcRenderer.removeListener('config-changed', handleConfigChanged)
        }
    }, [loadIncidents])

    // 监听 incidents 变化更新图标
    useEffect(() => {
        if (!isLoading && incidents.length >= 0) {
            updateTrayIcon(incidents).catch(console.error)
        }
    }, [incidents, isLoading, updateTrayIcon])

    // 保存滚动位置
    useEffect(() => {
        const handleScroll = () => {
            if (listRef.current) {
                setScrollPosition(listRef.current.scrollTop)
            }
        }

        const listElement = listRef.current
        if (listElement) {
            listElement.addEventListener('scroll', handleScroll)
            return () => listElement.removeEventListener('scroll', handleScroll)
        }
    }, [])

    // 恢复滚动位置
    useEffect(() => {
        if (listRef.current && !isLoading) {
            listRef.current.scrollTop = scrollPosition
        }
    }, [isLoading, incidents])

    // 初始加载和轮询
    useEffect(() => {
        // 初始加载
        loadIncidents(true)

        // 设置轮询
        const interval = setInterval(() => {
            loadIncidents(false)
        }, 30000) // 30秒轮询一次

        return () => clearInterval(interval)
    }, [loadIncidents])

    useEffect(() => {
        // 监听 IPC 就绪事件
        const handleIpcReady = () => {
            console.log('IPC 已就绪')
            setIsIpcReady(true)
        }
        
        window.electron.ipcRenderer.on('ipc-ready', handleIpcReady)
        
        return () => {
            window.electron.ipcRenderer.removeListener('ipc-ready', handleIpcReady)
        }
    }, [])

    useEffect(() => {
        if (!isIpcReady) {
            console.log('等待 IPC 就绪...')
            return
        }

        const initializeApp = async () => {
            try {
                setIsLoading(true)
                // 获取配置
                const config = await window.electron.ipcRenderer.invoke('get-config')
                // 获取告警列表
                const incidents = await window.electron.ipcRenderer.invoke('fetch-incidents')
                // 更新托盘图标
                await window.electron.ipcRenderer.invoke('update-tray-icon', { incidents })
                
                setIsLoading(false)
            } catch (error) {
                console.error('初始化失败:', error)
                setIsLoading(false)
            }
        }

        initializeApp()
    }, [isIpcReady])

    const handleAcknowledge = async (incident: Incident) => {
        try {
            setIsRefreshing(true)
            await window.electron.ipcRenderer.invoke('acknowledge-incident', incident.id)
            
            // 使用函数式更新确保状态一致性
            const updatedIncidents = incidents.map(inc => 
                inc.id === incident.id 
                    ? { ...inc, status: 'acknowledged' as const } 
                    : inc
            )
            const sortedIncidents = sortIncidents(updatedIncidents)
            setIncidents(sortedIncidents)
            // incidents 变化会自动触发 effect 更新图标
            
            toast.success('告警已确认')
        } catch (error) {
            console.error('确认告警失败:', error)
            toast.error('确认告警失败')
        } finally {
            setIsRefreshing(false)
        }
    }

    // 监听主题变化
    useEffect(() => {
        const handleThemeChange = async () => {
            try {
                const config = await window.electron.ipcRenderer.invoke('get-config')
                const isDark = await window.electron.ipcRenderer.invoke('get-theme-mode')
                console.log('主题更新:', isDark ? 'dark' : 'light')
                document.documentElement.classList.remove('light', 'dark')
                document.documentElement.classList.add(isDark ? 'dark' : 'light')
                setTheme(isDark ? 'dark' : 'light')
            } catch (error) {
                console.error('获取主题设置失败:', error)
            }
        }

        // 监听主题变化事件
        window.electron.ipcRenderer.on('theme-changed', handleThemeChange)
        
        // 初始化主题
        handleThemeChange()

        return () => {
            window.electron.ipcRenderer.removeListener('theme-changed', handleThemeChange)
        }
    }, [])

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            )
        }

        if (error) {
            return <EmptyState message={error} />
        }

        if (incidents.length === 0) {
            return <EmptyState message="暂无告警" />
        }

        return (
            <AnimatePresence>
                {incidents.map(incident => (
                    <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        style={{ transition: 'all 0.2s' }}
                    >
                        <IncidentCard
                            incident={incident}
                            onAcknowledge={handleAcknowledge}
                            onClick={setSelectedIncident}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        )
    }

    if (!isIpcReady || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {!isIpcReady ? '正在初始化...' : '加载中...'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Toaster position="top-right" />
            
            {isRefreshing && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="bg-primary-500 h-0.5">
                        <div className="h-full bg-white/30 animate-progress" />
                    </div>
                </div>
            )}
            
            <div 
                ref={listRef}
                className="h-screen overflow-y-auto p-4 scroll-smooth"
            >
                {renderContent()}
            </div>
            
            {selectedIncident && (
                <IncidentDetailModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                />
            )}
        </div>
    )
} 