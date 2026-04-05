"use client";

import * as React from "react"
import { useRouter } from "next/navigation"
import { StepIndicator } from "@/components/onboarding/step-indicators"
import { 
  StepWorkspace,
  StepUseCase,
  StepConnections,
  StepPlaybook,
  StepSuccess
} from "@/components/onboarding/onboarding-steps"
import { createWorkspace } from "@/lib/actions/auth-actions"
import { submitOnboarding } from "@/app/actions/onboarding"
import { getOnboardingState, saveSource, saveChannel, savePlaybook } from "@/app/actions/onboarding-state"

export default function OnboardingPage() {
  const router = useRouter()
  const [init, setInit] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [businessId, setBusinessId] = React.useState('')
  const [state, setState] = React.useState({
    workspace: null as any,
    source: '',
    testEvent: false,
    channel: '',
    playbook: '',
  })

  // Load persistence
  React.useEffect(() => {
    getOnboardingState().then((res) => {
      if (res.businessId) setBusinessId(res.businessId)
      setStep(res.step)
      setState(prev => ({ ...prev, ...(res.state as any) }))
      setInit(true)
    }).catch(e => {
      console.error(e)
      setInit(true)
    })
  }, [])

  // Basic step advancement
  const nextStep = () => setStep(s => s + 1)
  
  // Handlers
  const handleWorkspace = async (data: any) => {
    setLoading(true)
    try {
      const response = await createWorkspace({
        name: data.name,
        type: data.type,
        timezone: data.timezone,
      })
      
      if (response.error) {
         throw new Error(response.error);
      }
      
      setBusinessId(response.businessId!)
      setState(prev => ({ ...prev, workspace: data }))
      nextStep()
    } catch (e: any) {
      console.error("Workspace creation failed:", e)
      throw e;
    } finally {
      setLoading(false)
    }
  }

  const handleUseCase = async (useCase: string) => {
    setState(prev => ({ ...prev, useCase }))
    nextStep()
  }

  const handleConnections = async (connections: { source: string, channel: string }) => {
    setLoading(true);
    try {
      await saveSource(businessId, connections.source);
      await saveChannel(businessId, connections.channel);
      setState(prev => ({ ...prev, source: connections.source, channel: connections.channel }))
      nextStep()
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false);
    }
  }

  const handlePlaybook = async (playbook: string) => {
    setLoading(true)
    const newState = { ...state, playbook }
    setState(newState)
    try {
      if (businessId) {
        await savePlaybook(businessId, playbook);
      }
      nextStep() // Move to step 5 Launch
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!init) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="py-12">
      {step < 5 && <StepIndicator currentStep={step} totalSteps={4} />}
      
      <div className="min-h-[400px]">
        {step === 1 && <StepWorkspace onNext={handleWorkspace} isLoading={loading} />}
        {step === 2 && <StepUseCase onNext={handleUseCase} />}
        {step === 3 && <StepConnections onNext={handleConnections} isLoading={loading} />}
        {step === 4 && <StepPlaybook onNext={handlePlaybook} isLoading={loading} />}
        {step === 5 && <StepSuccess state={state} />}
      </div>
    </div>
  )
}
