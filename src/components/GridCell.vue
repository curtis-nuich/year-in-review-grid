<template>
  <div
    @click="$emit('click')"
    :class="[
      'aspect-square rounded-xl relative overflow-hidden cursor-pointer transition-all duration-200',
      'glass glass-hover shadow-sm',
      isSelected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white',
      cell.label === 'Best Anime' &&
        'ring-2 ring-yellow-500 ring-offset-2 ring-offset-white',
      !cell.image && 'hover:scale-105',
    ]"
  >
    <div
      v-if="!cell.image"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="text-center space-y-2">
        <Plus :size="32" class="mx-auto text-gray-400" />
        <p class="text-sm text-gray-500">Add Entry</p>
      </div>
    </div>

    <template v-else>
      <img
        :src="cell.imageBase64 || cell.image"
        :alt="cell.title"
        class="absolute inset-0 w-full h-full object-cover"
      />

      <div
        class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
      />

      <div class="absolute inset-0 p-3 flex flex-col justify-between">
        <div class="flex justify-end">
          <button
            @click.stop="$emit('clear')"
            class="p-1.5 bg-white/90 hover:bg-white rounded-full transition-colors shadow-sm"
          >
            <X :size="16" class="text-gray-700" />
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-if="cell.label"
            class="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 rounded-full text-xs font-semibold text-white"
          >
            {{ cell.label }}
          </div>
          <div class="bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
            <p class="text-sm font-semibold line-clamp-2 text-gray-900">
              {{ cell.title }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Plus, X } from "lucide-vue-next";
import type { Cell } from "../types";

defineProps<{
  cell: Cell;
  isSelected: boolean;
}>();

defineEmits<{
  click: [];
  clear: [];
}>();
</script>
