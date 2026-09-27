import type { ReconciledExcalidrawElement, RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import { reconcileElements } from "@excalidraw/excalidraw";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder";
import { excalidrawSyncState } from "./ExcalidrawSyncState";

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
        const remoteElements = elements;

        let excalidrawAPI;
        try {
            excalidrawAPI = excalidrawAPIHolder.getApi();
        } catch (error) {
            console.error(error);
            excalidrawSyncState.setRemoteElements(remoteElements);
            return;
        }

        const localElements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        const merged: ReconciledExcalidrawElement[] = reconcileElements(localElements, remoteElements, appState);

        excalidrawAPI.updateScene({
            elements: merged,
        });
    };
}

export const excalidrawSyncController = new ExcalidrawSyncController();
