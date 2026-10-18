/**
 * @jest-environment jsdom
 * @jest-environment-options {"url":"http://localhost/"}
 */
import { beforeEach, describe, expect, test } from "@jest/globals";

import { url } from "../../../../src/client/features/url/Url";

describe("Url", () => {
    beforeEach(() => {
        window.history.replaceState(null, "", "/?room=room-1&question=1&deleteExternalElements=true&reveal=true");
    });

    test("createRoomUrl は room 以外のクエリパラメータを引き継がないこと", () => {
        expect(url.createRoomUrl("room-2")).toBe("http://localhost/?room=room-2");
    });

    test("replaceRoomUrl は room 以外のクエリパラメータを除去すること", () => {
        url.replaceRoomUrl("room-2");

        expect(window.location.search).toBe("?room=room-2");
    });

    test("scrollToContent は true の明示時だけ true と解釈すること", () => {
        expect(url.shouldScrollToContent()).toBe(false);

        window.history.replaceState(null, "", "/?scrollToContent=false");
        expect(url.shouldScrollToContent()).toBe(false);

        window.history.replaceState(null, "", "/?scrollToContent=true");
        expect(url.shouldScrollToContent()).toBe(true);
    });

    test("scrollToContent パラメータの有無を区別すること", () => {
        expect(url.hasScrollToContentParam()).toBe(false);

        window.history.replaceState(null, "", "/?room=room-1&scrollToContent=false");
        expect(url.hasScrollToContentParam()).toBe(true);
    });

    test("getInitialRoomCommand は現在の URL を一度の操作内容として読み取ること", () => {
        expect(url.getInitialRoomCommand()).toEqual({
            roomId: "room-1",
            questionId: 1,
            deleteExternalElements: true,
            reveal: true,
            scrollToContent: false,
            hasScrollToContentParam: false,
        });
    });

    test("getInitialRoomCommand は room パラメータがない場合に undefined を返すこと", () => {
        window.history.replaceState(null, "", "/?question=1");

        expect(url.getInitialRoomCommand()).toBeUndefined();
    });
});
