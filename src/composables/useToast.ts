import { ref } from "vue";

interface Toast {
  message: string;
  type: "success" | "error" | "info";
  id: number;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast() {
  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = toastId++;
    toasts.value.push({ message, type, id });

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 3000);
  };

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    showToast,
    removeToast,
  };
}
