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
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-white">
                    <Brain size={20} />
                    <h2 className="text-2xl font-bold font-mono">Psychological Profile</h2>
                </div>
                <p className="text-white/80 text-sm">
                    Answer honestly. This shapes how the AI responds to you.
                </p>
            </div>

            <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                {PSYCH_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                        <p className="text-sm text-white font-medium">
                            <span className="text-white/20 font-mono mr-2">{idx + 1}.</span>
                            {q.question}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {q.options.map((opt) => {
                                const isSelected = psychAnswers[q.id] === opt

                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setPsychAnswer(q.id, opt)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${isSelected
                                                ? 'bg-zinc-800/15 border-zinc-700 text-white'
                                                : 'bg-zinc-800/50 border-zinc-800 text-white/30 hover:border-zinc-800'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-center text-xs text-white/30">
                <span className="text-white font-semibold">{Object.keys(psychAnswers).length}</span> / {PSYCH_QUESTIONS.length} answered
            </p>
        </div>
    )
}
