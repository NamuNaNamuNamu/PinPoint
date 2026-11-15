import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/** 管理外 Excalidraw 要素の、tombstone を含むルーム単位キャッシュ。 */
export class ExternalElementsState {
    private readonly byRoom = new Map<string, Map<string, ExcalidrawElement>>();
    /**
     * 要素を version と versionNonce でマージする。
     *
     * @param roomId 対象ルーム ID。
     * @param elements マージ対象の管理外要素。
     * @returns マージ後の tombstone を含む全要素。
     */
    public merge(roomId: string, elements: readonly ExcalidrawElement[]): readonly ExcalidrawElement[] {
        const current = this.byRoom.get(roomId) ?? new Map<string, ExcalidrawElement>();
        elements.forEach((element) => {
            const previous = current.get(element.id);
            if (
                !previous ||
                element.version > previous.version ||
                (element.version === previous.version && element.versionNonce >= previous.versionNonce)
            )
                current.set(element.id, element);
        });
        this.byRoom.set(roomId, current);
        return [...current.values()];
    }
    /**
     * キャッシュ済み要素を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @returns tombstone を含む全要素。
     */
    public get(roomId: string): readonly ExcalidrawElement[] {
        return [...(this.byRoom.get(roomId)?.values() ?? [])];
    }

    /**
     * 管理外要素キャッシュを破棄する。
     *
     * @param roomId 対象ルーム ID。
     */
    public clear(roomId: string): void {
        this.byRoom.delete(roomId);
    }
}
export const externalElementsState = new ExternalElementsState();
