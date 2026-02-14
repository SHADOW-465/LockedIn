import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-bold uppercase tracking-wide shadow-inset text-xs',
    {
        variants: {
            variant: {
                tier1: 'bg-tier-newbie text-black px-3 py-1',
                tier2: 'bg-tier-slave text-black px-3 py-1',
                tier3: 'bg-tier-hardcore text-white px-3 py-1',
                tier4: 'bg-tier-extreme text-white px-3 py-1',
                tier5:
                    'bg-black text-red-primary border-2 border-red-primary glow-red px-3 py-1',
                locked: 'bg-red-primary text-white px-3 py-1',
                caged: 'bg-red-primary text-white px-2 py-1',
                uncaged: 'bg-teal-primary text-black px-2 py-1',
                genre:
                    'bg-bg-tertiary text-text-secondary border border-white/10 px-2 py-1',
                success: 'bg-tier-newbie/20 text-tier-newbie border border-tier-newbie/30 px-2 py-1',
                warning: 'bg-tier-slave/20 text-tier-slave border border-tier-slave/30 px-2 py-1',
                info: 'bg-purple-primary/20 text-purple-primary border border-purple-primary/30 px-2 py-1',
            },
        },
        defaultVariants: {
            variant: 'genre',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, className }))} {...props} />
    )
}
