"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { login } from "@/actions/auth";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const { error } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login(data);
      if (result?.error) error(result.error);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      error("An unexpected error occurred");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-200">Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      className="h-12 pl-10 text-base bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-200">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      className="h-12 pl-10 text-base bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Sign In
        </Button>

        <div className="pt-4 border-t border-slate-700 space-y-2">
          <p className="text-xs text-slate-400">Demo Credentials:</p>
          <p className="text-xs text-slate-500">
            Email: <span className="text-slate-300 font-mono">demo@example.com</span>
          </p>
          <p className="text-xs text-slate-500">
            Password: <span className="text-slate-300 font-mono">demo123</span>
          </p>
        </div>
      </form>
    </Form>
  );
}
