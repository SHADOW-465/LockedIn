import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-sm font-medium text-text-secondary"
                    >
                        {label}
                    </label>
                )}
                <input
                    id={id}
                    ref={ref}
                    className={cn(
                        'w-full bg-[#0a0a0a] rounded-0 px-4 py-3 border border-[#141414]',
                        'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-mono',
                        'focus:outline-none focus:border-[var(--color-accent)]',
                        'transition-all duration-150',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-[var(--color-accent)]',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-[10px] uppercase font-bold text-[var(--color-accent)] mt-1 tracking-wider">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
