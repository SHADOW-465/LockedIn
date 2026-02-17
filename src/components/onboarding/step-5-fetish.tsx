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
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Fetish & Kink Profile</h2>
                <p className="text-text-secondary text-sm">
                    Select the genres that interest you. Tasks and content will be tailored accordingly.
                    Select at least <span className="text-red-primary font-semibold">1</span>.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {FETISH_GENRES.map((genre) => {
                    const isSelected = fetishProfile.includes(genre)

                    return (
                        <button
                            key={genre}
                            onClick={() => toggleFetish(genre)}
                            className={`p-3 rounded-[var(--radius-lg)] border text-left transition-all duration-200 cursor-pointer ${isSelected
                                    ? 'border-red-primary/40 bg-red-primary/10'
                                    : 'border-white/5 bg-bg-secondary/50 hover:bg-bg-secondary hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Heart
                                    size={14}
                                    className={isSelected ? 'text-red-primary fill-red-primary' : 'text-text-disabled'}
                                />
                                <span className={`text-xs font-medium ${isSelected ? 'text-red-primary' : 'text-text-secondary'}`}>
                                    {genre}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {fetishProfile.length > 0 && (
                <p className="text-center text-xs text-text-tertiary">
                    <span className="text-red-primary font-semibold">{fetishProfile.length}</span> genre{fetishProfile.length !== 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    )
}
