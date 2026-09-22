'use client';
import { create } from 'zustand';

export type ToastKind = 'success' | 'info' | 'warning' | 'danger';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  text?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (t.kind !== 'info') {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3500);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper usable outside React. */
export const toast = {
  success: (title: string, text?: string) =>
    useToastStore.getState().push({ kind: 'success', title, text }),
  info: (title: string, text?: string) =>
    useToastStore.getState().push({ kind: 'info', title, text }),
  error: (title: string, text?: string) =>
    useToastStore.getState().push({ kind: 'danger', title, text }),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};
