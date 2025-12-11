import { useSearchParams } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import type { WizardStep } from '@/types/classCreation'

interface UseWizardNavigationReturn {
  currentStep: WizardStep
  classId: number | null
  completedSteps: number[]
  navigateToStep: (step: WizardStep, newClassId?: number) => void
  goToNextStep: () => void
  goToPrevStep: () => void
  markStepComplete: (step: number) => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * Hook for managing wizard navigation state
 * Uses URL params to persist current step and classId
 */
export function useWizardNavigation(initialClassId?: number | null): UseWizardNavigationReturn {
  const [searchParams, setSearchParams] = useSearchParams()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // Parse step from URL (default to 1)
  const currentStep = (parseInt(searchParams.get('step') || '1') as WizardStep) || 1

  // Parse classId from URL (nullable) or use initialClassId
  const paramClassId = searchParams.get('classId') ? parseInt(searchParams.get('classId')!) : null
  const classId = initialClassId ?? paramClassId

  /**
   * Navigate to specific step
   */
  const navigateToStep = useCallback(
    (step: WizardStep, newClassId?: number) => {
      const params = new URLSearchParams()
      params.set('step', step.toString())

      // Use newClassId if provided, otherwise use existing classId
      const idToUse = newClassId !== undefined ? newClassId : classId
      if (idToUse) {
        params.set('classId', idToUse.toString())
      }

      setSearchParams(params)
    },
    [classId, setSearchParams]
  )

  /**
   * Go to next step
   */
  const goToNextStep = useCallback(() => {
    if (currentStep < 5) {
      navigateToStep((currentStep + 1) as WizardStep)
    }
  }, [currentStep, navigateToStep])

  /**
   * Go to previous step
   */
  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      navigateToStep((currentStep - 1) as WizardStep)
    }
  }, [currentStep, navigateToStep])

  // Validate step is in range 1-5
  useEffect(() => {
    if (currentStep < 1 || currentStep > 5) {
      navigateToStep(1)
    }
  }, [currentStep, navigateToStep])

  /**
   * Mark a step as completed
   */
  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(step)) return prev
      return [...prev, step].sort((a, b) => a - b)
    })
  }, [])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 5

  return {
    currentStep,
    classId,
    completedSteps,
    navigateToStep,
    goToNextStep,
    goToPrevStep,
    markStepComplete,
    isFirstStep,
    isLastStep,
  }
}
