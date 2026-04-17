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
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic">Biometric Upload</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    VOLUNTARY DATA SUBMISSION. PHYSICAL PARAMETERS OPTIMIZE SYSTEM TRAINING MODELS AND SPH SUB-ROUTINES.
                </p>
            </div>

            {/* Body Type */}
            <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">01_MORPHOLOGY_TYPE</label>
                <div className="grid grid-cols-3 gap-2">
                    {['Slim', 'Average', 'Athletic', 'Muscular', 'Thick', 'Heavy'].map((bt) => (
                        <button
                            key={bt}
                            onClick={() => setBodyType(bt)}
                            className={`py-3 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${bodyType === bt
                                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-black'
                                    : 'bg-[#050505] border-[#141414] text-[#333] hover:border-[#333]'
                                }`}
                        >
                            {bt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orientation */}
            <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">02_ALIGNMENT_INDEX</label>
                <div className="grid grid-cols-3 gap-2">
                    {['Straight', 'Bi-Curious', 'Bisexual', 'Gay', 'Other'].map((o) => (
                        <button
                            key={o}
                            onClick={() => setOrientation(o)}
                            className={`py-3 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${orientation === o
                                    ? 'bg-white border-white text-black'
                                    : 'bg-[#050505] border-[#141414] text-[#333] hover:border-[#333]'
                                }`}
                        >
                            {o}
                        </button>
                    ))}
                </div>
            </div>

            {/* Measurements */}
            <div className="space-y-6 bg-black border border-[#141414] p-6">
                <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-2">
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">03_MEASUREMENTS</span>
                    <span className="text-[9px] font-mono text-[#222] uppercase font-bold">[OPTIONAL_INPUT]</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">LENGTH_IN</label>
                        <input
                            type="number"
                            min={0}
                            max={12}
                            step={0.25}
                            value={erectLength || ''}
                            onChange={(e) => setErectLength(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050505] border border-[#141414] px-4 py-4 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">GIRTH_IN</label>
                        <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.25}
                            value={erectGirth || ''}
                            onChange={(e) => setErectGirth(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050505] border border-[#141414] px-4 py-4 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Grower/Shower Toggle */}
                <div className="flex bg-[#141414] p-1 gap-1 mt-4">
                    {(['grower', 'shower'] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrower(g)}
                            className={`flex-1 py-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${grower === g
                                    ? 'bg-black text-white'
                                    : 'text-[#333] hover:text-[#555]'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Classification Display */}
                {sizeBucket && erectLength > 0 && (
                    <div className="mt-8 pt-6 border-t border-[#141414] flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">SYSTEM_CLASSIFICATION:</span>
                        <div className="px-3 py-1 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-tighter">
                            {sizeBucket}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
    )
}
