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
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-white decoration-2">Conditioning Protocols</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    ESTABLISH OPERATIONAL PARAMETERS. DEFINE THE PRIMARY DIRECTIVE FOR COGNITIVE RESTRUCTURING. SELECT AT LEAST 01 PROTOCOL.
                </p>
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {REGIMEN_OPTIONS.map((reg) => {
                    const selected = selectedRegimens.find((r) => r.id === reg.id)
                    const isSelected = !!selected
                    const isPrimary = selected?.isPrimary ?? false

                    return (
                        <div
                            key={reg.id}
                            className={`border transition-all duration-150 relative ${isSelected
                                    ? isPrimary
                                        ? 'bg-black border-[var(--color-accent)]'
                                        : 'bg-black border-white'
                                    : 'bg-[#050505] border-[#141414] hover:border-[#333]'
                                }`}
                        >
                            <div className="flex items-stretch">
                                <button
                                    onClick={() => toggleRegimen(reg.id, reg.name)}
                                    className="flex-1 text-left p-6 cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-display font-bold text-lg uppercase tracking-tight ${isSelected ? 'text-white' : 'text-[#444]'}`}>
                                            {reg.name}
                                        </span>
                                        {isSelected && (
                                            <div className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border ${isPrimary ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-black' : 'border-white text-white'}`}>
                                                {isPrimary ? 'PRIMARY_DIRECTIVE' : 'SECONDARY_DATA'}
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-[11px] font-mono leading-relaxed uppercase tracking-widest transition-opacity ${isSelected ? 'text-[var(--color-text-secondary)]' : 'text-[#222]'}`}>
                                        {reg.description.toUpperCase()}
                                    </p>
                                </button>

                                {isSelected && (
                                    <button
                                        onClick={() => makePrimary(reg.id)}
                                        className={`w-12 flex items-center justify-center border-l transition-colors cursor-pointer ${isPrimary ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
                                        title={isPrimary ? 'Primary Directive Active' : 'Set as Primary Directive'}
                                    >
                                        <div className={`w-3 h-3 ${isPrimary ? 'bg-[var(--color-accent)]' : 'bg-[#222] group-hover:bg-white opacity-40'}`} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center justify-between border-t border-[#141414] pt-8">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[var(--color-accent)]" />
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-white opacity-40">SYSTEM_ALIGNMENT: OPTIMAL</span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">
                    {selectedRegimens.length} PROTOCOLS_QUEUED
                </p>
            </div>
        </div>
    )
}
