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
        <div className="space-y-8">
            {/* Header */}
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-[var(--color-accent)] decoration-4">Safety Protocols</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    DEFINE BOUNDARIES. HARD_LIMITS [RED] ARE IMPERMEABLE. SOFT_LIMITS [WHITE] MAY BE NEGOTIATED BY THE SYSTEM.
                </p>
            </div>

            {/* Search + Custom Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH_PROTOCOL..."
                        className="w-full pl-12 pr-4 py-4 bg-black border border-[#141414] text-xs font-mono uppercase tracking-widest text-white placeholder:text-[#222] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                </div>
                <div className="flex bg-black border border-[#141414] focus-within:border-white transition-colors">
                    <input
                        type="text"
                        value={customLimit}
                        onChange={(e) => setCustomLimit(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                        placeholder="ADD_CUSTOM_ENTRY..."
                        className="flex-1 bg-transparent px-4 py-4 text-xs font-mono uppercase tracking-widest text-white placeholder:text-[#222] focus:outline-none"
                    />
                    <button
                        onClick={addCustom}
                        disabled={!customLimit.trim()}
                        className="px-6 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-[#141414] transition-all cursor-pointer"
                    >
                        INJECT
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCategories.map((cat) => {
                    const isExpanded = expandedCategories.has(cat.category)
                    const catHardCount = cat.items.filter((i) => hardLimits.includes(i)).length
                    const catSoftCount = cat.items.filter((i) => softLimits.includes(i)).length

                    return (
                        <div key={cat.category} className="border border-[#141414] bg-[#050505]">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(cat.category)}
                                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            >
                                <span className={`text-xs font-display font-bold uppercase tracking-[0.2em] ${isExpanded ? 'text-white' : 'text-[#444]'}`}>
                                    {cat.category}
                                </span>
                                <div className="flex items-center gap-4">
                                    {(catHardCount > 0 || catSoftCount > 0) && (
                                        <div className="flex gap-2">
                                            {catHardCount > 0 && <span className="text-[9px] font-mono p-1 bg-[var(--color-accent)] text-black font-bold uppercase tracking-tighter">H:{catHardCount}</span>}
                                            {catSoftCount > 0 && <span className="text-[9px] font-mono p-1 bg-white text-black font-bold uppercase tracking-tighter">S:{catSoftCount}</span>}
                                        </div>
                                    )}
                                    <span className="text-[#222] text-[10px] font-mono uppercase tracking-widest group-hover:text-white">
                                        [{isExpanded ? '-' : '+'}]
                                    </span>
                                </div>
                            </button>

                            {/* Items List */}
                            {isExpanded && (
                                <div className="border-t border-[#141414] divide-y divide-[#141414]">
                                    {cat.items.map((limit) => {
                                        const isHard = hardLimits.includes(limit)
                                        const isSoft = softLimits.includes(limit)

                                        return (
                                            <div
                                                key={limit}
                                                className={`flex items-center justify-between px-6 py-3 transition-colors ${isHard ? 'bg-[var(--color-accent)]/[0.03]' : isSoft ? 'bg-white/[0.02]' : ''}`}
                                            >
                                                <span className={`text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${isHard || isSoft ? 'text-white' : 'text-[#333]'}`}>
                                                    {limit}
                                                </span>

                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => isHard ? clearLimit(limit) : setAsHard(limit)}
                                                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${isHard
                                                                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-black'
                                                                : 'bg-black border-[#141414] text-[#222] hover:border-[#444] hover:text-[#444]'
                                                            }`}
                                                    >
                                                        HARD
                                                    </button>
                                                    <button
                                                        onClick={() => isSoft ? clearLimit(limit) : setAsSoft(limit)}
                                                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${isSoft
                                                                ? 'bg-white border-white text-black'
                                                                : 'bg-black border-[#141414] text-[#222] hover:border-[#444] hover:text-[#444]'
                                                            }`}
                                                    >
                                                        SOFT
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
                    <div className="border border-[#141414] bg-[#050505]">
                        <div className="px-6 py-4 border-b border-[#141414]">
                            <span className="text-xs font-display font-bold uppercase tracking-[0.2em] text-white">USER_DEFINED_PROTOCOLS</span>
                        </div>
                        <div className="divide-y divide-[#141414]">
                            {[...customHardLimits, ...customSoftLimits].map((limit) => {
                                const isHard = hardLimits.includes(limit)
                                const isSoft = softLimits.includes(limit)

                                return (
                                    <div key={limit} className="flex items-center justify-between px-6 py-3 bg-black/50">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white italic opacity-80">{limit}</span>
                                        <div className="flex gap-1 items-center">
                                            <button
                                                onClick={() => isHard ? clearLimit(limit) : setAsHard(limit)}
                                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${isHard ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-black' : 'bg-black border-[#141414] text-[#222]'}`}
                                            >
                                                HARD
                                            </button>
                                            <button
                                                onClick={() => isSoft ? clearLimit(limit) : setAsSoft(limit)}
                                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${isSoft ? 'bg-white border-white text-black' : 'bg-black border-[#141414] text-[#222]'}`}
                                            >
                                                SOFT
                                            </button>
                                            <button
                                                onClick={() => clearLimit(limit)}
                                                className="ml-2 text-[#333] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Summary Bar */}
            <div className="border-t border-[#141414] pt-8 grid grid-cols-2 gap-px bg-[#141414]">
                <div className="bg-black p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-[32px] font-display font-bold tracking-tighter leading-none text-[var(--color-accent)]">{hardLimits.length}</span>
                    <span className="text-[9px] font-mono font-bold tracking-[0.3em] uppercase opacity-40">HARD_LIMITS_ACTIVE</span>
                </div>
                <div className="bg-black p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-[32px] font-display font-bold tracking-tighter leading-none text-white">{softLimits.length}</span>
                    <span className="text-[9px] font-mono font-bold tracking-[0.3em] uppercase opacity-40">SOFT_LIMITS_LOGGED</span>
                </div>
            </div>
            
            <div className={`p-4 border ${hardLimits.length >= 1 ? 'border-white/10 bg-white/5' : 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'} transition-colors`}>
                <p className={`text-[10px] font-mono font-bold uppercase tracking-widest text-center ${hardLimits.length >= 1 ? 'text-[#444]' : 'text-[var(--color-accent)]'}`}>
                    {hardLimits.length >= 1 ? 'ADEQUATE PROTECTION_PROTOCOL_ACTIVE' : 'SYSTEM_WARNING: AT LEAST 01 HARD_LIMIT REQUIRED FOR STABILITY'}
                </p>
            </div>
        </div>
    )
}
    )
}
