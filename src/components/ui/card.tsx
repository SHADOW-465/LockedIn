import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
    'rounded-0 transition-all duration-150',
    {
        variants: {
            variant: {
                raised:
                    'bg-[#0a0a0a] border border-[#141414]',
                inset:
                    'bg-black border border-[#141414]/50',
                flat:
                    'bg-[#0a0a0a]',
                hero:
                    'bg-black border-l-2 border-l-[var(--color-accent)]',
            },
            size: {
                sm: 'p-3',
                md: 'p-5',
                lg: 'p-8',
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
