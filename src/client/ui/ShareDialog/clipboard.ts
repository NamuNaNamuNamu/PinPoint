const STRING_MIME_TYPES = {
  text: "text/plain",
  html: "text/html",
  json: "application/json",
  // excalidraw data
  excalidraw: "application/vnd.excalidraw+json",
  excalidrawClipboard: "application/vnd.excalidraw.clipboard+json",
  // LEGACY: fully-qualified library JSON data
  excalidrawlib: "application/vnd.excalidrawlib+json",
  // list of excalidraw library item ids
  excalidrawlibIds: "application/vnd.excalidrawlib.ids+json",
} as const;

const IMAGE_MIME_TYPES = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
  jfif: "image/jfif",
} as const;

const MIME_TYPES = {
  ...STRING_MIME_TYPES,
  // image-encoded excalidraw data
  "excalidraw.svg": "image/svg+xml",
  "excalidraw.png": "image/png",
  // binary
  binary: "application/octet-stream",
  // image
  ...IMAGE_MIME_TYPES,
} as const;

type ValueOf<T> = T[keyof T];

const probablySupportsClipboardWriteText =
  "clipboard" in navigator && "writeText" in navigator.clipboard;

export const copyTextToSystemClipboard = async <
  MimeType extends ValueOf<typeof STRING_MIME_TYPES>,
>(
  text: string | { [K in MimeType]: string } | null,
  clipboardEvent?: ClipboardEvent | null,
) => {
  text = text || "";

  const entries = Object.entries(
    typeof text === "string" ? { [MIME_TYPES.text]: text } : text,
  );

  // (1) if we have clipboardEvent, try using it first as it's the most
  // versatile
  try {
    if (clipboardEvent) {
      for (const [mimeType, value] of entries) {
        clipboardEvent.clipboardData?.setData(mimeType, value);
        if (clipboardEvent.clipboardData?.getData(mimeType) !== value) {
          throw new Error("Failed to setData on clipboardEvent");
        }
      }
      return;
    }
  } catch (error: any) {
    console.error(error);
  }

  const plainTextEntry = entries.find(
    ([mimeType]) => mimeType === MIME_TYPES.text,
  );

  // (2) if we don't have access to clipboardEvent, or that fails,
  // at least try setting text/plain via navigator.clipboard.writeText
  // (navigator.clipboard.write doesn't work with non-standard mime types)
  if (probablySupportsClipboardWriteText && plainTextEntry) {
    try {
      // NOTE: doesn't work on FF on non-HTTPS domains, or when document
      // not focused
      await navigator.clipboard.writeText(plainTextEntry[1]);
      return;
    } catch (error: any) {
      console.error(error);
    }
  }

  // (3) if previous fails, use document.execCommand
  if (plainTextEntry && !copyTextViaExecCommand(plainTextEntry[1])) {
    throw new Error("Error copying to clipboard.");
  }
};

// adapted from https://github.com/zenorocha/clipboard.js/blob/ce79f170aa655c408b6aab33c9472e8e4fa52e19/src/clipboard-action.js#L48
const copyTextViaExecCommand = (text: string | null) => {
  // execCommand doesn't allow copying empty strings, so if we're
  // clearing clipboard using this API, we must copy at least an empty char
  if (!text) {
    text = " ";
  }

  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  const textarea = document.createElement("textarea");

  textarea.style.border = "0";
  textarea.style.padding = "0";
  textarea.style.margin = "0";
  textarea.style.position = "absolute";
  textarea.style[isRTL ? "right" : "left"] = "-9999px";
  const yPosition = window.pageYOffset || document.documentElement.scrollTop;
  textarea.style.top = `${yPosition}px`;
  // Prevent zooming on iOS
  textarea.style.fontSize = "12pt";

  textarea.setAttribute("readonly", "");
  textarea.value = text;

  document.body.appendChild(textarea);

  let success = false;

  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    success = document.execCommand("copy");
  } catch (error: any) {
    console.error(error);
  }

  textarea.remove();

  return success;
};