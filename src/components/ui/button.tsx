import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold uppercase tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--accent)] text-white border border-[var(--accent)]/50 hover:bg-red-600 active:bg-red-700',
                secondary:
                    'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600',
                ghost:
                    'hover:bg-zinc-800 text-text-primary active:bg-zinc-900',
                outline:
                    'border border-zinc-700 text-text-secondary hover:text-white hover:bg-zinc-800 active:bg-zinc-900',
                danger:
                    'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30',
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
