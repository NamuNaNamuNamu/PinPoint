import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { AnswerBarAdded, AnswerBarRemoved } from "../../../shared/answerBar/AnswerBarEvents";
import { sliders } from "../excalidraw/Slider/Sliders";
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
     * 削除通知済みの AnswerBar 要素 ID。古い全量同期による再出現を防ぐ。
     */
    private readonly removedElementIds = new Set<string>();
    /**
     * 管理中 AnswerBar 要素の直近の正常な scene 状態。
     */
    private readonly elementSnapshots = new Map<string, OrderedExcalidrawElement>();

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
     * AnswerBar と名前ラベルを全 Slider と scene に追加する。
     *
     * @param payload サーバーが発行した AnswerBar の割当情報。
     * @param operatorUserId 現在操作しているユーザー ID。
     */
    public add(payload: AnswerBarAdded, operatorUserId: number): void {
        const additions: OrderedExcalidrawElement[] = [];
        payload.lineIds.forEach((lineId, index) => {
            const slider = sliders[index];
            const labelId = payload.labelIds[index];
            if (!slider || !labelId) {
                return;
            }
            this.removedElementIds.delete(lineId);
            this.removedElementIds.delete(labelId);
            const answerBar = slider.addAnswerBar({ ...payload, lineId, labelId, operatorUserId });
            if (answerBar) {
                const elements = convertToExcalidrawElements(answerBar.getSkeletons(), { regenerateIds: false });
                additions.push(...answerBar.centerLabelInElements(elements));
            }
        });
        if (additions.length === 0) {
            return;
        }
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({ elements: [...excalidrawAPIHolder.getSceneElementsWithTombstones(), ...additions] });
        additions.forEach((element) => {
            this.elementSnapshots.set(element.id, structuredClone(element));
        });
    }

    /**
     * AnswerBar と対応する scene 要素を削除する。
     *
     * 削除済み ID を保持するため、削除イベントより遅れて届いた古い `SYNC_ELEMENTS` が
     * AnswerBar と名前ラベルを scene に復活させることはない。
     *
     * @param payload サーバーが発行した削除対象の情報。
     */
    public remove(payload: AnswerBarRemoved): void {
        const ids = new Set([...payload.lineIds, ...payload.labelIds]);
        ids.forEach((id) => this.removedElementIds.add(id));
        sliders.forEach((slider) => slider.removeAnswerBar(payload.answerBarId));
        ids.forEach((id) => this.elementSnapshots.delete(id));
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder.getSceneElementsWithTombstones().filter((element) => !ids.has(element.id)),
        });
    }

    /**
     * 保持中の全 AnswerBar と対応する scene 要素を削除する。
     *
     * 退出後に古い `SYNC_ELEMENTS` が到着しても AnswerBar と名前ラベルを復活させないよう、
     * 削除した要素 ID を保持する。
     */
    public clear(): void {
        const answerBarIds = new Set<string>();
        const elementIds = new Set<string>();
        sliders.forEach((slider) =>
            slider.forEachAnswerBar((answerBar) => {
                answerBarIds.add(answerBar.getAnswerBarId());
                elementIds.add(answerBar.getLineId());
                elementIds.add(answerBar.getLabelId());
            }),
        );
        elementIds.forEach((id) => this.removedElementIds.add(id));
        answerBarIds.forEach((answerBarId) => sliders.forEach((slider) => slider.removeAnswerBar(answerBarId)));
        elementIds.forEach((id) => this.elementSnapshots.delete(id));
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder.getSceneElementsWithTombstones().filter((element) => !elementIds.has(element.id)),
        });
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
            .filter((element) => !this.removedElementIds.has(element.id))
            .map((element) => {
                const locked = lockedByLineId.get(element.id);
                return locked === undefined ? element : { ...element, locked };
            });
    }

    /**
     * AnswerBar の line ID ごとに、このクライアントでの操作可否を求める。
     *
     * @returns line ID をキーとしたロック状態。
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

    /**
     * scene 上にある管理中 AnswerBar 要素を、復元用の正常状態として記録する。
     *
     * AnswerBar の所有者による移動後の位置を保持し、不正な削除後にも同じ位置へ戻せるようにする。
     */
    public rememberCurrentElements(): void {
        const managedElementIds = this.getManagedElementIds();
        excalidrawAPIHolder.getActiveSceneElements().forEach((element) => {
            if (managedElementIds.has(element.id)) {
                this.elementSnapshots.set(element.id, structuredClone(element));
            }
        });
    }

    /**
     * scene から不正に削除された管理中 AnswerBar 要素を、直近の正常状態で復元する。
     *
     * 正規の削除では先に AnswerBar とスナップショットを管理対象から外すため、復元対象にならない。
     *
     * @returns 1 個以上の管理中要素を復元した場合は `true`。
     */
    public restoreMissingElements(): boolean {
        const api = excalidrawAPIHolder.getApi();
        const currentElements = excalidrawAPIHolder.getSceneElementsWithTombstones();
        const activeElementIds = new Set(excalidrawAPIHolder.getActiveSceneElements().map((element) => element.id));
        const managedElementIds = this.getManagedElementIds();
        const missingElements = [...this.elementSnapshots.entries()]
            .filter(([id]) => managedElementIds.has(id) && !activeElementIds.has(id))
            .map(([, element]) => structuredClone(element));

        if (missingElements.length === 0) {
            return false;
        }

        api.updateScene({ elements: [...currentElements, ...missingElements] });
        return true;
    }

    /**
     * 現在の Slider が管理する AnswerBar の scene 要素 ID を取得する。
     *
     * @returns line と名前ラベルの ID 集合。
     */
    private getManagedElementIds(): ReadonlySet<string> {
        const managedElementIds = new Set<string>();
        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                managedElementIds.add(answerBar.getLineId());
                managedElementIds.add(answerBar.getLabelId());
            });
        });
        return managedElementIds;
    }
}

export const answerBarSceneController = new AnswerBarSceneController();
