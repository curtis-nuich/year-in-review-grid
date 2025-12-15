<template>
  <div class="min-h-screen bg-pattern bg-dots">
    <UsernameModal
      :is-open="showUsernameModal"
      @submit="handleUsernameSubmit"
    />

    <GridEntryModal
      :is-open="showGridModal"
      :grid-size="gridSize"
      :used-labels="usedLabels"
      @close="handleCloseGridModal"
      @select="handleEntrySelect"
    />

    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <header class="text-center mb-8 space-y-4">
        <h1
          class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
        >
          {{ username ? `${username}'s ` : "" }}Year in Review
        </h1>
      </header>

      <div class="glass rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
        <div class="flex items-center justify-center gap-4">
          <span class="text-sm text-gray-600">Grid Size:</span>
          <button
            v-for="size in [3, 4]"
            :key="size"
            @click="handleGridSizeChange(size as GridSize)"
            :class="[
              'px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-sm',
              gridSize === size
                ? 'bg-primary-600 text-white'
                : 'glass glass-hover text-gray-700',
            ]"
          >
            {{ size }}×{{ size }}
          </button>
        </div>
      </div>

      <div class="mb-8">
        <div
          :class="[
            'grid gap-3 mx-auto',
            gridSize === 3 ? 'max-w-2xl' : 'max-w-3xl',
          ]"
          :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }"
        >
          <GridCell
            v-for="(cell, index) in visibleCells"
            :key="cell.id"
            :cell="cell"
            :is-selected="selectedCellIndex === index"
            @click="handleCellClick(index)"
            @clear="handleClearCell(index)"
          />
        </div>
      </div>

      <div class="glass rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 class="text-lg font-semibold text-center text-gray-900">
          Share Your Year
        </h3>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="handleCopyToClipboard"
            :disabled="isCapturing"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 text-white shadow-sm"
          >
            <Loader2 v-if="isCapturing" class="animate-spin" :size="20" />
            <Clipboard v-else :size="20" />
            {{ isCapturing ? "Generating..." : "Copy to Clipboard" }}
          </button>
          <button
            @click="handleDownload"
            :disabled="isCapturing"
            class="flex items-center justify-center gap-2 px-6 py-3 glass glass-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 text-gray-700 shadow-sm"
          >
            <Download :size="20" />
            Save as Image
          </button>
        </div>
        <p class="text-center text-sm text-gray-500">
          Fill at least one cell to share your grid
        </p>
      </div>

      <footer class="mt-12 text-center text-sm text-gray-500 space-y-2">
        <p>Made by @Pesto808</p>
      </footer>
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Clipboard, Download, Loader2 } from "lucide-vue-next";
import GridCell from "./components/GridCell.vue";
import GridEntryModal from "./components/GridEntryModal.vue";
import UsernameModal from "./components/UsernameModal.vue";
import Toast from "./components/Toast.vue";
import { useToast } from "./composables/useToast";
import { convertImageToBase64 } from "./utils/anime";
import { captureGridAsImage } from "./utils/capture";
import type { Cell, GridSize, AnimeResult } from "./types";

const { showToast } = useToast();

const username = ref("");
const showUsernameModal = ref(true);
const showGridModal = ref(false);
const gridSize = ref<GridSize>(3);
const selectedCellIndex = ref<number | null>(null);
const isCapturing = ref(false);

const cells = ref<Cell[]>(
  Array.from({ length: 16 }, (_, i) => ({
    id: i,
    image: null,
    imageBase64: null,
    title: "",
    label: "",
  }))
);

const totalCells = computed(() => gridSize.value * gridSize.value);
const visibleCells = computed(() => cells.value.slice(0, totalCells.value));
const filledCells = computed(
  () => visibleCells.value.filter((c) => c.image).length
);
const usedLabels = computed(() =>
  visibleCells.value.map((c) => c.label).filter(Boolean)
);

const handleUsernameSubmit = (name: string) => {
  username.value = name;
  showUsernameModal.value = false;
};

const handleCellClick = (index: number) => {
  selectedCellIndex.value = index;
  showGridModal.value = true;
};

const handleCloseGridModal = () => {
  showGridModal.value = false;
  selectedCellIndex.value = null;
};

const handleEntrySelect = async (anime: AnimeResult, label: string) => {
  if (selectedCellIndex.value === null) return;

  try {
    let imageBase64: string | null = null;
    if (anime.image.startsWith("http")) {
      try {
        imageBase64 = await convertImageToBase64(anime.image);
      } catch (error) {
        console.warn("Failed to convert to base64, using original URL", error);
      }
    } else {
      imageBase64 = anime.image;
    }

    cells.value[selectedCellIndex.value] = {
      ...cells.value[selectedCellIndex.value],
      image: anime.image,
      imageBase64,
      title: anime.title,
      label,
    };

    showGridModal.value = false;
    selectedCellIndex.value = null;
    showToast("Entry added successfully!", "success");
  } catch (error) {
    console.error("Failed to add entry:", error);
    showToast("Failed to add entry. Please try again.", "error");
  }
};

const handleClearCell = (index: number) => {
  cells.value[index] = {
    ...cells.value[index],
    image: null,
    imageBase64: null,
    title: "",
    label: "",
  };
  showToast("Entry removed", "info");
};

const handleGridSizeChange = (size: GridSize) => {
  if (size < gridSize.value) {
    const cellsToLose = cells.value.slice(
      size * size,
      gridSize.value * gridSize.value
    );
    const hasFilledCells = cellsToLose.some((c) => c.image);

    if (hasFilledCells) {
      if (
        !confirm(
          "Changing to a smaller grid will remove some entries. Continue?"
        )
      ) {
        return;
      }
    }
  }

  gridSize.value = size;
  showToast(`Grid size changed to ${size}x${size}`, "info");
};

const handleCopyToClipboard = async () => {
  if (filledCells.value === 0) {
    showToast("Add at least one entry first!", "error");
    return;
  }

  try {
    isCapturing.value = true;
    const blob = await captureGridAsImage({
      cells: cells.value,
      gridSize: gridSize.value,
      username: username.value,
    });

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

    showToast("Grid copied to clipboard!", "success");
  } catch (error) {
    console.error("Failed to copy:", error);
    showToast("Failed to copy grid. Try downloading instead.", "error");
  } finally {
    isCapturing.value = false;
  }
};

const handleDownload = async () => {
  if (filledCells.value === 0) {
    showToast("Add at least one entry first!", "error");
    return;
  }

  try {
    isCapturing.value = true;
    const blob = await captureGridAsImage({
      cells: cells.value,
      gridSize: gridSize.value,
      username: username.value,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `year-in-review.png`;
    link.click();

    URL.revokeObjectURL(url);
    showToast("Grid downloaded!", "success");
  } catch (error) {
    console.error("Failed to download:", error);
    showToast("Failed to download grid", "error");
  } finally {
    isCapturing.value = false;
  }
};

watch(gridSize, (newSize, oldSize) => {
  if (newSize > oldSize) {
    while (cells.value.length < 16) {
      cells.value.push({
        id: cells.value.length,
        image: null,
        imageBase64: null,
        title: "",
        label: "",
      });
    }
  }
});
</script>
