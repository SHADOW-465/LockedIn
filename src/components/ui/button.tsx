import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold uppercase tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
    {
        variants: {
            variant: {
                primary:
                    'bg-red-primary text-white shadow-raised glow-red hover:bg-red-hover hover:shadow-raised-hover active:shadow-inset',
                secondary:
                    'bg-purple-primary text-white shadow-raised glow-purple hover:bg-purple-hover active:shadow-inset',
                ghost:
                    'bg-bg-secondary shadow-raised hover:shadow-raised-hover active:shadow-inset text-text-primary',
                outline:
                    'border-2 border-purple-primary/50 text-purple-primary hover:bg-purple-primary/10 active:bg-purple-primary/20',
                danger:
                    'bg-red-primary/20 text-red-primary border border-red-primary/30 hover:bg-red-primary/30 active:bg-red-primary/40',
            },
            size: {
                sm: 'px-4 py-2 text-sm',
                md: 'px-6 py-3 text-base',
                lg: 'px-8 py-4 text-lg',
                icon: 'w-10 h-10 p-0',
            },
        },
        defaultVariants: {
            variant: 'ghost',
            size: 'md',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

export function Button({ className, variant, size, ...props }: ButtonProps) {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}
