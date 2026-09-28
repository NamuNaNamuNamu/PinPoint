import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerExcalidrawSyncListener } from "./features/excalidraw/excalidrawSync/registerExcalidrawSyncListener.ts";
import { registerExcalidrawCursorSyncListener } from "./features/excalidraw/excalidrawCursor/registerExcalidrawCursorSyncListener.ts";

// サーバーからの受信開始
registerExcalidrawSyncListener();
registerExcalidrawCursorSyncListener();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
