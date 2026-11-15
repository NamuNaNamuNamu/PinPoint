import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { ExternalElementsState } from "../../../../src/server/features/excalidrawSync/ExternalElementsState";

describe("ExternalElementsState", () => {
    test("同じ ID は version が新しい要素を採用し、tombstone を保持すること", () => {
        const state = new ExternalElementsState();
        const first = { id: "element-1", version: 1, versionNonce: 1, isDeleted: false } as ExcalidrawElement;
        const deleted = { id: "element-1", version: 2, versionNonce: 2, isDeleted: true } as ExcalidrawElement;

        state.merge("room-1", 0, [first]);

        expect(state.merge("room-1", 0, [deleted])).toEqual([deleted]);
    });

    test("キャッシュを破棄すると空配列を返すこと", () => {
        const state = new ExternalElementsState();
        state.merge("room-1", 0, [{ id: "element-1", version: 1, versionNonce: 1 } as ExcalidrawElement]);

        state.clear("room-1");

        expect(state.get("room-1")).toEqual([]);
    });

    test("同じ要素を含む全量同期では、新しい version の要素だけを差分として返すこと", () => {
        const state = new ExternalElementsState();
        const unchanged = { id: "element-1", version: 1, versionNonce: 1 } as ExcalidrawElement;
        const changed = { id: "element-2", version: 2, versionNonce: 2 } as ExcalidrawElement;

        state.merge("room-1", 0, [unchanged]);

        expect(state.merge("room-1", 0, [unchanged, changed])).toEqual([changed]);
    });

    test("reset 後は古い世代の同期を受理しないこと", () => {
        const state = new ExternalElementsState();
        state.merge("room-1", 0, [{ id: "element-1", version: 1, versionNonce: 1 } as ExcalidrawElement]);

        const epoch = state.reset("room-1");

        expect(epoch).toBe(1);
        expect(state.merge("room-1", 0, [{ id: "element-1", version: 2, versionNonce: 2 } as ExcalidrawElement])).toEqual([]);
        expect(state.get("room-1")).toEqual([]);
    });
});
