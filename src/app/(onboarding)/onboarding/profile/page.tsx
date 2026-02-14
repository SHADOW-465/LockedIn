'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const questions = [
    { id: 'greatest_fear', label: 'What is your greatest fear?' },
    { id: 'why_here', label: 'Why are you here? What do you want LockedIn to do to you?' },
    { id: 'submission_realization', label: 'When did you realize you wanted to submit?' },
    { id: 'deepest_cut', label: 'What word cuts you deepest?' },
    { id: 'darkest_fantasy', label: 'Describe your darkest sexual fantasy.' },
]

export default function ProfilePage() {
    const router = useRouter()
    const { profileAnswers, addProfileAnswer, setStep } = useOnboarding()
    const [answers, setAnswers] = useState<Record<string, string>>(profileAnswers)

    const handleChange = (id: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [id]: value }))
    }

    const handleContinue = () => {
        Object.entries(answers).forEach(([q, a]) => {
            if (a.trim()) addProfileAnswer(q, a)
        })
        setStep(4)
        router.push('/onboarding/review')
    }

    const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[56%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">4/7</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Psychological Profile</h1>
                    <p className="text-text-secondary">
                        Your answers help the AI understand your vulnerabilities, motivations,
                        and how to break you most effectively.
                    </p>
                </div>

                {/* Warning */}
                <Card variant="flat" size="sm" className="!min-h-0">
                    <p className="text-xs text-text-tertiary">
                        <span className="text-purple-primary font-semibold">Note:</span> The AI
                        will use your answers against you during training. Be honest — the more
                        you reveal, the more personalized your suffering.
                    </p>
                </Card>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div
                            key={q.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                {q.label}
                            </label>
                            <textarea
                                value={answers[q.id] || ''}
                                onChange={(e) => handleChange(q.id, e.target.value)}
                                rows={3}
                                placeholder="Type your answer..."
                                className="w-full bg-bg-primary rounded-[var(--radius-lg)] px-4 py-3 shadow-inset text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-purple-primary/50 transition-all duration-200 resize-none"
                            />
                        </div>
                    ))}
                </div>

                <p className="text-xs text-text-tertiary text-center">
                    {answeredCount}/{questions.length} answered
                </p>

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
