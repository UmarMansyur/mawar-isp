// Toast notification utility
// Simple client-side toast system

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

let toasts: Toast[] = $state([]);
let toastId = 0;

export function getToasts() {
  return toasts;
}

export function showToast(message: string, type: ToastType = 'info', duration: number = 4000) {
  const id = ++toastId;
  const toast: Toast = { id, type, message, duration };

  toasts = [...toasts, toast];

  setTimeout(() => {
    removeToast(id);
  }, duration);

  return id;
}

export function removeToast(id: number) {
  toasts = toasts.filter(t => t.id !== id);
}

export const toast = {
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
};
