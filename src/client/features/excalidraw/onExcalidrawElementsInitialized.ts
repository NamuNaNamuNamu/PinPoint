import type { Ordered, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { excalidrawAPIHolder } from "./ExcalidrawAPIHolder";

/**
 * Excalidraw 要素の初期化後に、シーン全体が表示領域に収まるよう表示位置を調整する。
 */
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
