"use client";

import { Sparkles, Package, Users, TrendingUp } from "lucide-react";

interface OnboardingStepOneProps {
  user: { id: string; email?: string };
  onNext: () => void;
}

export function OnboardingStepOne({ user, onNext }: OnboardingStepOneProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="mb-6 text-xl text-muted-foreground">
          Hi{" "}
          <span className="font-semibold text-primary">
            {user.email?.split("@")[0]}
          </span>
          ! Let's set up your business in just 2 minutes.
        </p>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="group rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-green-500 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 transition-all group-hover:scale-110">
            <Package className="h-7 w-7 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Manage Products</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Track inventory, pricing, and stock levels effortlessly
          </p>
        </div>

        <div className="group rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-purple-500 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 transition-all group-hover:scale-110">
            <Users className="h-7 w-7 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Track Customers</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage customer accounts and credit seamlessly
          </p>
        </div>

        <div className="group rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-orange-500 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 transition-all group-hover:scale-110">
            <TrendingUp className="h-7 w-7 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Generate Reports</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get insights with sales, profit, and inventory analytics
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h4 className="text-lg font-semibold text-primary">
          What you'll create in the next step:
        </h4>
        <ul className="mt-4 space-y-3 text-sm text-foreground">
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              1
            </div>
            Your workspace (business account)
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              2
            </div>
            Business profile with contact information
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              3
            </div>
            Access to dashboard and all features
          </li>
        </ul>
      </div>

      <p className="text-center text-sm text-muted-foreground pt-6">
        Takes less than 2 minutes • Free to start
      </p>
    </div>
  );
}
