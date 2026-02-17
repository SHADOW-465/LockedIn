'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect, useState } from 'react'
import { ShieldOff, ShieldCheck, Search, Plus, X } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

/* ─── Comprehensive Limit Categories ─────────────────────────── */
const LIMIT_CATEGORIES: { category: string; items: string[] }[] = [
    {
        category: 'Physical Safety',
        items: [
            'Blood/Gore', 'Breath Play', 'Choking', 'Needle Play', 'Extreme Pain',
            'Punching/Kicking', 'Knife/Edge Play', 'Fire Play', 'Electrical Play',
            'Suspension Bondage', 'Waterboarding', 'Sleep Deprivation',
            'Starvation/Dehydration', 'Permanent Marks/Scarring', 'Branding',
        ],
    },
    {
        category: 'Bodily Functions',
        items: [
            'Scat', 'Vomit', 'Watersports/Urine', 'Enemas', 'Spitting',
            'Menstrual Play', 'Snot/Mucus',
        ],
    },
    {
        category: 'Sexual Boundaries',
        items: [
            'Forced Bi (Real)', 'Forced Feminization', 'Sissification',
            'Cuckolding', 'Orgasm Denial (Extended)', 'Permanent Chastity',
            'CBT (Cock & Ball Torture)', 'Sounding', 'Fisting',
            'Large Insertions', 'Prostate Play', 'Nipple Torture',
            'Genital Modification', 'Milking/Ruined Orgasms',
        ],
    },
    {
        category: 'Psychological',
        items: [
            'Humiliation (Public)', 'Humiliation (Private)', 'Degradation',
            'Name-Calling', 'Body Shaming', 'Small Penis Humiliation',
            'Gaslighting', 'Mind Control/Hypnosis', 'Objectification',
            'Dehumanization', 'Crying/Emotional Distress', 'Fear Play',
            'Isolation/Sensory Deprivation',
        ],
    },
    {
        category: 'Social/Real-World',
        items: [
            'Public Exposure (Real)', 'Blackmail (Real)', 'Family Involvement',
            'Workplace Involvement', 'Social Media Exposure',
            'Financial Domination/Ruin', 'Contract/Legal Play',
            'Public Tasks (Visible)', 'Involving Non-Consenting Others',
            'Outing/Identity Exposure',
        ],
    },
    {
        category: 'Identity & Roleplay',
        items: [
            'Age Play', 'Incest References', 'Bestiality/Animal Play',
            'Pet Play', 'Race Play', 'Religious Play', 'Nazi/Political Play',
            'Kidnapping/Abduction RP', 'Non-Consent RP', 'Gore Fantasy',
            'Snuff Fantasy', 'Forced Intoxication',
        ],
    },
    {
        category: 'Physical Tasks',
        items: [
            'Body Writing', 'Wearing Toys in Public', 'Exercise Punishment',
            'Cold Exposure (Ice)', 'Hot Wax', 'Corner Time',
            'Kneeling for Long Periods', 'Bondage Self-Tie',
            'Cock Cage Sizing Down', 'Wearing Female Clothing',
            'Shaving Body Hair', 'Dietary Restrictions',
        ],
    },
]

/* Flatten all items for search */
const ALL_LIMITS = LIMIT_CATEGORIES.flatMap((c) => c.items)

