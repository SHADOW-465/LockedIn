import { cn } from '@/lib/utils'

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-4 p-4',
                'md:grid-cols-2 md:gap-5',
                'lg:grid-cols-3 lg:gap-5 lg:p-8',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
    span?: 'hero' | 'wide' | 'tall' | 'default'
}

export function BentoItem({
    className,
    span = 'default',
    ...props
}: BentoItemProps) {
    const spanClasses = {
        hero: 'md:col-span-2 lg:row-span-2',
        wide: 'md:col-span-2',
        tall: 'lg:row-span-2',
        default: '',
    }

    return (
        <div
            className={cn(
                'bg-bg-secondary rounded-[var(--radius-lg)] p-6 shadow-raised border border-white/5 min-h-[120px]',
                'transition-all duration-300 animate-fade-in',
                spanClasses[span],
                className
            )}
            {...props}
        />
    )
}
