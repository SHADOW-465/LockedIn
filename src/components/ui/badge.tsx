import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-0 font-bold uppercase tracking-widest text-[10px] border px-2 py-0.5',
    {
        variants: {
            variant: {
                tier1: 'bg-white text-black border-white',
                tier2: 'bg-[#a1a1aa] text-black border-[#a1a1aa]',
                tier3: 'bg-[#525252] text-white border-[#525252]',
                tier4: 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]',
                tier5: 'bg-black text-[var(--color-accent)] border-[var(--color-accent)]',
                locked: 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]',
                caged: 'bg-white text-black border-white',
                uncaged: 'bg-[#141414] text-white border-[#141414]',
                genre: 'bg-black text-[#525252] border-[#141414]',
                success: 'bg-white/10 text-white border-white/20',
                warning: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20',
                info: 'bg-[#141414] text-white border-[#141414]',
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
