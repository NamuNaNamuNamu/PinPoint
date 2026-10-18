import type { Ordered, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { excalidrawAPIHolder } from "./ExcalidrawAPIHolder";

/**
 * Excalidraw 要素の初期化後に、要素がある場合だけシーン全体が表示領域に収まるよう表示位置を調整する。
 */
export function onExcalidrawElementsInitialized() {
    const excalidrawAPI = excalidrawAPIHolder.getApi();
    const elements: readonly Ordered<NonDeletedExcalidrawElement>[] = excalidrawAPI.getSceneElements()

    if (elements.length === 0) {
        return;
    }

    excalidrawAPI.scrollToContent(elements, {
        fitToViewport: true,
        viewportZoomFactor: 0.8,
        animate: true,
        duration: 1000
    });
}
