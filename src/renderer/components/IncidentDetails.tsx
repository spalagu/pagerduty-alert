import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
import CustomDetailsPanel from './CustomDetailsPanel'

interface IncidentDetailsProps {
    incident: any
    onClose: () => void
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident, onClose }) => {
    console.log('IncidentDetails 组件渲染，incident:', {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        urgency: incident.urgency,
        service: incident.service,
        description: incident.description,
        details: incident.details,
        custom_fields: incident.custom_fields
    })
    
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        console.log('IncidentDetails 组件挂载')
        return () => {
            console.log('IncidentDetails 组件卸载')
        }
    }, [])

    useEffect(() => {
        const fetchDetails = async () => {
            console.log('开始获取告警详情, ID:', incident.id)
            try {
                setLoading(true)
                console.log('调用 IPC get-incident-details...')
                const result = await window.electron.ipcRenderer.invoke('get-incident-details', incident.id)
                console.log('获取到的原始告警详情:', JSON.stringify(result, null, 2))
                
                if ('error' in result) {
                    console.error('获取告警详情返回错误:', result.error)
                    throw new Error(result.error)
                }

                // 打印更详细的数据结构
                console.log('告警详情数据结构:', {
                    hasCustomDetails: result.customDetails && Object.keys(result.customDetails).length > 0,
                    customDetailsKeys: result.customDetails ? Object.keys(result.customDetails) : [],
                    customDetailsValues: result.customDetails,
                    hasAlertDetails: result.firstAlertDetails && Object.keys(result.firstAlertDetails).length > 0,
                    alertDetailsKeys: result.firstAlertDetails ? Object.keys(result.firstAlertDetails) : [],
                    alertDetailsValues: result.firstAlertDetails,
                    incidentData: result.incident
                })

                setDetails(result)
            } catch (err) {
                console.error('获取告警详情失败:', err)
                setError(err instanceof Error ? err.message : '获取详情失败')
            } finally {
                setLoading(false)
                console.log('获取告警详情完成')
            }
        }

        console.log('Effect 触发, incidentId:', incident.id)
        fetchDetails()
    }, [incident.id])

    // 添加对 details 的监听
    useEffect(() => {
        if (details) {
            console.log('details 状态更新:', {
                hasDetails: !!details,
                hasCustomDetails: details.customDetails && Object.keys(details.customDetails).length > 0,
                customDetailsKeys: details.customDetails ? Object.keys(details.customDetails) : [],
                customDetailsValues: details.customDetails,
                hasAlertDetails: details.firstAlertDetails && Object.keys(details.firstAlertDetails).length > 0,
                alertDetailsKeys: details.firstAlertDetails ? Object.keys(details.firstAlertDetails) : [],
                alertDetailsValues: details.firstAlertDetails
            })
        }
    }, [details])

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 dark:text-red-400">
                <ExclamationTriangleIcon className="w-6 h-6 inline-block mr-2" />
                {error}
            </div>
        )
    }

    if (!details) {
        return (
            <div className="p-4 text-gray-500 dark:text-gray-400">
                无法加载告警详情
            </div>
        )
    }

    const hasCustomDetails = details?.customDetails && Object.keys(details.customDetails).length > 0
    const hasAlertDetails = details?.firstAlertDetails && Object.keys(details.firstAlertDetails).length > 0

    console.log('渲染状态:', {
        hasCustomDetails,
        hasAlertDetails,
        customDetails: details?.customDetails,
        alertDetails: details?.firstAlertDetails
    })

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
                {/* 头部区域 */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="px-4 py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {incident.status === 'triggered' ? (
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                ) : (
                                    <CheckCircleIcon className="w-5 h-5 text-yellow-500" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base font-semibold text-gray-900 dark:text-white break-words">
                                    {incident.title}
                                </h1>
                                <div className="mt-1 flex items-center gap-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {incident.service.name}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className={`font-medium ${
                                        incident.status === 'triggered' 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                        {incident.status === 'triggered' ? '待处理' : '已确认'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 主要内容区域 */}
                <div className="px-4 py-4 space-y-6">
                    {/* 关键信息 */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                优先级
                            </div>
                            <div className={`mt-1 text-sm font-medium ${
                                incident.urgency === 'high'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-blue-600 dark:text-blue-400'
                            }`}>
                                {incident.urgency === 'high' ? '高' : '低'}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                创建时间
                            </div>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {format(new Date(incident.created_at), 'yyyy-MM-dd HH:mm:ss')}
                            </div>
                        </div>
                        {incident.status === 'acknowledged' && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    确认时间
                                </div>
                                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                    {format(new Date(incident.last_status_change_at), 'yyyy-MM-dd HH:mm:ss')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 描述信息 */}
                    {incident.description && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    描述
                                </h3>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {incident.description}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 详细信息 */}
                    {incident.details && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    详细信息
                                </h3>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {incident.details}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 自定义字段 */}
                    {(hasCustomDetails || hasAlertDetails) && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    自定义字段
                                </h3>
                            </div>
                            <CustomDetailsPanel
                                customDetails={details.customDetails}
                                alertDetails={details.firstAlertDetails}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default IncidentDetails 