<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        @click.self="$emit('close')"
      >
        <div
          class="glass rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-in zoom-in-95 duration-300"
        >
          <div
            class="flex items-center justify-between p-6 border-b border-white/10"
          >
            <h2 class="text-2xl font-bold">Add Entry</h2>
            <button
              @click="$emit('close')"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            <div class="space-y-3">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <span
                  class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-xs"
                  >1</span
                >
                Choose a Label
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="label in availableLabels"
                  :key="label"
                  @click="selectedLabel = label"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    selectedLabel === label
                      ? 'bg-primary-600 scale-105'
                      : 'glass glass-hover',
                  ]"
                >
                  {{ label }}
                </button>
              </div>

              <form @submit.prevent="handleCustomLabel" class="flex gap-2">
                <input
                  v-model="customLabel"
                  type="text"
                  placeholder="Or create custom label..."
                  class="flex-1 px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <button
                  type="submit"
                  :disabled="!customLabel.trim()"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                >
                  Use
                </button>
              </form>

              <div
                v-if="selectedLabel"
                class="flex items-center gap-2 p-3 glass rounded-lg"
              >
                <span class="text-sm text-dark-300">Selected label:</span>
                <span
                  class="px-3 py-1 bg-primary-600 rounded-full text-sm font-semibold"
                >
                  {{ selectedLabel }}
                </span>
                <button
                  @click="selectedLabel = ''"
                  class="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>

            <div v-if="selectedLabel" class="space-y-3">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <span
                  class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-xs"
                  >2</span
                >
                Add Content
              </h3>

              <div class="flex gap-2 p-1 glass rounded-lg">
                <button
                  @click="activeTab = 'search'"
                  :class="[
                    'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                    activeTab === 'search'
                      ? 'bg-primary-600'
                      : 'hover:bg-white/5',
                  ]"
                >
                  Search Anime
                </button>
                <button
                  @click="activeTab = 'custom'"
                  :class="[
                    'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                    activeTab === 'custom'
                      ? 'bg-primary-600'
                      : 'hover:bg-white/5',
                  ]"
                >
                  Custom Entry
                </button>
              </div>

              <div v-if="activeTab === 'search'" class="space-y-3">
                <div class="relative flex-1">
                  <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
                    :size="20"
                  />
                  <input
                    v-model="searchTerm"
                    type="text"
                    placeholder="Start typing to search anime..."
                    class="w-full pl-10 pr-4 py-2 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div
                  v-if="hasSearched"
                  class="glass rounded-lg max-h-60 overflow-y-auto"
                >
                  <div v-if="isLoading" class="p-8 text-center text-dark-400">
                    <Loader2 class="animate-spin mx-auto mb-2" :size="32" />
                    <p>Searching...</p>
                  </div>
                  <div
                    v-else-if="searchResults.length === 0"
                    class="p-8 text-center text-dark-400"
                  >
                    No results found
                  </div>
                  <div v-else class="divide-y divide-white/5">
                    <button
                      v-for="anime in searchResults"
                      :key="anime.id"
                      @click="handleAnimeSelect(anime)"
                      class="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <img
                        :src="anime.image"
                        :alt="anime.title"
                        class="w-12 h-12 object-cover rounded"
                        referrerpolicy="no-referrer"
                      />
                      <span class="flex-1">{{ anime.title }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="space-y-3">
                <div
                  @click="triggerFileInput"
                  class="border-2 border-dashed border-white/20 hover:border-primary-500 rounded-lg p-8 text-center cursor-pointer transition-all min-h-[200px] flex items-center justify-center"
                >
                  <div v-if="!customImage" class="text-dark-400">
                    <ImagePlus :size="48" class="mx-auto mb-3" />
                    <p class="font-medium">Click to upload image</p>
                    <p class="text-sm">JPG, PNG, or GIF</p>
                  </div>
                  <img
                    v-else
                    :src="customImage"
                    alt="Custom upload"
                    class="max-h-40 rounded-lg"
                  />
                </div>

                <input
                  v-model="customTitle"
                  type="text"
                  placeholder="Enter title..."
                  class="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />

                <button
                  @click="handleCustomSubmit"
                  :disabled="!customImage || !customTitle"
                  class="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                >
                  Add to Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { X, Search, ImagePlus, Loader2 } from "lucide-vue-next";
import { searchAnime, DEFAULT_LABELS } from "../utils/anime";
import type { AnimeResult, GridSize } from "../types";

const props = defineProps<{
  isOpen: boolean;
  gridSize: GridSize;
  usedLabels: string[];
}>();

const emit = defineEmits<{
  close: [];
  select: [anime: AnimeResult, label: string];
}>();

const activeTab = ref<"search" | "custom">("search");
const selectedLabel = ref("");
const customLabel = ref("");

const searchTerm = ref("");
const searchResults = ref<AnimeResult[]>([]);
const isLoading = ref(false);
const hasSearched = ref(false);

const customImage = ref<string | null>(null);
const customTitle = ref("");

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const availableLabels = computed(() => {
  return DEFAULT_LABELS.slice(0, props.gridSize === 3 ? 9 : 16);
});

const handleCustomLabel = () => {
  if (customLabel.value.trim()) {
    selectedLabel.value = customLabel.value.trim();
    customLabel.value = "";
  }
};

const handleSearch = async () => {
  if (!searchTerm.value.trim()) {
    searchResults.value = [];
    hasSearched.value = false;
    return;
  }

  isLoading.value = true;
  hasSearched.value = true;
  try {
    searchResults.value = await searchAnime(searchTerm.value);
  } catch (error) {
    console.error("Search failed:", error);
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch(searchTerm, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!newValue.trim()) {
    searchResults.value = [];
    hasSearched.value = false;
    return;
  }

  searchTimeout = setTimeout(() => {
    handleSearch();
  }, 500);
});

const handleAnimeSelect = (anime: AnimeResult) => {
  if (!selectedLabel.value) return;
  emit("select", anime, selectedLabel.value);
  resetForm();
};

const triggerFileInput = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        customImage.value = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};

const handleCustomSubmit = () => {
  if (!customImage.value || !customTitle.value.trim() || !selectedLabel.value)
    return;

  const customAnime: AnimeResult = {
    id: Date.now(),
    title: customTitle.value.trim(),
    image: customImage.value,
  };

  emit("select", customAnime, selectedLabel.value);
  resetForm();
};

const resetForm = () => {
  selectedLabel.value = "";
  customLabel.value = "";
  searchTerm.value = "";
  searchResults.value = [];
  hasSearched.value = false;
  customImage.value = null;
  customTitle.value = "";
  activeTab.value = "search";
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  }
);
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
