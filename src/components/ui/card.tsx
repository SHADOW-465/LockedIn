import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
    'rounded-xl transition-all duration-200',
    {
        variants: {
            variant: {
                raised:
                    'bg-zinc-900 border border-zinc-800',
                inset:
                    'bg-black border border-zinc-800/50',
                flat:
                    'bg-zinc-900',
                hero:
                    'bg-zinc-900 border border-zinc-800',
            },
            size: {
                sm: 'p-4',
                md: 'p-5',
                lg: 'p-6',
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
