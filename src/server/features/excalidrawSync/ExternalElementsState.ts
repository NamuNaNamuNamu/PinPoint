import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/** 管理外 Excalidraw 要素の、tombstone を含むルーム単位キャッシュ。 */
export class ExternalElementsState {
    private readonly byRoom = new Map<string, { epoch: number; elements: Map<string, ExcalidrawElement> }>();
    /**
     * 要素を version と versionNonce でマージする。
     *
     * @param roomId 対象ルーム ID。
     * @param epoch 同期元が保持する世代。
     * @param elements マージ対象の管理外要素。
     * @returns 正本へ反映された要素だけ。世代が古い場合は空配列。
     */
    public merge(roomId: string, epoch: number, elements: readonly ExcalidrawElement[]): readonly ExcalidrawElement[] {
        const current = this.getOrCreate(roomId);
        if (current.epoch !== epoch) return [];
        const changed: ExcalidrawElement[] = [];
        elements.forEach((element) => {
            const previous = current.elements.get(element.id);
            if (
                !previous ||
                element.version > previous.version ||
                (element.version === previous.version && element.versionNonce > previous.versionNonce)
            ) {
                current.elements.set(element.id, element);
                changed.push(element);
            }
        });
        return changed;
    }
    /**
     * キャッシュ済み要素を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @returns tombstone を含む全要素。
     */
    public get(roomId: string): readonly ExcalidrawElement[] {
        return [...(this.byRoom.get(roomId)?.elements.values() ?? [])];
    }

    /**
     * 現在の同期世代を返す。
     *
     * @param roomId 対象ルーム ID。
     * @returns 現在の同期世代。
     */
    public getEpoch(roomId: string): number {
        return this.getOrCreate(roomId).epoch;
    }

    /**
     * 外部要素と古い世代の同期を破棄し、新しい同期世代を開始する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 破棄後に有効となる同期世代。
     */
    public reset(roomId: string): number {
        const epoch = this.getEpoch(roomId) + 1;
        this.byRoom.set(roomId, { epoch, elements: new Map() });
        return epoch;
    }

    /**
     * 管理外要素キャッシュを破棄する。
     *
     * @param roomId 対象ルーム ID。
     */
    public clear(roomId: string): void {
        this.byRoom.delete(roomId);
    }

    /**
     * ルームの同期状態を取得し、未作成なら世代 0 の状態を作成する。
     *
     * @param roomId 対象ルーム ID。
     * @returns ルームの同期世代と要素正本。
     */
    private getOrCreate(roomId: string): { epoch: number; elements: Map<string, ExcalidrawElement> } {
        const current = this.byRoom.get(roomId);
        if (current) return current;
        const created = { epoch: 0, elements: new Map<string, ExcalidrawElement>() };
        this.byRoom.set(roomId, created);
        return created;
    }
}
export const externalElementsState = new ExternalElementsState();
