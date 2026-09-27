import type { ReconciledExcalidrawElement, RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import { reconcileElements } from "@excalidraw/excalidraw";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder";
import { excalidrawSyncState } from "./ExcalidrawSyncState";

/**
 * リモートから受信した Excalidraw 要素をローカルのシーンへ同期する。
 */
class ExcalidrawSyncController {
    /**
     * リモートから受信した Excalidraw 要素をローカルのシーンへ同期する。
     *
     * Excalidraw API が利用可能な場合は、ローカル要素と統合してシーンを更新する。
     * API を取得できない場合は、API 設定後に同期できるよう受信要素を一時保持する。
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
