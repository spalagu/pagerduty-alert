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
        <div className="h-full overflow-y-auto bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-full">
                <div className="p-4 space-y-4">
                    {/* 标题和描述 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            告警标题
                        </div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">
                            {incident.title}
                        </div>
                    </div>

                    {/* 关键信息 */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {/* 服务名称 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                服务
                            </div>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {incident.service.name}
                            </div>
                        </div>

                        {/* 状态 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                状态
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                {incident.status === 'triggered' ? (
                                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                ) : (
                                    <CheckCircleIcon className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className={`text-sm font-medium ${
                                    incident.status === 'triggered' 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                    {incident.status === 'triggered' ? '待处理' : '已确认'}
                                </span>
                            </div>
                        </div>

                        {/* 优先级 */}
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

                        {/* 创建时间 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                创建时间
                            </div>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {format(new Date(incident.created_at), 'yyyy-MM-dd HH:mm:ss')}
                            </div>
                        </div>

                        {/* 确认时间 */}
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

                    {/* 自定义字段 */}
                    {(hasCustomDetails || hasAlertDetails) && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                自定义字段
                            </div>
                            <div className="mt-1">
                                <CustomDetailsPanel
                                    customDetails={details.customDetails}
                                    alertDetails={details.firstAlertDetails}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default IncidentDetails 