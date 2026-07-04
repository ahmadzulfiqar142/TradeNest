"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup(data.email, data.password, data.fullName);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-green-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Check your email</h3>
          <p className="mt-2 text-sm text-slate-400">
            We sent you a verification link. Please verify your email to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-200"
          >
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            {...register("fullName")}
            disabled={isLoading}
            className="h-12 px-4 text-base bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.fullName && (
            <p className="text-sm text-red-400">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isLoading}
            className="h-12 px-4 text-base bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-200"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            {...register("password")}
            disabled={isLoading}
            className="h-12 px-4 text-base bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-200"
          >
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            disabled={isLoading}
            className="h-12 px-4 text-base bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <Button
        type="submit"
        className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
