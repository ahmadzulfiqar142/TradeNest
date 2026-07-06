"use client";

import { useState, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { OnboardingStepOne } from "./onboarding-step-one";
import { OnboardingStepTwo } from "./onboarding-step-two";
import { OnboardingStepThree } from "./onboarding-step-three";
import { OnboardingStepFour } from "./onboarding-step-four";
import { createWorkspaceOnboarding } from "@/actions/onboarding";
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

interface OnboardingWizardProps {
  user: {
    id: string;
    email?: string;
  };
}

const steps = [
  { id: 1, title: "Welcome to Business Management!", description: "" },
  { id: 2, title: "Company Details", description: "Tell us about your business" },
  { id: 3, title: "Contact Information", description: "Optional contact details" },
  { id: 4, title: "Workspace", description: "Configure your workspace" },
];

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<Partial<CreateWorkspaceFormValues>>({});
  const [isLoading, setIsLoading] = useState(false);
  const stepTwoTriggerSubmit = useRef<(() => void) | null>(null);
  const stepThreeTriggerSubmit = useRef<(() => void) | null>(null);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleWorkspaceData = (data: CreateWorkspaceFormValues) => {
    setWorkspaceData(data);
    handleNext();
  };

  const handleCreateWorkspace = async (data: CreateWorkspaceFormValues) => {
    setIsLoading(true);
    try {
      const result = await createWorkspaceOnboarding(data);
      if (result?.error) {
        console.error("Failed to create workspace:", result.error);
        setIsLoading(false);
        return;
      }
      setWorkspaceData(data);
      handleNext();
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      console.error("Unexpected error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step.id <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          Step {currentStep} of {steps.length}
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
        {/* Step Headers */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            {steps[currentStep - 1]?.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {steps[currentStep - 1]?.description}
          </p>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && <OnboardingStepOne user={user} onNext={handleNext} />}
          {currentStep === 2 && (
            <OnboardingStepTwo
              user={user}
              workspaceData={workspaceData}
              onNext={handleWorkspaceData}
              onBack={handleBack}
              onTriggerSubmit={(fn) => { stepTwoTriggerSubmit.current = fn; }}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStepThree
              user={user}
              workspaceData={workspaceData}
              onNext={handleCreateWorkspace}
              onBack={handleBack}
              onTriggerSubmit={(fn) => { stepThreeTriggerSubmit.current = fn; }}
            />
          )}
          {currentStep === 4 && <OnboardingStepFour workspaceData={workspaceData} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between pt-6 border-t border-border">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Skip
              </button>
            )}
            <button
              onClick={async () => {
                if (currentStep === 2 && stepTwoTriggerSubmit.current) {
                  await stepTwoTriggerSubmit.current();
                } else if (currentStep === 3 && stepThreeTriggerSubmit.current) {
                  await stepThreeTriggerSubmit.current();
                } else {
                  handleNext();
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Creating...</>
              ) : currentStep === 4 ? (
                <>Go to Dashboard <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
