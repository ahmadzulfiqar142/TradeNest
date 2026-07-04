"use client";

import { Users } from "lucide-react";

interface OnboardingStepFiveProps {
  user: {
    id: string;
    email?: string;
  };
}

export function OnboardingStepFive({ user }: OnboardingStepFiveProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-white">
          Ready to invite team members?
        </h4>
        <p className="text-slate-300 text-sm">
          You can skip this for now and invite team members later from the Team
          section in your dashboard. Each team member will have their own login
          and can collaborate with you in real-time.
        </p>
        <button className="w-full px-4 py-2.5 bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-colors font-medium">
          Invite Team Members
        </button>
      </div>
    </div>
  );
}
