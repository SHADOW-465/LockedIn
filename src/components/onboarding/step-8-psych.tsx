'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Brain } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const PSYCH_QUESTIONS = [
    {
        id: 'motivation',
        question: 'Why do you want to be locked?',
        options: ['Self-improvement', 'Kink/Fetish', 'Relationship dynamic', 'Challenge myself', 'Curiosity'],
    },
    {
        id: 'pain-tolerance',
        question: 'How do you respond to pain or discomfort?',
        options: ['Avoid it entirely', 'Tolerate when needed', 'Embrace it', 'Seek it out', 'Need it'],
    },
    {
        id: 'authority',
        question: 'How do you feel about authority over you?',
        options: ['Resist it', 'Accept it reluctantly', 'Enjoy structure', 'Crave control', 'Need absolute dominance'],
    },
    {
        id: 'humiliation',
        question: 'How do you handle humiliation?',
        options: ['Hate it', 'Tolerate light teasing', 'Find it exciting', 'Crave it', 'Need extreme degradation'],
    },
    {
        id: 'denial-response',
        question: 'After extended denial, how do you feel?',
        options: ['Frustrated & angry', 'Slightly frustrated', 'Focused & clear', 'Submissive & compliant', 'Desperate & devoted'],
    },
    {
        id: 'obedience',
        question: 'What best describes your obedience style?',
        options: ['Bratty & resistant', 'Conditionally obedient', 'Willing submissive', 'Eager to please', 'Total surrender'],
    },
    {
        id: 'failure-response',
        question: 'When you fail a task, you feel...',
        options: ['Indifferent', 'Mildly disappointed', 'Genuinely ashamed', 'Deeply guilty', 'Desperate to atone'],
    },
]

export default function PsychStep({ onValid }: StepProps) {
    const { psychAnswers, setPsychAnswer } = useOnboarding()

    useEffect(() => {
        const answered = Object.keys(psychAnswers).length
        onValid(answered >= PSYCH_QUESTIONS.length)
    }, [psychAnswers, onValid])

    return (
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-[var(--color-accent)] decoration-2">Baseline Analysis</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    ESTABLISH PSYCHOLOGICAL BOUNDARIES. HONESTY IS MANDATORY FOR SYSTEM STABILITY. DATA PERSISTENCE ENABLED.
                </p>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {PSYCH_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="space-y-4 border border-[#141414] bg-[#050505] p-6">
                        <div className="flex items-start gap-4">
                            <span className="text-[10px] font-mono font-bold text-[#444] bg-[#141414] px-1.5 py-0.5">
                                [{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}/{PSYCH_QUESTIONS.length}]
                            </span>
                            <p className="text-xs font-mono font-bold text-white uppercase tracking-widest leading-relaxed">
                                {q.question.toUpperCase()}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => {
                                const isSelected = psychAnswers[q.id] === opt

                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setPsychAnswer(q.id, opt)}
                                        className={`px-4 py-3 border text-[9px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer text-left ${isSelected
                                                ? 'bg-white border-white text-black'
                                                : 'bg-black border-[#141414] text-[#333] hover:border-[#444] hover:text-[#444]'
                                            }`}
                                    >
                                        {opt.toUpperCase()}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#141414] pt-8">
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 ${Object.keys(psychAnswers).length >= PSYCH_QUESTIONS.length ? 'bg-white' : 'bg-[var(--color-accent)]'}`} />
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-white opacity-40">ANALYSIS_STATUS: {Object.keys(psychAnswers).length >= PSYCH_QUESTIONS.length ? 'COMPLETE' : 'IN_PROGRESS'}</span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">
                    {Object.keys(psychAnswers).length} / {PSYCH_QUESTIONS.length} DATA_POINTS_CAPTURED
                </p>
            </div>
        </div>
    )
}
