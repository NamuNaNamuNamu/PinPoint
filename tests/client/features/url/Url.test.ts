/**
 * @jest-environment jsdom
 * @jest-environment-options {"url":"http://localhost/"}
 */
import { beforeEach, describe, expect, test } from "@jest/globals";

import { url } from "../../../../src/client/features/url/Url";

describe("Url", () => {
    beforeEach(() => {
        window.history.replaceState(
            null,
            "",
            "/?room=room-1&deleteExternalElements=true&scoreReset=true&scoreSetUser=2&scoreSetValue=100",
        );
    });

    test("createRoomUrl は room 以外のクエリパラメータを引き継がないこと", () => {
        expect(url.createRoomUrl("room-2")).toBe("http://localhost/?room=room-2");
    });

    test("replaceRoomUrl は room 以外のクエリパラメータを除去すること", () => {
        url.replaceRoomUrl("room-2");

        expect(window.location.search).toBe("?room=room-2");
    });

    test("getInitialRoomCommand は現在の URL を一度の操作内容として読み取ること", () => {
        expect(url.getInitialRoomCommand()).toEqual({
            roomId: "room-1",
            deleteExternalElements: true,
            scoreReset: true,
            scoreSetUser: 2,
            scoreSetValue: 100,
        });
    });

    test("getInitialRoomCommand は room パラメータがない場合に undefined を返すこと", () => {
        window.history.replaceState(null, "", "/?deleteExternalElements=true");

        expect(url.getInitialRoomCommand()).toBeUndefined();
    });

    test("scoreReset は true の明示時だけリセット要求として読み取ること", () => {
        window.history.replaceState(null, "", "/?room=room-1&scoreReset=true");
        expect(url.getInitialRoomCommand()).toEqual(
            expect.objectContaining({ roomId: "room-1", scoreReset: true }),
        );

        window.history.replaceState(null, "", "/?room=room-1&scoreReset=false");
        expect(url.getInitialRoomCommand()).toEqual(
            expect.objectContaining({ roomId: "room-1", scoreReset: false }),
        );
    });

    test("未採用の URL 操作パラメータは初期コマンドへ含めないこと", () => {
        window.history.replaceState(
            null,
            "",
            "/?room=room-1&question=1&answerReveal=true&answerBarReveal=false&scrollToContent=true&scoreListEnabled=false&cursorRevealed=false&kickUser=2",
        );

        expect(url.getInitialRoomCommand()).toEqual({
            roomId: "room-1",
            deleteExternalElements: false,
            scoreReset: false,
        });
    });
});
