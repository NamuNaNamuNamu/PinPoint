import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { AnswerBarAdded, AnswerBarRemoved } from "../../../shared/answerBar/AnswerBarEvents";
import { sliders } from "../../../shared/Slider/Sliders";
import { excalidrawAPIHolder } from "../excalidraw/ExcalidrawAPIHolder";

/**
 * AnswerBar イベントと、クライアント固有の操作可否を scene に反映する。
 */
class AnswerBarSceneController {
    /**
     * このブラウザを操作しているユーザー。`locked` の復元に使用する。
     */
    private operatorUserId: number | undefined;
    /**
     * 削除通知済みの line ID。古い全量同期による再出現を防ぐ。
     */
    private readonly removedLineIds = new Set<string>();

    /**
     * 現在のブラウザの操作ユーザーを設定する。
     *
     * `locked` は共同編集で共有する状態ではなく、各クライアントで所有者から導出する表示状態である。
     *
     * @param operatorUserId 現在操作しているユーザー ID。
     */
    public setOperatorUserId(operatorUserId: number): void {
        this.operatorUserId = operatorUserId;
    }

    /**
     * AnswerBar を全 Slider と scene に追加する。
     *
     * @param payload サーバーが発行した AnswerBar の割当情報。
     * @param operatorUserId 現在操作しているユーザー ID。
     */
    public add(payload: AnswerBarAdded, operatorUserId: number): void {
        const additions: OrderedExcalidrawElement[] = [];

        payload.lineIds.forEach((lineId, index) => {
            const slider = sliders[index];
            if (!slider) {
                return;
            }

            // UUID は再利用しないが、再接続時の有効な再通知を許容する。
            this.removedLineIds.delete(lineId);
            const answerBar = slider.addAnswerBar({ ...payload, lineId, operatorUserId });
            if (answerBar) {
                additions.push(...convertToExcalidrawElements([answerBar.getSkeleton()], { regenerateIds: false }));
            }
        });
        if (additions.length === 0) {
            return;
        }

        const api = excalidrawAPIHolder.getApi();
        api.updateScene({ elements: [...api.getSceneElements(), ...additions] });
    }

    /**
     * AnswerBar と対応する scene 要素を削除する。
     *
     * 削除済み ID を保持するため、削除イベントより遅れて届いた古い `SYNC_ELEMENTS` が
     * AnswerBar を scene に復活させることはない。
     *
     * @param payload サーバーが発行した削除対象の情報。
     */
    public remove(payload: AnswerBarRemoved): void {
        payload.lineIds.forEach((lineId) => this.removedLineIds.add(lineId));
        sliders.forEach((slider) => slider.removeAnswerBar(payload.answerBarId));

        const ids = new Set(payload.lineIds);
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({ elements: api.getSceneElements().filter((element) => !ids.has(element.id)) });
    }

    /**
     * 保持中の全 AnswerBar と対応する scene 要素を削除する。
     *
     * 退出後に古い `SYNC_ELEMENTS` が到着しても AnswerBar を復活させないよう、
     * 削除した line ID を保持する。
     */
    public clear(): void {
        const answerBarIds = new Set<string>();
        const lineIds = new Set<string>();

        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                answerBarIds.add(answerBar.getAnswerBarId());
                lineIds.add(answerBar.getLineId());
            });
        });
        lineIds.forEach((lineId) => this.removedLineIds.add(lineId));
        answerBarIds.forEach((answerBarId) => {
            sliders.forEach((slider) => slider.removeAnswerBar(answerBarId));
        });

        const api = excalidrawAPIHolder.getApi();
        api.updateScene({ elements: api.getSceneElements().filter((element) => !lineIds.has(element.id)) });
    }

    /**
     * リモート scene を取り込む前に AnswerBar 固有のローカル状態を復元する。
     *
     * @param elements 他クライアントが送信した scene 要素。
     * @returns 削除済み AnswerBar を除外し、`locked` をこのクライアント用に補正した要素。
     */
    public normalizeRemoteElements(elements: readonly RemoteExcalidrawElement[]): readonly RemoteExcalidrawElement[] {
        const lockedByLineId = this.getLockedByLineId();

        return elements
            .filter((element) => !this.removedLineIds.has(element.id))
            .map((element) => {
                const locked = lockedByLineId.get(element.id);
                return locked === undefined ? element : { ...element, locked };
            });
    }

    /**
     * AnswerBar の line ID ごとに、このクライアントでの操作可否を求める。
     */
    private getLockedByLineId(): ReadonlyMap<string, boolean> {
        const lockedByLineId = new Map<string, boolean>();
        if (this.operatorUserId === undefined) {
            return lockedByLineId;
        }

        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                lockedByLineId.set(answerBar.getLineId(), !answerBar.isOwnedBy(this.operatorUserId!));
            });
        });
        return lockedByLineId;
    }
}

export const answerBarSceneController = new AnswerBarSceneController();
