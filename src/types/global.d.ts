declare module 'electron-store' {
    class Store<T = any> {
        constructor(options?: any)
        get(key: string): T
        set(key: string, value: T): void
        clear(): void
    }
    export = Store
}

declare module 'framer-motion' {
    import { ComponentType, ReactElement, CSSProperties } from 'react'

    interface MotionProps {
        initial?: any
        animate?: any
        exit?: any
        className?: string
        children?: React.ReactNode
        style?: CSSProperties
    }

    export const motion: {
        div: ComponentType<MotionProps & React.HTMLAttributes<HTMLDivElement>>
    }

    interface AnimatePresenceProps {
        children: ReactElement | ReactElement[]
    }

    export const AnimatePresence: ComponentType<AnimatePresenceProps>
}

interface Window {
    require: (module: string) => any
    electron: typeof import('electron')
}

declare module 'node-fetch' {
    function fetch(url: string, init?: RequestInit): Promise<Response>
    export = fetch
} 