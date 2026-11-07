import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { ExcalidrawElement, OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type {
    AnswerBarAdded,
    AnswerBarOwnerNameUpdated,
    AnswerBarPositionUpdated,
    AnswerBarRemoved,
} from "../../../shared/answerBar/AnswerBarEvents";
import { excalidrawAPIHolder } from "../excalidraw/ExcalidrawAPIHolder";
import type { AnswerBar } from "../excalidraw/Slider/AnswerBar";
import { sliders } from "../excalidraw/Slider/Sliders";

/**
 * AnswerBar イベントと、クライアント固有の操作可否を scene に反映する。
 */
class AnswerBarSceneController {
    /**
     * このブラウザを操作しているユーザー。`locked` の復元に使用する。
     */
    private operatorUserId: number | undefined;
    /**
     * 現在の問題で AnswerBar 操作を一律禁止しているか。
     */
    private interactionLocked = false;
    /**
     * `false` の場合、所有者以外の AnswerBar と名前ラベルをこのクライアントで非表示にする。
     */
    private answerBarReveal = true;
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
     * AnswerBar を全参加者へ公開する状態を scene に反映する。
     *
     * 非公開時も要素を scene 内に保持することで、位置・名前の更新を受信し、再公開時に
     * 最新状態を表示できるようにする。所有者以外の line と全名前ラベルは不透明度 0 かつ
     * ロック状態で反映する。
     *
     * @param answerBarReveal `true` の場合は全 AnswerBar を公開する。
     */
    public setAnswerBarReveal(answerBarReveal: boolean): void {
        this.answerBarReveal = answerBarReveal;
        const api = excalidrawAPIHolder.getApi();
        const elements = excalidrawAPIHolder
            .getSceneElementsWithTombstones()
            .map((element) => this.applyLocalPresentation(element));
        api.updateScene({ elements });
    }

    /**
     * 現在管理中の AnswerBar の操作可否を scene へ反映する。
     *
     * @param locked `true` の場合は所有者を含む全 AnswerBar をロックする。
     */
    public setInteractionLocked(locked: boolean): void {
        this.interactionLocked = locked;
        const lockedByLineId = this.getLockedByLineId();
        if (lockedByLineId.size === 0) {
            return;
        }
        const elements = excalidrawAPIHolder.getSceneElementsWithTombstones().map((element) => {
            const elementLocked = lockedByLineId.get(element.id);
            return this.applyLocalPresentation(
                elementLocked === undefined ? element : { ...element, locked: elementLocked },
            );
        });
        excalidrawAPIHolder.getApi().updateScene({ elements });
        elements.forEach((element) => {
            if (lockedByLineId.has(element.id)) {
                this.rememberElement(element);
            }
        });
    }

    /**
     * 指定要素が現在管理中の AnswerBar 要素かを判定する。
     *
     * @param elementId Excalidraw scene 要素 ID。
     * @returns AnswerBar 要素の場合は `true`。
     */
    public hasElement(elementId: string): boolean {
        return this.elementSnapshots.has(elementId);
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
                const normalizedElements = this.normalizeLockedElements(answerBar.centerLabelInElements(elements));
                normalizedElements.forEach((element) => this.rememberElement(element));
                additions.push(...normalizedElements.map((element) => this.applyLocalPresentation(element)));
            }
        });
        if (additions.length === 0) {
            return;
        }
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({ elements: [...excalidrawAPIHolder.getSceneElementsWithTombstones(), ...additions] });
        additions.forEach((element) => {
            this.rememberElement(element);
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
     * AnswerBar の所有者名ラベルを全 Slider の scene とスナップショットへ反映する。
     *
     * @param payload サーバーが発行した所有者名更新情報。
     */
    public updateOwnerName(payload: AnswerBarOwnerNameUpdated): void {
        const labelIds = new Set(payload.labelIds);
        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                if (answerBar.getAnswerBarId() === payload.answerBarId && labelIds.has(answerBar.getLabelId())) {
                    answerBar.setOwnerUserName(payload.ownerUserName);
                }
            });
        });
        this.rememberCurrentElements();
    }

    /**
     * サーバーが受理した X 座標で AnswerBar の線と名前ラベルを同時に更新する。
     *
     * 対象の AnswerBar または名前ラベルを現在の Slider 群から特定できない場合は、scene を
     * 変更しない。更新した要素は、後続の欠損復元にも同じ位置を用いるため snapshot へ保存する。
     *
     * @param payload サーバーが正規化して配信した AnswerBar の位置更新。
     */
    public updatePosition(payload: AnswerBarPositionUpdated): void {
        let labelId: string | undefined;
        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                if (answerBar.getAnswerBarId() === payload.answerBarId && answerBar.getLineId() === payload.lineId) {
                    labelId = answerBar.getLabelId();
                }
            });
        });
        if (!labelId) {
            return;
        }
        const elements = excalidrawAPIHolder.getSceneElementsWithTombstones().map((element) => {
            if (element.id === payload.lineId) {
                return { ...element, x: payload.x };
            }
            if (element.id === labelId) {
                return { ...element, x: payload.x - element.width / 2 };
            }
            return element;
        });
        excalidrawAPIHolder.getApi().updateScene({ elements });
        elements.forEach((element) => {
            if (element.id === payload.lineId || element.id === labelId) {
                this.rememberElement(element);
            }
        });
    }

    /**
     * 保持中の全 AnswerBar と対応する scene 要素を削除する。
     *
     * 退出後に古い `SYNC_ELEMENTS` が到着しても AnswerBar と名前ラベルを復活させないよう、
     * 削除した要素 ID を保持する。
     */
    public clear(): void {
        this.interactionLocked = false;
        this.answerBarReveal = true;
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
            elements: excalidrawAPIHolder
                .getSceneElementsWithTombstones()
                .filter((element) => !elementIds.has(element.id)),
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
                return this.applyLocalPresentation(locked === undefined ? element : { ...element, locked });
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
                lockedByLineId.set(
                    answerBar.getLineId(),
                    this.interactionLocked ||
                        !this.isAnswerBarVisible(answerBar) ||
                        !answerBar.isOwnedBy(this.operatorUserId!),
                );
            });
        });
        return lockedByLineId;
    }

    private normalizeLockedElements(elements: readonly OrderedExcalidrawElement[]): OrderedExcalidrawElement[] {
        const lockedByLineId = this.getLockedByLineId();
        return elements.map((element) => {
            const locked = lockedByLineId.get(element.id);
            return locked === undefined ? element : { ...element, locked };
        });
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
                this.rememberElement(element);
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
            .map(([, element]) => this.applyLocalPresentation(structuredClone(element)));

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

    /**
     * 管理中の要素へ、このクライアントだけが所有する公開・ロック状態を適用する。
     *
     * @param element scene に反映する前の要素。
     * @returns 公開状態を反映した要素。管理外要素はそのまま返す。
     */
    private applyLocalPresentation<T extends ExcalidrawElement>(element: T): T {
        const answerBar = this.getAnswerBarByElementId(element.id);
        if (!answerBar) {
            return element;
        }
        const isVisible = this.isAnswerBarVisible(answerBar);
        const snapshot = this.elementSnapshots.get(element.id);
        const isLine = answerBar.getLineId() === element.id;
        return {
            ...element,
            opacity: isVisible ? (snapshot?.opacity ?? element.opacity) : 0,
            locked: isLine
                ? this.interactionLocked || !isVisible || !answerBar.isOwnedBy(this.operatorUserId!)
                : true,
        } as T;
    }

    /**
     * 指定要素を管理する AnswerBar を取得する。
     *
     * @param elementId AnswerBar の line または名前ラベルの scene 要素 ID。
     * @returns 管理中の AnswerBar。見つからない場合は `undefined`。
     */
    private getAnswerBarByElementId(elementId: string): AnswerBar | undefined {
        let foundAnswerBar: AnswerBar | undefined;
        sliders.forEach((slider) => {
            slider.forEachAnswerBar((answerBar) => {
                if (answerBar.getLineId() === elementId || answerBar.getLabelId() === elementId) {
                    foundAnswerBar = answerBar;
                }
            });
        });
        return foundAnswerBar;
    }

    /**
     * 指定 AnswerBar をこのクライアントで表示するかを判定する。
     *
     * @param answerBar 判定対象の AnswerBar。
     * @returns 全体公開中または現在の操作ユーザーが所有者の場合は `true`。
     */
    private isAnswerBarVisible(answerBar: AnswerBar): boolean {
        return this.answerBarReveal || (this.operatorUserId !== undefined && answerBar.isOwnedBy(this.operatorUserId));
    }

    /**
     * 管理中要素の復元用 snapshot を更新する。
     *
     * 非公開表示に用いる不透明度とロック状態はクライアント固有の一時表現なので、既存 snapshot
     * がある場合はその値を維持する。
     *
     * @param element snapshot として保存する scene 要素。
     */
    private rememberElement(element: OrderedExcalidrawElement): void {
        const previous = this.elementSnapshots.get(element.id);
        this.elementSnapshots.set(
            element.id,
            structuredClone({
                ...element,
                opacity: previous?.opacity ?? element.opacity,
                locked: previous?.locked ?? element.locked,
            }),
        );
    }
}

export const answerBarSceneController = new AnswerBarSceneController();
