"use client";

import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStepThreeProps {
  workspaceData: {
    name?: string;
    slug?: string;
  } | null;
}

export function OnboardingStepThree({ workspaceData }: OnboardingStepThreeProps) {
  const workspaceName = workspaceData?.name || "Your Workspace";

  const handleGoToDashboard = () => {
    window.location.href = "/";
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/50">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          🎉 Congratulations!
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Your workspace is ready to use
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Success Cards */}
        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">
                What's Next?
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Add your first product to the catalog
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Create customer profiles
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Start recording sales and managing inventory
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Invite team members to collaborate
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
          <h3 className="font-semibold text-blue-900">
            Your Dashboard is Ready
          </h3>
          <p className="mt-2 text-sm text-blue-800">
            Access your dashboard to view sales, manage products, track inventory, 
            and generate reports. Everything you need to run your business efficiently.
          </p>

        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button
          size="lg"
          onClick={handleGoToDashboard}
          className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 px-10 text-base font-semibold shadow-xl shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <p className="text-center text-xs text-gray-500">
        You can always access your workspace from the top navigation
      </p>
    </div>
  );
}
