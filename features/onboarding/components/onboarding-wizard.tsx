"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { OnboardingStepOne } from "./onboarding-step-one";
import { OnboardingStepTwo } from "./onboarding-step-two";
import { OnboardingStepThree } from "./onboarding-step-three";
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

interface OnboardingWizardProps {
  user: {
    id: string;
    email?: string;
  };
}

const steps = [
  { id: 1, name: "Welcome", description: "Get started" },
  { id: 2, name: "Create Workspace", description: "Set up your business" },
  { id: 3, name: "Complete", description: "You're all set" },
];

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceData, setWorkspaceData] =
    useState<CreateWorkspaceFormValues | null>(null);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleWorkspaceData = (data: CreateWorkspaceFormValues) => {
    setWorkspaceData(data);
    handleNext();
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                    currentStep > step.id
                      ? "border-green-600 bg-green-600 text-white"
                      : currentStep === step.id
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-1 flex-1 ${
                    currentStep > step.id ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <OnboardingStepOne user={user} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <OnboardingStepTwo
              user={user}
              onNext={handleWorkspaceData}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStepThree workspaceData={workspaceData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
