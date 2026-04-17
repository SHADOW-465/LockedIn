import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-0 font-semibold uppercase tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-black',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--color-accent)] text-black border border-[var(--color-accent)] hover:bg-[#ff4d4d] active:bg-[var(--color-accent-dark)]',
                secondary:
                    'bg-[#0a0a0a] text-white border border-[#141414] hover:bg-[#141414] active:bg-[#1f1f1f]',
                ghost:
                    'hover:bg-[#0a0a0a] text-[var(--color-text-primary)] active:bg-[#141414]',
                outline:
                    'border border-[#141414] text-[var(--color-text-secondary)] hover:text-white hover:bg-[#0a0a0a] active:bg-[#141414]',
                danger:
                    'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 active:bg-[var(--color-accent)]/30',
            },
            size: {
                sm: 'px-3 py-1.5 text-xs',
                md: 'px-6 py-3 text-sm',
                lg: 'px-8 py-4 text-base',
                icon: 'w-10 h-10 p-0',
            },
        },
        defaultVariants: {
            variant: 'secondary',
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
