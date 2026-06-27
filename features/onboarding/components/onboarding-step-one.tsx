"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Package, Users, TrendingUp, ArrowRight } from "lucide-react";

interface OnboardingStepOneProps {
  user: {
    id: string;
    email?: string;
  };
  onNext: () => void;
}

export function OnboardingStepOne({ user, onNext }: OnboardingStepOneProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900">
          Welcome to Business Management!
        </h2>
        <p className="mt-3 text-xl text-gray-600">
          Hi <span className="font-semibold text-blue-600">{user.email?.split("@")[0]}</span>! 
          Let's set up your business in just 2 minutes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-green-300 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 transition-all group-hover:scale-110">
            <Package className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Manage Products</h3>
          <p className="mt-2 text-sm text-gray-600">
            Track inventory, pricing, and stock levels effortlessly
          </p>
        </div>

        <div className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-purple-300 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 transition-all group-hover:scale-110">
            <Users className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Track Customers</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage customer accounts and credit seamlessly
          </p>
        </div>

        <div className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-orange-300 hover:shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 transition-all group-hover:scale-110">
            <TrendingUp className="h-7 w-7 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Generate Reports</h3>
          <p className="mt-2 text-sm text-gray-600">
            Get insights with sales, profit, and inventory analytics
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-blue-900">What you'll create in the next step:</h4>
        <ul className="mt-4 space-y-3 text-sm text-blue-800">
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
              1
            </div>
            Your workspace (business account)
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
              2
            </div>
            Business profile with contact information
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
              3
            </div>
            Access to dashboard and all features
          </li>
        </ul>
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          onClick={onNext} 
          size="lg" 
          className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 px-12 text-lg font-semibold shadow-xl shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Takes less than 2 minutes • Free to start
      </p>
    </div>
  );
}
