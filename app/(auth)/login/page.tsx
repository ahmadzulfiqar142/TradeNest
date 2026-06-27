import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login | Business Management System",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container relative flex min-h-screen flex-col items-center justify-center py-10 lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side - Branding */}
        <div className="relative hidden h-full flex-col bg-[#0F172A] p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] to-[#1E293B]" />
          
          <div className="relative z-20 flex items-center gap-3 text-lg font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]">
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
            <span className="text-xl font-bold">Business Management</span>
          </div>

          <div className="relative z-20 mt-auto space-y-8">
            <blockquote className="space-y-4">
              <p className="text-2xl font-medium leading-relaxed text-[#F8FAFC]">
                "This platform has completely transformed how we manage our business. 
                Everything is organized, efficient, and accessible."
              </p>
              <footer className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]">
                  <span className="text-lg font-semibold">AZ</span>
                </div>
                <div>
                  <div className="font-semibold text-[#F8FAFC]">Ahmad Zulfiqar</div>
                  <div className="text-sm text-[#94A3B8]">Business Owner</div>
                </div>
              </footer>
            </blockquote>

            <div className="grid grid-cols-3 gap-4 rounded-xl border border-[#334155] bg-[#1E293B] p-6">
              <div>
                <div className="text-3xl font-bold text-[#F8FAFC]">1000+</div>
                <div className="text-sm text-[#94A3B8]">Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#F8FAFC]">99.9%</div>
                <div className="text-sm text-[#94A3B8]">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#F8FAFC]">24/7</div>
                <div className="text-sm text-[#94A3B8]">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            {/* Mobile Logo */}
            <div className="flex justify-center lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg">
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
              <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
                Welcome back
              </h1>
              <p className="text-base text-[#64748B]">
                Enter your credentials to access your account
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <LoginForm />
            </div>

            <p className="text-center text-sm text-[#64748B]">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                Sign up for free
              </Link>
            </p>

            <p className="px-8 text-center text-xs text-[#94A3B8]">
              By continuing, you agree to our{" "}
              <Link href="#" className="underline hover:text-[#64748B]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-[#64748B]">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
