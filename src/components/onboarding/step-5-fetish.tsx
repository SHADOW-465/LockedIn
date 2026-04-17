'use client'

import { useOnboarding, FETISH_GENRES } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Heart } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

export default function FetishStep({ onValid }: StepProps) {
    const { fetishProfile, setFetishProfile } = useOnboarding()

    useEffect(() => {
        onValid(fetishProfile.length >= 1)
    }, [fetishProfile, onValid])

    const toggleFetish = (genre: string) => {
        if (fetishProfile.includes(genre)) {
            setFetishProfile(fetishProfile.filter((f) => f !== genre))
        } else {
            setFetishProfile([...fetishProfile, genre])
        }
    }

    return (
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-white decoration-2">Preference Matrix</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    CLASSIFY CORE INTERESTS. DATA WILL BE USED TO TAILOR PSYCHOLOGICAL INTERVENTIONS. SELECT AT LEAST 01 CATEGORY.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {FETISH_GENRES.map((genre) => {
                    const isSelected = fetishProfile.includes(genre)

                    return (
                        <button
                            key={genre}
                            onClick={() => toggleFetish(genre)}
                            className={`p-4 border transition-all duration-150 text-left relative group cursor-pointer ${isSelected
                                    ? 'bg-black border-[var(--color-accent)]'
                                    : 'bg-[#050505] border-[#141414] hover:border-[#333]'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute right-0 top-0 w-2 h-2 bg-[var(--color-accent)]" />
                            )}
                            
                            <div className="flex flex-col gap-3">
                                <div className={`w-6 h-6 border flex items-center justify-center ${isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[#141414]'}`}>
                                    {isSelected ? (
                                        <div className="w-2 h-2 bg-[var(--color-accent)]" />
                                    ) : (
                                        <div className="w-1 h-1 bg-[#222]" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest leading-tight ${isSelected ? 'text-white' : 'text-[#333]'}`}>
                                    {genre}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center gap-6 border-t border-[#141414] pt-8">
                <div className="flex-1 bg-[#141414] h-1" />
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">
                    {fetishProfile.length < 10 && '0'}{fetishProfile.length} CATEGORIES_LOGGED
                </p>
                <div className="flex-1 bg-[#141414] h-1" />
            </div>
        </div>
    )
}
