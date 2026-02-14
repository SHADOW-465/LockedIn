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
                        'w-full bg-bg-primary rounded-[var(--radius-pill)] px-4 py-3 shadow-inset',
                        'text-text-primary placeholder:text-text-tertiary',
                        'focus:outline-none focus:ring-2 focus:ring-purple-primary/50',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'ring-2 ring-red-primary/50',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-primary mt-1">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
