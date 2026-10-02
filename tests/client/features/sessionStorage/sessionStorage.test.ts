/** @jest-environment jsdom */
import { userSessionStorage } from "../../../../src/client/features/sessionStorage/sessionStorage";

/**
 * UserSessionStorage の単体テスト。
 *
 * jsdom が提供する sessionStorage を利用して、ユーザー ID の保存・取得と、
 * 同一タブでのページ遷移後に復元できることを確認する。
 */
describe("UserSessionStorage", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    test("ユーザー ID を文字列として保存・取得できること", () => {
        userSessionStorage.setUserId(123);

        expect(sessionStorage.getItem("userId")).toBe("123");
        expect(userSessionStorage.getUserId()).toBe(123);
    });

    test("同じタブでのページ遷移後も保存済みのユーザー ID を取得できること", () => {
        userSessionStorage.setUserId(123);

        expect(userSessionStorage.getUserIdForCurrentNavigation()).toBe(123);
        expect(sessionStorage.getItem("userId")).toBe("123");
    });
});
