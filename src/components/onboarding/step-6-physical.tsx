'use client'

import { useOnboarding, type PhysicalDetails } from '@/lib/stores/onboarding-store'
import { useEffect, useState } from 'react'
import { Ruler } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

function calcSizeBucket(erectLength?: number): string {
    if (!erectLength) return ''
    if (erectLength <= 3) return 'Micro'
    if (erectLength <= 4.5) return 'Small'
    if (erectLength <= 6) return 'Average'
    if (erectLength <= 7.5) return 'Large'
    return 'Monster'
}

export default function PhysicalStep({ onValid }: StepProps) {
    const { physicalDetails, setPhysicalDetails } = useOnboarding()

    const [bodyType, setBodyType] = useState(physicalDetails?.bodyType || '')
    const [orientation, setOrientation] = useState(physicalDetails?.orientation || '')
    const [erectLength, setErectLength] = useState(physicalDetails?.penisSize?.erectLength || 0)
    const [erectGirth, setErectGirth] = useState(physicalDetails?.penisSize?.erectGirth || 0)
    const [grower, setGrower] = useState<'grower' | 'shower'>(physicalDetails?.penisSize?.growerOrShower || 'grower')

    useEffect(() => {
        onValid(true) // Physical details are optional
    }, [onValid])

    useEffect(() => {
        const details: PhysicalDetails = {
            bodyType: bodyType || undefined,
            orientation: orientation || undefined,
            penisSize: erectLength > 0
                ? {
                    erectLength,
                    erectGirth: erectGirth || undefined,
                    growerOrShower: grower,
                    sizeBucket: calcSizeBucket(erectLength),
                }
                : undefined,
        }
        setPhysicalDetails(details)
    }, [bodyType, orientation, erectLength, erectGirth, grower, setPhysicalDetails])

    const sizeBucket = calcSizeBucket(erectLength)

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Physical Details</h2>
                <p className="text-text-secondary text-sm">
                    Optional but enables personalized SPH content, size-based tasks, and more accurate AI.
                </p>
            </div>

            {/* Body Type */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Body Type</label>
                <div className="flex flex-wrap gap-2">
                    {['Slim', 'Average', 'Athletic', 'Muscular', 'Thick', 'Heavy'].map((bt) => (
                        <button
                            key={bt}
                            onClick={() => setBodyType(bt)}
                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${bodyType === bt
                                    ? 'bg-purple-primary/15 border-purple-primary/40 text-purple-primary'
                                    : 'bg-bg-tertiary/50 border-white/5 text-text-tertiary hover:border-white/10'
                                }`}
                        >
                            {bt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Orientation</label>
                <div className="flex flex-wrap gap-2">
                    {['Straight', 'Bi-Curious', 'Bisexual', 'Gay', 'Other'].map((o) => (
                        <button
                            key={o}
                            onClick={() => setOrientation(o)}
                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${orientation === o
                                    ? 'bg-purple-primary/15 border-purple-primary/40 text-purple-primary'
                                    : 'bg-bg-tertiary/50 border-white/5 text-text-tertiary hover:border-white/10'
                                }`}
                        >
                            {o}
                        </button>
                    ))}
                </div>
            </div>

            {/* Penis Measurements */}
            <div className="space-y-3 bg-bg-secondary/50 rounded-[var(--radius-lg)] border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                    <Ruler size={14} className="text-red-primary" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Measurements <span className="text-text-disabled">(Optional)</span>
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-tertiary">Erect Length (inches)</label>
                        <input
                            type="number"
                            min={0}
                            max={12}
                            step={0.25}
                            value={erectLength || ''}
                            onChange={(e) => setErectLength(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-bg-primary border border-white/5 text-sm text-text-primary focus:outline-none focus:border-red-primary/40"
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-tertiary">Erect Girth (inches)</label>
                        <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.25}
                            value={erectGirth || ''}
                            onChange={(e) => setErectGirth(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-bg-primary border border-white/5 text-sm text-text-primary focus:outline-none focus:border-red-primary/40"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Grower/Shower */}
                <div className="flex gap-2">
                    {(['grower', 'shower'] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrower(g)}
                            className={`flex-1 py-2 rounded-[var(--radius-md)] text-xs font-medium capitalize transition-all cursor-pointer border ${grower === g
                                    ? 'bg-red-primary/15 border-red-primary/40 text-red-primary'
                                    : 'bg-bg-primary border-white/5 text-text-tertiary hover:border-white/10'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Size Bucket Display */}
                {sizeBucket && erectLength > 0 && (
                    <div className="text-center py-2">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Classification: </span>
                        <span className={`text-sm font-bold font-mono ${sizeBucket === 'Micro' || sizeBucket === 'Small' ? 'text-red-primary' : 'text-text-primary'
                            }`}>
                            {sizeBucket}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
