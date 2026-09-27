import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerExcalidrawSyncListener } from "./features/excalidraw/excalidrawSync/registerExcalidrawSyncListener.ts";

// サーバーからの受信開始
registerExcalidrawSyncListener();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
