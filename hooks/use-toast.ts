"use client";

import { useState, useCallback } from "react";

type ToastVariant = "default" | "destructive" | "success" | "error";

interface ToastOptions {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const addToast = useCallback((options: Omit<ToastOptions, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...options, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options.duration || 5000);
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "success" });
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "error" });
    },
    [addToast],
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "default" });
    },
    [addToast],
  );

  return {
    toasts,
    success,
    error,
    info,
    addToast,
  };
}