export default function LimitsStep({ onValid }: StepProps) {
    const { hardLimits, softLimits, setHardLimits, setSoftLimits } = useOnboarding()
    const [customLimit, setCustomLimit] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(LIMIT_CATEGORIES.map((c) => c.category))
    )

    useEffect(() => {
        onValid(hardLimits.length >= 1)
    }, [hardLimits, onValid])

    const setAsHard = (limit: string) => {
        setSoftLimits(softLimits.filter((l) => l !== limit))
        if (!hardLimits.includes(limit)) {
            setHardLimits([...hardLimits, limit])
        }
    }

    const setAsSoft = (limit: string) => {
        setHardLimits(hardLimits.filter((l) => l !== limit))
        if (!softLimits.includes(limit)) {
            setSoftLimits([...softLimits, limit])
        }
    }

    const clearLimit = (limit: string) => {
        setHardLimits(hardLimits.filter((l) => l !== limit))
        setSoftLimits(softLimits.filter((l) => l !== limit))
    }

    const addCustom = () => {
        const trimmed = customLimit.trim()
        if (trimmed && !hardLimits.includes(trimmed) && !softLimits.includes(trimmed) && !ALL_LIMITS.includes(trimmed)) {
            setHardLimits([...hardLimits, trimmed])
            setCustomLimit('')
        }
    }

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev)
            if (next.has(category)) next.delete(category)
            else next.add(category)
            return next
        })
    }

    /* Filter by search */
    const filteredCategories = LIMIT_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter((cat) => cat.items.length > 0)

    /* Custom limits (user-added ones not in presets) */
    const customHardLimits = hardLimits.filter((l) => !ALL_LIMITS.includes(l))
    const customSoftLimits = softLimits.filter((l) => !ALL_LIMITS.includes(l))
    const hasCustomLimits = customHardLimits.length > 0 || customSoftLimits.length > 0

    return (
        <div className="space-y-5 max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Set Your Limits</h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                    <span className="text-red-primary font-semibold">Hard limits</span> are NEVER crossed.{' '}
                    <span className="text-purple-primary font-semibold">Soft limits</span> may be gently pushed.
                    <br />
                    <span className="text-text-disabled text-xs">Click <strong>Hard</strong> or <strong>Soft</strong> for each item. At least 1 hard limit required.</span>
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search limits..."
                    className="w-full pl-8 pr-4 py-2.5 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-purple-primary/40 transition-colors"
                />
            </div>

            {/* Categories List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {filteredCategories.map((cat) => {
                    const isExpanded = expandedCategories.has(cat.category)
                    const catHardCount = cat.items.filter((i) => hardLimits.includes(i)).length
                    const catSoftCount = cat.items.filter((i) => softLimits.includes(i)).length

                    return (
                        <div key={cat.category} className="rounded-[var(--radius-lg)] border border-white/5 overflow-hidden bg-bg-secondary/40">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(cat.category)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-bg-hover/40 transition-colors cursor-pointer"
                            >
                                <span className="text-sm font-semibold text-text-primary">{cat.category}</span>
                                <div className="flex items-center gap-2">
                                    {catHardCount > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-primary/15 text-red-primary font-medium">
                                            {catHardCount} hard
                                        </span>
                                    )}
                                    {catSoftCount > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-primary/15 text-purple-primary font-medium">
                                            {catSoftCount} soft
                                        </span>
                                    )}
                                    <span className="text-text-disabled text-xs">{isExpanded ? '▲' : '▼'}</span>
                                </div>
                            </button>

                            {/* Items List */}
                            {isExpanded && (
                                <div className="border-t border-white/5">
                                    {cat.items.map((limit) => {
                                        const isHard = hardLimits.includes(limit)
                                        const isSoft = softLimits.includes(limit)

                                        return (
                                            <div
                                                key={limit}
                                                className={`flex items-center justify-between px-4 py-2 border-b border-white/[0.03] last:border-b-0 transition-colors ${isHard
                                                        ? 'bg-red-primary/[0.04]'
                                                        : isSoft
                                                            ? 'bg-purple-primary/[0.04]'
                                                            : ''
                                                    }`}
                                            >
                                                {/* Label */}
                                                <span className={`text-xs font-medium ${isHard
                                                        ? 'text-red-primary'
                                                        : isSoft
                                                            ? 'text-purple-primary'
                                                            : 'text-text-secondary'
                                                    }`}>
                                                    {limit}
                                                </span>

                                                {/* Buttons */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => isHard ? clearLimit(limit) : setAsHard(limit)}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${isHard
                                                                ? 'bg-red-primary text-white shadow-sm shadow-red-primary/25'
                                                                : 'bg-bg-tertiary/60 text-text-disabled hover:bg-red-primary/20 hover:text-red-primary'
                                                            }`}
                                                    >
                                                        Hard
                                                    </button>
                                                    <button
                                                        onClick={() => isSoft ? clearLimit(limit) : setAsSoft(limit)}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${isSoft
                                                                ? 'bg-purple-primary text-white shadow-sm shadow-purple-primary/25'
                                                                : 'bg-bg-tertiary/60 text-text-disabled hover:bg-purple-primary/20 hover:text-purple-primary'
                                                            }`}
                                                    >
                                                        Soft
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Custom Limits Section */}
                {hasCustomLimits && (
                    <div className="rounded-[var(--radius-lg)] border border-white/5 overflow-hidden bg-bg-secondary/40">
                        <div className="px-4 py-2.5">
                            <span className="text-sm font-semibold text-text-primary">Custom Limits</span>
                        </div>
                        <div className="border-t border-white/5">
                            {[...customHardLimits, ...customSoftLimits].map((limit) => {
                                const isHard = hardLimits.includes(limit)
                                const isSoft = softLimits.includes(limit)

                                return (
                                    <div
                                        key={limit}
                                        className={`flex items-center justify-between px-4 py-2 border-b border-white/[0.03] last:border-b-0 transition-colors ${isHard ? 'bg-red-primary/[0.04]' : 'bg-purple-primary/[0.04]'
                                            }`}
                                    >
                                        <span className={`text-xs font-medium ${isHard ? 'text-red-primary' : 'text-purple-primary'
                                            }`}>
                                            {limit}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => isHard ? clearLimit(limit) : setAsHard(limit)}
                                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${isHard
                                                        ? 'bg-red-primary text-white shadow-sm shadow-red-primary/25'
                                                        : 'bg-bg-tertiary/60 text-text-disabled hover:bg-red-primary/20 hover:text-red-primary'
                                                    }`}
                                            >
                                                Hard
                                            </button>
                                            <button
                                                onClick={() => isSoft ? clearLimit(limit) : setAsSoft(limit)}
                                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${isSoft
                                                        ? 'bg-purple-primary text-white shadow-sm shadow-purple-primary/25'
                                                        : 'bg-bg-tertiary/60 text-text-disabled hover:bg-purple-primary/20 hover:text-purple-primary'
                                                    }`}
                                            >
                                                Soft
                                            </button>
                                            <button
                                                onClick={() => clearLimit(limit)}
                                                className="p-1 rounded-md text-text-disabled hover:text-red-primary hover:bg-red-primary/10 transition-colors cursor-pointer"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Limit Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
                    <input
                        type="text"
                        value={customLimit}
                        onChange={(e) => setCustomLimit(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                        placeholder="Add a custom limit..."
                        className="w-full pl-8 pr-4 py-2.5 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-red-primary/40 transition-colors"
                    />
                </div>
                <button
                    onClick={addCustom}
                    disabled={!customLimit.trim()}
                    className="px-4 py-2.5 rounded-[var(--radius-lg)] bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Add
                </button>
            </div>

            {/* Summary */}
            {(hardLimits.length > 0 || softLimits.length > 0) && (
                <div className="flex items-center gap-4 justify-center text-xs">
                    {hardLimits.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <ShieldOff size={13} className="text-red-primary" />
                            <span className="text-text-secondary">
                                <span className="text-red-primary font-semibold">{hardLimits.length}</span> hard
                            </span>
                        </div>
                    )}
                    {softLimits.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-purple-primary" />
                            <span className="text-text-secondary">
                                <span className="text-purple-primary font-semibold">{softLimits.length}</span> soft
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
