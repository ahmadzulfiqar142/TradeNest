"use client";

import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

interface OnboardingStepFourProps {
  workspaceData: Partial<CreateWorkspaceFormValues>;
}

export function OnboardingStepFour({ workspaceData }: OnboardingStepFourProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white">You're All Set!</h2>
        <p className="mt-3 text-xl text-slate-400">
          Your workspace has been created successfully
        </p>
      </div>

      <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-6 shadow-sm space-y-4">
        <h4 className="text-lg font-semibold text-green-300">
          Workspace Details
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Workspace Name:</span>
            <span className="text-slate-200 font-medium">
              {workspaceData?.name || "Your Business"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Workspace URL:</span>
            <span className="text-slate-200 font-medium">
              yoursite.com/{workspaceData?.slug || "workspace"}
            </span>
          </div>
          {workspaceData?.businessEmail && (
            <div className="flex justify-between">
              <span className="text-slate-400">Business Email:</span>
              <span className="text-slate-200 font-medium">
                {workspaceData.businessEmail}
              </span>
            </div>
          )}
          {workspaceData?.businessPhone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="text-slate-200 font-medium">
                {workspaceData.businessPhone}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <h4 className="text-lg font-semibold text-white">What's Next?</h4>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium text-slate-200">
                Add Your First Product
              </p>
              <p className="text-slate-400 mt-1">
                Start building your product catalog with inventory tracking
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium text-slate-200">Invite Team Members</p>
              <p className="text-slate-400 mt-1">
                Collaborate with your team in real-time
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium text-slate-200">Explore Dashboard</p>
              <p className="text-slate-400 mt-1">
                Get insights with sales, inventory, and financial reports
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-300">Pro Tip</h4>
            <p className="mt-2 text-sm text-blue-200">
              You can always update your workspace settings, add more team
              members, and customize your dashboard from the Settings panel.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium shadow-lg"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
