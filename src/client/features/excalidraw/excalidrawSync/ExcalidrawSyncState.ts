import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";

/**
 * リモートから受信した Excalidraw 要素を一時的に保持する。
 */
export class ExcalidrawSyncState {
    private remoteElements: readonly RemoteExcalidrawElement[];

    /**
     * 空のリモート要素一覧で初期化する。
     */
    constructor() {
        this.remoteElements = [];
    }

    /**
     * リモートから受信した Excalidraw 要素をセットする。
     *
     * @param remoteElements リモートから受信した Excalidraw 要素。
     */
    setRemoteElements(remoteElements: readonly RemoteExcalidrawElement[]): void {
        this.remoteElements = remoteElements;
    }

    /**
     * リモートから受信した Excalidraw 要素を取得する。
     *
     * @returns リモートから受信した Excalidraw 要素。
     */
    getRemoteElements(): readonly RemoteExcalidrawElement[] {
        return this.remoteElements;
    }
}

export const excalidrawSyncState = new ExcalidrawSyncState();
