import { Cell } from "./types";

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const loadFonts = async () => {
  await document.fonts.ready;
};

const captureGrid = async (
  contentRef: React.RefObject<HTMLDivElement>,
  cells: Cell[],
  gridSize: number,
  username?: string
): Promise<Blob> => {
  if (!contentRef.current) {
    throw new Error("Content ref is not available");
  }

  const container = contentRef.current;
  const containerRect = container.getBoundingClientRect();

  const canvas = document.createElement("canvas");
  const scale = 2;
  // Force desktop-like dimensions with extra padding
  const desktopWidth = 672;
  const padding = 36;
  const totalWidth = desktopWidth + padding;
  const aspectRatio = containerRect.height / containerRect.width;
  const footerHeight = 60;
  canvas.width = totalWidth * scale;
  canvas.height = (totalWidth * aspectRatio + footerHeight) * scale;

  const xOffset = padding / 2;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.fillStyle = "rgb(15 23 42)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);

  await loadFonts();

  ctx.fillStyle = "rgb(96 165 250)";
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  const title = username
    ? `${username}'s Year in Review`
    : "ANIME IN REVIEW 2024";
  ctx.fillText(title, totalWidth / 2, 60);

  try {
    const profilePic = await loadImage("/year-in-review-grid/Don_Bongo.png");
    const picSize = 20;
    const sidePadding = 12;
    const bottomPadding = footerHeight - 24;

    const footerY = canvas.height / scale - bottomPadding;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      sidePadding + picSize / 2,
      footerY + picSize / 2,
      picSize / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(profilePic, sidePadding, footerY, picSize, picSize);
    ctx.restore();

    ctx.fillStyle = "rgb(148 163 184)";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Made by @Pesto808", sidePadding + picSize + 8, footerY + 14);
  } catch (error) {
    console.error("Error loading profile picture:", error);
    ctx.fillStyle = "rgb(148 163 184)";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Made by @Pesto808", padding, canvas.height / scale - 24);
  }

  const gap = 12;
  const cellSize = (desktopWidth - gap * (gridSize - 1)) / gridSize;
  const startY = 100;

  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = cells[i];
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = xOffset + col * (cellSize + gap);
    const y = startY + row * (cellSize + gap);

    ctx.fillStyle = "rgb(30 41 59)";
    ctx.beginPath();
    ctx.roundRect(x, y, cellSize, cellSize, 8);
    ctx.fill();

    if (cell.label === "Best Anime") {
      ctx.strokeStyle = "rgb(234 179 8)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, cellSize + 4, cellSize + 4, 10);
      ctx.stroke();
    }

    if (cell.image) {
      try {
        const img = await loadImage(cell.imageBase64 || cell.image);

        const imgRatio = img.width / img.height;
        const cellRatio = cellSize / cellSize;
        let drawWidth = cellSize;
        let drawHeight = cellSize;
        let drawX = x;
        let drawY = y;

        if (imgRatio > cellRatio) {
          drawWidth = (drawHeight * img.width) / img.height;
          drawX = x + (cellSize - drawWidth) / 2;
        } else {
          drawHeight = (drawWidth * img.height) / img.width;
          drawY = y + (cellSize - drawHeight) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 8);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        if (cell.label) {
          const labelY = y + cellSize - 60;
          ctx.fillStyle = "rgba(37, 99, 235, 0.8)";
          ctx.font = "14px Inter, system-ui, sans-serif";

          const labelText = cell.label;
          const labelMetrics = ctx.measureText(labelText);
          const labelPadding = 20;
          const labelWidth = labelMetrics.width + labelPadding;

          ctx.beginPath();
          ctx.roundRect(x + 16, labelY, labelWidth, 24, 4);
          ctx.fill();

          ctx.fillStyle = "white";
          ctx.textAlign = "left";
          ctx.fillText(labelText, x + 26, labelY + 16);
        }

        const titleY = y + cellSize - 30;
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.font = "14px Inter, system-ui, sans-serif";
        const titleMetrics = ctx.measureText(cell.title);
        const titleWidth = Math.min(titleMetrics.width + 20, cellSize - 32);

        ctx.beginPath();
        ctx.roundRect(x + 16, titleY, titleWidth, 24, 4);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        let titleText = cell.title;
        if (titleMetrics.width > cellSize - 52) {
          while (
            ctx.measureText(titleText + "...").width > cellSize - 52 &&
            titleText.length > 0
          ) {
            titleText = titleText.slice(0, -1);
          }
          titleText += "...";
        }
        ctx.fillText(titleText, x + 26, titleY + 16);
      } catch (error) {
        console.error("Error drawing cell:", error);
      }
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob"));
      }
    }, "image/png");
  });
};

export { captureGrid };
