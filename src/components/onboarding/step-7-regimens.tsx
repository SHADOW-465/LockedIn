'use client'

import { useOnboarding, REGIMEN_OPTIONS, type TrainingRegimen } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Star, StarOff } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

export default function RegimensStep({ onValid }: StepProps) {
    const { selectedRegimens, setSelectedRegimens } = useOnboarding()

    useEffect(() => {
        onValid(selectedRegimens.length >= 1)
    }, [selectedRegimens, onValid])

    const toggleRegimen = (id: string, name: string) => {
        const exists = selectedRegimens.find((r) => r.id === id)
        if (exists) {
            setSelectedRegimens(selectedRegimens.filter((r) => r.id !== id))
        } else {
            const isPrimary = selectedRegimens.length === 0
            setSelectedRegimens([...selectedRegimens, { id, name, isPrimary }])
        }
    }

    const makePrimary = (id: string) => {
        setSelectedRegimens(
            selectedRegimens.map((r) => ({ ...r, isPrimary: r.id === id })),
        )
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Training Regimens</h2>
                <p className="text-white/80 text-sm">
                    Choose <span className="text-white font-semibold">1 primary</span> and as many{' '}
                    <span className="text-white font-semibold">secondary</span> regimens as you like.
                </p>
            </div>

            <div className="space-y-2">
                {REGIMEN_OPTIONS.map((reg) => {
                    const selected = selectedRegimens.find((r) => r.id === reg.id)
                    const isSelected = !!selected
                    const isPrimary = selected?.isPrimary ?? false

                    return (
                        <div
                            key={reg.id}
                            className={`p-4 rounded-[var(--radius-lg)] border transition-all duration-200 ${isSelected
                                ? isPrimary
                                    ? 'border-zinc-700 bg-zinc-800/5 '
                                    : 'border-zinc-700 bg-zinc-800/5'
                                : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => toggleRegimen(reg.id, reg.name)}
                                    className="flex-1 text-left cursor-pointer"
                                >
                                    <span className={`font-semibold text-sm ${isPrimary ? 'text-white' : isSelected ? 'text-white' : ''
                                        }`}>
                                        {reg.name}
                                    </span>
                                    <p className="text-white/30 text-xs mt-0.5">{reg.description}</p>
                                </button>

                                {isSelected && (
                                    <button
                                        onClick={() => makePrimary(reg.id)}
                                        className="ml-3 flex-shrink-0 cursor-pointer"
                                        title={isPrimary ? 'Primary regimen' : 'Click to make primary'}
                                    >
                                        {isPrimary ? (
                                            <Star size={18} className="text-white fill-red-primary" />
                                        ) : (
                                            <StarOff size={18} className="text-white/20 hover:text-white transition-colors" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedRegimens.length > 0 && (
                <p className="text-center text-xs text-white/30">
                    {selectedRegimens.length} selected • ⭐ = primary
                </p>
            )}
        </div>
    )
}
