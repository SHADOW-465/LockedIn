'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ruler } from 'lucide-react'

const bodyTypes = ['Slim', 'Average', 'Athletic', 'Muscular', 'Stocky', 'Large']
const orientations = ['Straight', 'Bisexual', 'Gay', 'Questioning', 'Other']
const genders = ['Male', 'Trans Female', 'Non-binary', 'Other']

function getSizeBucket(inches: number) {
    if (inches < 3) return { label: '<3"', color: 'text-red-primary' }
    if (inches < 4) return { label: '3–4"', color: 'text-red-primary' }
    if (inches < 5) return { label: '4–5"', color: 'text-tier-slave' }
    if (inches < 6) return { label: '5–6"', color: 'text-text-primary' }
    if (inches < 7) return { label: '6–7"', color: 'text-tier-newbie' }
    return { label: '7"+', color: 'text-tier-newbie' }
}

export default function PhysicalPage() {
    const router = useRouter()
    const { physicalDetails, setPhysicalDetails, setStep } = useOnboarding()

    const [flaccidLength, setFlaccidLength] = useState(physicalDetails?.penisSize.flaccidLength ?? 3)
    const [flaccidGirth, setFlaccidGirth] = useState(physicalDetails?.penisSize.flaccidGirth ?? 3.5)
    const [erectLength, setErectLength] = useState(physicalDetails?.penisSize.erectLength ?? 5)
    const [erectGirth, setErectGirth] = useState(physicalDetails?.penisSize.erectGirth ?? 4.5)
    const [growerOrShower, setGrowerOrShower] = useState<'grower' | 'shower'>(physicalDetails?.penisSize.growerOrShower ?? 'grower')
    const [bodyType, setBodyType] = useState(physicalDetails?.bodyType ?? '')
    const [age, setAge] = useState(physicalDetails?.age ?? 25)
    const [orientation, setOrientation] = useState(physicalDetails?.orientation ?? '')
    const [gender, setGender] = useState(physicalDetails?.gender ?? '')

    const bucket = getSizeBucket(erectLength)

    const handleContinue = () => {
        setPhysicalDetails({
            penisSize: {
                flaccidLength,
                flaccidGirth,
                erectLength,
                erectGirth,
                growerOrShower,
            },
            bodyType,
            age,
            orientation,
            gender,
        })
        setStep(5)
        router.push('/onboarding/regimens')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[50%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">5/10</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Physical Details</h1>
                    <p className="text-text-secondary">
                        Measurements enable personalized SPH, cage sizing, and task calibration.
                    </p>
                </div>

                {/* Size Note */}
                <Card variant="flat" size="sm" className="!min-h-0">
                    <div className="flex items-start gap-3">
                        <Ruler size={18} className="text-purple-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-text-tertiary">
                            <span className="text-purple-primary font-semibold">Note:</span> Honest measurements produce better personalization.
                            The AI will use this data for SPH intensity calibration and task descriptions.
                        </p>
                    </div>
                </Card>

                {/* Flaccid Measurements */}
                <Card variant="raised" size="sm">
                    <h3 className="text-sm font-semibold mb-4">Flaccid Measurements</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-tertiary">Length</span>
                                <span className="text-text-primary font-mono">{flaccidLength}"</span>
                            </div>
                            <input
                                type="range"
                                min={1} max={8} step={0.25}
                                value={flaccidLength}
                                onChange={(e) => setFlaccidLength(parseFloat(e.target.value))}
                                className="w-full accent-purple-primary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-tertiary">Girth</span>
                                <span className="text-text-primary font-mono">{flaccidGirth}"</span>
                            </div>
                            <input
                                type="range"
                                min={2} max={7} step={0.25}
                                value={flaccidGirth}
                                onChange={(e) => setFlaccidGirth(parseFloat(e.target.value))}
                                className="w-full accent-purple-primary"
                            />
                        </div>
                    </div>
                </Card>

                {/* Erect Measurements */}
                <Card variant="raised" size="sm">
                    <h3 className="text-sm font-semibold mb-4">Erect Measurements</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-tertiary">Length</span>
                                <span className="text-text-primary font-mono">{erectLength}"</span>
                            </div>
                            <input
                                type="range"
                                min={2} max={10} step={0.25}
                                value={erectLength}
                                onChange={(e) => setErectLength(parseFloat(e.target.value))}
                                className="w-full accent-purple-primary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-tertiary">Girth</span>
                                <span className="text-text-primary font-mono">{erectGirth}"</span>
                            </div>
                            <input
                                type="range"
                                min={2} max={8} step={0.25}
                                value={erectGirth}
                                onChange={(e) => setErectGirth(parseFloat(e.target.value))}
                                className="w-full accent-purple-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs text-text-tertiary">Size Classification</span>
                            <span className={`text-sm font-bold font-mono ${bucket.color}`}>{bucket.label}</span>
                        </div>
                    </div>
                </Card>

                {/* Grower / Shower */}
                <Card variant="raised" size="sm">
                    <h3 className="text-sm font-semibold mb-3">Type</h3>
                    <div className="flex gap-3">
                        {(['grower', 'shower'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setGrowerOrShower(type)}
                                className={`flex-1 py-3 rounded-[var(--radius-lg)] text-sm font-medium transition-all cursor-pointer border ${growerOrShower === type
                                    ? 'bg-purple-primary text-white border-purple-primary'
                                    : 'bg-bg-tertiary border-white/5 text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Personal Details */}
                <Card variant="raised" size="sm">
                    <h3 className="text-sm font-semibold mb-4">Personal Details</h3>
                    <div className="space-y-4">
                        {/* Age */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-tertiary">Age</span>
                                <span className="text-text-primary font-mono">{age}</span>
                            </div>
                            <input
                                type="range"
                                min={18} max={80} step={1}
                                value={age}
                                onChange={(e) => setAge(parseInt(e.target.value))}
                                className="w-full accent-purple-primary"
                            />
                        </div>

                        {/* Body Type */}
                        <div>
                            <span className="text-xs text-text-tertiary block mb-2">Body Type</span>
                            <div className="flex flex-wrap gap-2">
                                {bodyTypes.map((bt) => (
                                    <button
                                        key={bt}
                                        onClick={() => setBodyType(bt)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${bodyType === bt
                                            ? 'bg-purple-primary text-white border-purple-primary'
                                            : 'bg-bg-tertiary border-white/5 text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        {bt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Orientation */}
                        <div>
                            <span className="text-xs text-text-tertiary block mb-2">Orientation</span>
                            <div className="flex flex-wrap gap-2">
                                {orientations.map((o) => (
                                    <button
                                        key={o}
                                        onClick={() => setOrientation(o)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${orientation === o
                                            ? 'bg-purple-primary text-white border-purple-primary'
                                            : 'bg-bg-tertiary border-white/5 text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <span className="text-xs text-text-tertiary block mb-2">Gender</span>
                            <div className="flex flex-wrap gap-2">
                                {genders.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${gender === g
                                            ? 'bg-purple-primary text-white border-purple-primary'
                                            : 'bg-bg-tertiary border-white/5 text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </div>
        </div>
    )
}
