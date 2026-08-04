import type { ReconciledExcalidrawElement, RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import { reconcileElements } from "@excalidraw/excalidraw";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder"; 

class ExcalidrawSyncController {
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