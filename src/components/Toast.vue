<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'glass px-4 py-3 rounded-lg shadow-lg flex items-center gap-3',
            'animate-in slide-in-from-right duration-300',
            toastClasses[toast.type],
          ]"
        >
          <component :is="toastIcons[toast.type]" :size="20" />
          <span class="flex-1">{{ toast.message }}</span>
          <button
            @click="removeToast(toast.id)"
            class="hover:bg-white/10 rounded p-1 transition-colors"
          >
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, Info, X } from "lucide-vue-next";
import { useToast } from "../composables/useToast";

const { toasts, removeToast } = useToast();

const toastClasses = {
  success: "border-green-500/50 bg-green-500/10",
  error: "border-red-500/50 bg-red-500/10",
  info: "border-blue-500/50 bg-blue-500/10",
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
