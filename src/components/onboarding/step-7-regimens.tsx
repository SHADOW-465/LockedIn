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
        } else if (selectedRegimens.length < 3) {
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
                <p className="text-text-secondary text-sm">
                    Choose <span className="text-red-primary font-semibold">1 primary</span> and up to{' '}
                    <span className="text-purple-primary font-semibold">2 secondary</span> regimens.
                </p>
            </div>

            <div className="space-y-2">
                {REGIMEN_OPTIONS.map((reg) => {
                    const selected = selectedRegimens.find((r) => r.id === reg.id)
                    const isSelected = !!selected
                    const isPrimary = selected?.isPrimary ?? false
                    const canAdd = selectedRegimens.length < 3

                    return (
                        <div
                            key={reg.id}
                            className={`p-4 rounded-[var(--radius-lg)] border transition-all duration-200 ${isSelected
                                    ? isPrimary
                                        ? 'border-red-primary/40 bg-red-primary/5 glow-red'
                                        : 'border-purple-primary/40 bg-purple-primary/5'
                                    : 'border-white/5 bg-bg-secondary/50 hover:bg-bg-secondary'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => toggleRegimen(reg.id, reg.name)}
                                    disabled={!isSelected && !canAdd}
                                    className="flex-1 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className={`font-semibold text-sm ${isPrimary ? 'text-red-primary' : isSelected ? 'text-purple-primary' : ''
                                        }`}>
                                        {reg.name}
                                    </span>
                                    <p className="text-text-tertiary text-xs mt-0.5">{reg.description}</p>
                                </button>

                                {isSelected && (
                                    <button
                                        onClick={() => makePrimary(reg.id)}
                                        className="ml-3 flex-shrink-0 cursor-pointer"
                                        title={isPrimary ? 'Primary regimen' : 'Click to make primary'}
                                    >
                                        {isPrimary ? (
                                            <Star size={18} className="text-red-primary fill-red-primary" />
                                        ) : (
                                            <StarOff size={18} className="text-text-disabled hover:text-purple-primary transition-colors" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedRegimens.length > 0 && (
                <p className="text-center text-xs text-text-tertiary">
                    {selectedRegimens.length}/3 selected
                </p>
            )}
        </div>
    )
}
