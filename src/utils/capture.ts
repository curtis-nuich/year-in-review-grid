import type { Cell, GridSize } from "../types";

interface CaptureOptions {
  cells: Cell[];
  gridSize: GridSize;
  username: string;
}

export async function captureGridAsImage(
  options: CaptureOptions
): Promise<Blob> {
  const { cells, gridSize, username } = options;

  const SCALE = 2;
  const IMAGE_WIDTH = 672;
  const IMAGE_PADDING = 36;
  const TOTAL_WIDTH = IMAGE_WIDTH + IMAGE_PADDING;
  const LEFT_MARGIN = IMAGE_PADDING / 2;

  const GRID_GAP = 12;
  const CELL_SIZE = (IMAGE_WIDTH - GRID_GAP * (gridSize - 1)) / gridSize;
  const GRID_HEIGHT = CELL_SIZE * gridSize + GRID_GAP * (gridSize - 1);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  await document.fonts.ready;

  const titleText = username
    ? `${username}'s Year in Review`
    : "Year in Review";

  let fontSize = 48;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  let titleMetrics = ctx.measureText(titleText);
  const maxTitleWidth = IMAGE_WIDTH - 40;

  while (titleMetrics.width > maxTitleWidth && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    titleMetrics = ctx.measureText(titleText);
  }

  const titleHeight = Math.max(100, fontSize + 52);

  const FOOTER_HEIGHT = 60;
  const TOTAL_HEIGHT = titleHeight + GRID_HEIGHT + FOOTER_HEIGHT;

  canvas.width = TOTAL_WIDTH * SCALE;
  canvas.height = TOTAL_HEIGHT * SCALE;

  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";

  const titleX = TOTAL_WIDTH / 2;
  const titleY = titleHeight - 40;

  const titleGradient = ctx.createLinearGradient(
    titleX - 200,
    titleY,
    titleX + 200,
    titleY
  );
  titleGradient.addColorStop(0, "#0f766e");
  titleGradient.addColorStop(0.5, "#2563eb");
  titleGradient.addColorStop(1, "#0f766e");
  ctx.fillStyle = titleGradient;
  ctx.fillText(titleText, titleX, titleY);

  const visibleCells = cells.slice(0, gridSize * gridSize);

  for (let i = 0; i < visibleCells.length; i++) {
    const cell = visibleCells[i];
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = LEFT_MARGIN + col * (CELL_SIZE + GRID_GAP);
    const y = titleHeight + row * (CELL_SIZE + GRID_GAP);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.strokeStyle = "rgba(229, 231, 235, 1)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 12);
    ctx.fill();
    ctx.stroke();

    if (cell.label === "Best Anime") {
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 4;
      roundRect(ctx, x - 2, y - 2, CELL_SIZE + 4, CELL_SIZE + 4, 14);
      ctx.stroke();
    }

    if (cell.image) {
      try {
        const img = await loadImage(cell.imageBase64 || cell.image);

        const imgRatio = img.width / img.height;
        const cellRatio = 1;

        let drawWidth = CELL_SIZE;
        let drawHeight = CELL_SIZE;
        let drawX = x;
        let drawY = y;

        if (imgRatio > cellRatio) {
          drawWidth = drawHeight * imgRatio;
          drawX = x - (drawWidth - CELL_SIZE) / 2;
        } else {
          drawHeight = drawWidth / imgRatio;
          drawY = y - (drawHeight - CELL_SIZE) / 2;
        }

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 12);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        const overlayGradient = ctx.createLinearGradient(
          x,
          y + CELL_SIZE - 80,
          x,
          y + CELL_SIZE
        );
        overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
        ctx.fillStyle = overlayGradient;
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 12);
        ctx.clip();
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.restore();

        // Draw label if exists
        if (cell.label) {
          const labelY = y + CELL_SIZE - 50;
          const labelFontSize = 9;
          ctx.font = `600 ${labelFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = "white";

          const labelMetrics = ctx.measureText(cell.label);
          const labelPadding = 16;
          const labelWidth = labelMetrics.width + labelPadding;
          const labelHeight = 18;

          ctx.fillStyle = "#14b8a6";
          ctx.beginPath();
          roundRect(ctx, x + 12, labelY, labelWidth, labelHeight, 9);
          ctx.fill();

          ctx.fillStyle = "white";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(
            cell.label,
            x + 12 + labelPadding / 2,
            labelY + labelHeight / 2
          );
        }

        // Draw title
        const titleY = y + CELL_SIZE - 24;
        const titleFontSize = 9;
        ctx.font = `600 ${titleFontSize}px system-ui, -apple-system, sans-serif`;

        const maxWidth = CELL_SIZE - 32;
        let cellTitleText = cell.title;
        let cellTitleMetrics = ctx.measureText(cellTitleText);

        // Truncate text if too long
        while (cellTitleMetrics.width > maxWidth && cellTitleText.length > 3) {
          cellTitleText = cellTitleText.slice(0, -1);
          cellTitleMetrics = ctx.measureText(cellTitleText + "...");
        }
        if (cellTitleMetrics.width > maxWidth) {
          cellTitleText += "...";
        }

        const titleWidth = Math.min(
          ctx.measureText(cellTitleText).width + 16,
          maxWidth + 8
        );
        const titleHeight = 18;

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        roundRect(ctx, x + 12, titleY, titleWidth, titleHeight, 6);
        ctx.fill();

        ctx.fillStyle = "#1f2937";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(cellTitleText, x + 12 + 8, titleY + titleHeight / 2);
      } catch (error) {
        console.error("Failed to load image for cell:", error);
      }
    }
  }

  const footerY = TOTAL_HEIGHT - 24;

  ctx.fillStyle = "#6b7280";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Made by @Pesto808", 12, footerY + 16);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create image"));
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
