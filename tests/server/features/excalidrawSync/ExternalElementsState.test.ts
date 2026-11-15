import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { ExternalElementsState } from "../../../../src/server/features/excalidrawSync/ExternalElementsState";

describe("ExternalElementsState", () => {
    test("同じ ID は version が新しい要素を採用し、tombstone を保持すること", () => {
        const state = new ExternalElementsState();
        const first = { id: "element-1", version: 1, versionNonce: 1, isDeleted: false } as ExcalidrawElement;
        const deleted = { id: "element-1", version: 2, versionNonce: 2, isDeleted: true } as ExcalidrawElement;

        state.merge("room-1", [first]);

        expect(state.merge("room-1", [deleted])).toEqual([deleted]);
    });

    test("キャッシュを破棄すると空配列を返すこと", () => {
        const state = new ExternalElementsState();
        state.merge("room-1", [{ id: "element-1", version: 1, versionNonce: 1 } as ExcalidrawElement]);

        state.clear("room-1");

        expect(state.get("room-1")).toEqual([]);
    });
});
