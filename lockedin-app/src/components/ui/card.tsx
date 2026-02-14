import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
    'rounded-[var(--radius-lg)] transition-all duration-300',
    {
        variants: {
            variant: {
                raised:
                    'bg-bg-secondary shadow-raised hover:shadow-raised-hover border border-white/5',
                inset: 'bg-bg-primary shadow-inset',
                flat: 'bg-bg-secondary shadow-sm',
                hero: 'bg-gradient-to-br from-bg-secondary to-bg-primary shadow-raised border border-white/5',
            },
            size: {
                sm: 'p-4 min-h-[100px]',
                md: 'p-6 min-h-[140px]',
                lg: 'p-8 min-h-[200px]',
            },
        },
        defaultVariants: {
            variant: 'raised',
            size: 'md',
        },
    }
)

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> { }

export function Card({ className, variant, size, ...props }: CardProps) {
    return (
        <div
            className={cn(cardVariants({ variant, size, className }))}
            {...props}
        />
    )
}
