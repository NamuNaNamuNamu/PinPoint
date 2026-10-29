import { reconcileElements } from "@excalidraw/excalidraw";
import type { ReconciledExcalidrawElement, RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";

import { answerBarSceneController } from "../../answerBar/AnswerBarSceneController";
import { excalidrawAPIHolder } from "../ExcalidrawAPIHolder";
import { excalidrawSyncState } from "./ExcalidrawSyncState";

/**
 * リモート反映中の `onChange` から SYNC_ELEMENTS を再送しないための境界。
 */
class ExcalidrawSyncController {
    private isApplyingRemote = false;

    /**
     * リモート scene を統合して反映する。
     *
     * AnswerBar の `locked` は送信元の操作ユーザーに依存するため、そのまま統合しない。
     * 統合前にこのクライアントの所有権へ正規化し、削除済み AnswerBar も除外する。
     *
     * @param remoteElements 他クライアントが送信した scene 要素。
     */
    public syncElements = (remoteElements: readonly RemoteExcalidrawElement[]): void => {
        try {
            const api = excalidrawAPIHolder.getApi();
            const normalizedRemoteElements = answerBarSceneController.normalizeRemoteElements(remoteElements);
            const merged: ReconciledExcalidrawElement[] = reconcileElements(
                excalidrawAPIHolder.getSceneElementsWithTombstones(),
                normalizedRemoteElements,
                api.getAppState(),
            );
            this.applyRemote(() => api.updateScene({ elements: merged }));
        } catch (error) {
            console.error(error);
            excalidrawSyncState.setRemoteElements(remoteElements);
        }
    };

    /**
     * リモート由来の scene 更新を実行する。
     *
     * @param update Excalidraw API に反映する処理。
     */
    public applyRemote(update: () => void): void {
        this.isApplyingRemote = true;
        try {
            update();
        } finally {
            queueMicrotask(() => {
                this.isApplyingRemote = false;
            });
        }
    }

    /**
     * リモート反映中かを取得する。
     *
     * @returns リモート反映中の場合は `true`。
     */
    public isRemoteApplying(): boolean {
        return this.isApplyingRemote;
    }
}

export const excalidrawSyncController = new ExcalidrawSyncController();
