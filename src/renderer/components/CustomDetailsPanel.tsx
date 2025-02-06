import React, { useEffect } from 'react'

interface CustomDetailsPanelProps {
    customDetails: Record<string, any>
    alertDetails: Record<string, any>
}

const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
}

const CustomDetailsPanel: React.FC<CustomDetailsPanelProps> = ({ customDetails, alertDetails }) => {
    console.log('CustomDetailsPanel 组件渲染，props:', { 
        customDetails, 
        alertDetails,
        customDetailsType: customDetails ? typeof customDetails : 'undefined',
        alertDetailsType: alertDetails ? typeof alertDetails : 'undefined'
    })
    
    const allDetails = {
        ...(customDetails || {}),
        ...(alertDetails || {})
    }
    const hasDetails = Object.keys(allDetails).length > 0

    useEffect(() => {
        console.log('CustomDetailsPanel 数据更新:', {
            hasDetails,
            detailsKeys: Object.keys(allDetails),
            detailsValues: allDetails
        })
    }, [allDetails])

    if (!hasDetails) {
        console.log('CustomDetailsPanel: 无可用详情数据')
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400">
                无自定义字段信息
            </div>
        )
    }

    console.log('CustomDetailsPanel: 开始渲染详情面板')

    return (
        <div className="space-y-2">
            {Object.entries(allDetails).map(([key, value], index) => {
                console.log('Rendering detail:', { key, value })
                return (
                    <div
                        key={`${key}-${index}`}
                        className="text-sm"
                    >
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {key}
                        </div>
                        <div className="mt-1">
                            <code className="text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded">
                                {formatValue(value)}
                            </code>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default CustomDetailsPanel 