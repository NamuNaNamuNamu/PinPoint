import type { Ordered, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export function onExcalidrawMount(excalidrawAPI: ExcalidrawImperativeAPI) {
    const elements: readonly Ordered<NonDeletedExcalidrawElement>[] = excalidrawAPI.getSceneElements()
    
    excalidrawAPI.scrollToContent(elements, {
        fitToViewport: true,
        viewportZoomFactor: 0.8,
        animate: true,
        duration: 1000
    });
}