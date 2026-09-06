import type { Ordered, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { excalidrawAPIHolder } from "./ExcalidrawAPIHolder";

export function onExcalidrawElementsInitialized() {
    const excalidrawAPI = excalidrawAPIHolder.getApi();
    const elements: readonly Ordered<NonDeletedExcalidrawElement>[] = excalidrawAPI.getSceneElements()
    
    excalidrawAPI.scrollToContent(elements, {
        fitToViewport: true,
        viewportZoomFactor: 0.8,
        animate: true,
        duration: 1000
    });
}