<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="() => {}"
      >
        <div
          class="glass rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-300"
        >
          <div class="text-center space-y-2">
            <h2
              class="text-3xl font-bold bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent"
            >
              Time to Look Back!
            </h2>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-dark-500">
                Enter your Name or Username
              </label>
              <input
                v-model="username"
                type="text"
                placeholder="Enter your name..."
                required
                class="w-full px-4 py-3 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95"
            >
              Let's Go!
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  submit: [username: string];
}>();

const username = ref("");

const handleSubmit = () => {
  if (username.value.trim()) {
    emit("submit", username.value.trim());
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
