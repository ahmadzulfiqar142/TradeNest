"use client";

import { useState, useEffect, useCallback } from "react";

type ToastVariant = "default" | "destructive" | "success" | "error";

interface ToastOptions {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (toasts: ToastOptions[]) => void;

// Global singleton store
let toasts: ToastOptions[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

function addToast(options: Omit<ToastOptions, "id">) {
  const id = Date.now().toString();
  toasts = [...toasts, { ...options, id }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, options.duration ?? 5000);
}

export const toast = {
  success: (title: string, description?: string) =>
    addToast({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    addToast({ title, description, variant: "error" }),
  info: (title: string, description?: string) =>
    addToast({ title, description, variant: "default" }),
};

export function useToast() {
  const [state, setState] = useState<ToastOptions[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  const success = useCallback((title: string, description?: string) =>
    addToast({ title, description, variant: "success" }), []);

  const error = useCallback((title: string, description?: string) =>
    addToast({ title, description, variant: "error" }), []);

  const info = useCallback((title: string, description?: string) =>
    addToast({ title, description, variant: "default" }), []);

  return { toasts: state, success, error, info };
}
