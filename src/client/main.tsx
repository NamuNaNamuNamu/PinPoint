import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { registerExcalidrawCursorSyncListener } from "./features/excalidraw/excalidrawCursor/registerExcalidrawCursorSyncListener.ts";
import { registerExcalidrawSyncListener } from "./features/excalidraw/excalidrawSync/registerExcalidrawSyncListener.ts";

// サーバーからの受信開始
registerExcalidrawSyncListener();
registerExcalidrawCursorSyncListener();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
