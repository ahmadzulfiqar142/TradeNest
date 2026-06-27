import { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Up | Business Management System",
  description: "Create a new account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container relative flex min-h-screen flex-col items-center justify-center py-10 lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side - Benefits */}
        <div className="relative hidden h-full flex-col bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          
          <div className="relative z-20 flex items-center gap-3 text-lg font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <span className="text-xl">Business Management</span>
          </div>

          <div className="relative z-20 mt-auto space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">
                Start managing your business in minutes
              </h2>
              <p className="text-lg text-white/90">
                Join thousands of businesses using our platform to streamline operations.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Complete Business Management</div>
                  <div className="text-sm text-white/80">
                    Products, inventory, sales, customers, and reports - all in one place
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Real-time Analytics</div>
                  <div className="text-sm text-white/80">
                    Track your business performance with live dashboards and reports
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Multi-user Support</div>
                  <div className="text-sm text-white/80">
                    Invite your team with role-based access control
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Secure & Reliable</div>
                  <div className="text-sm text-white/80">
                    Enterprise-grade security with automatic backups
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            {/* Mobile Logo */}
            <div className="flex justify-center lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 shadow-lg shadow-emerald-500/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-white"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Create your account
              </h1>
              <p className="text-base text-gray-600">
                Get started with your free account today
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
              <SignupForm />
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="px-8 text-center text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <Link href="#" className="underline hover:text-gray-900">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-gray-900">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
