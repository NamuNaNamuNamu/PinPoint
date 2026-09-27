import type { ReconciledExcalidrawElement, RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import { reconcileElements } from "@excalidraw/excalidraw";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder"; 

/**
 * リモートから受信した Excalidraw 要素をローカルのシーンへ同期する。
 */
class ExcalidrawSyncController {
    /**
     * リモート要素とローカル要素を統合し、Excalidraw のシーンを更新する。
     *
     * @param elements リモートから受信した Excalidraw 要素。
     */
    public syncElements = (elements: readonly RemoteExcalidrawElement[]) => {
        const excalidrawAPI = excalidrawAPIHolder.getApi();

        const localElements = excalidrawAPI.getSceneElements();
        const remoteElements = elements;
        const appState = excalidrawAPI.getAppState();
        
        const merged: ReconciledExcalidrawElement[] = reconcileElements(
            localElements,
            remoteElements,
            appState
        );

        excalidrawAPI.updateScene({
            elements: merged,
        });
    };
}

export const excalidrawSyncController = new ExcalidrawSyncController();
