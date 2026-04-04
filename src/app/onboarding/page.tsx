"use client";

import * as React from "react"
import { useRouter } from "next/navigation"
import { StepIndicator } from "@/components/onboarding/step-indicators"
import { 
  StepWorkspace, 
  StepSource, 
  StepTestEvent, 
  StepChannel, 
  StepPlaybook, 
  StepSuccess 
} from "@/components/onboarding/onboarding-steps"
import { createWorkspace, finishOnboarding } from "@/app/actions/onboarding"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [businessId, setBusinessId] = React.useState('')
  const [state, setState] = React.useState({
    workspace: null,
    source: '',
    testEvent: false,
    channel: '',
    playbook: '',
  })

  // Basic step advancement
  const nextStep = () => setStep(s => s + 1)
  
  // Handlers
  const handleWorkspace = async (data: any) => {
    setLoading(true)
    try {
      const { businessId: id } = await createWorkspace({
        name: data.name,
        type: data.type,
        timezone: data.timezone,
      })
      setBusinessId(id)
      setState(prev => ({ ...prev, workspace: data }))
      nextStep()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSource = (source: string) => {
    setState(prev => ({ ...prev, source }))
    nextStep()
  }

  const handleTestEvent = () => {
    setState(prev => ({ ...prev, testEvent: true }))
    nextStep()
  }

  const handleChannel = (channel: string) => {
    setState(prev => ({ ...prev, channel }))
    nextStep()
  }

  const handlePlaybook = async (playbook: string) => {
    setLoading(true)
    const newState = { ...state, playbook }
    setState(newState)
    try {
      if (businessId) {
        await finishOnboarding(businessId, {
          source: newState.source,
          channel: newState.channel,
          playbook: newState.playbook,
        })
      }
      nextStep()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12">
      {step < 6 && <StepIndicator currentStep={step} totalSteps={5} />}
      
      <div className="min-h-[400px]">
        {step === 1 && <StepWorkspace onNext={handleWorkspace} isLoading={loading} />}
        {step === 2 && <StepSource onNext={handleSource} />}
        {step === 3 && <StepTestEvent source={state.source} onNext={handleTestEvent} />}
        {step === 4 && <StepChannel onNext={handleChannel} />}
        {step === 5 && <StepPlaybook onNext={handlePlaybook} isLoading={loading} />}
        {step === 6 && <StepSuccess state={state} onFinish={() => router.push('/dashboard')} />}
      </div>
    </div>
  )
}
