/**
 * @jest-environment jsdom
 */

import { userSessionStorage } from "../../../../src/client/features/sessionStorage/sessionStorage";

/**
 * UserSessionStorage の単体テスト。
 *
 * jsdom が提供する sessionStorage を利用して、
 * ユーザーIDの保存・取得に関する動作を確認する。
 */
describe("UserSessionStorage", () => {

    /**
     * 各テストの実行前に sessionStorage を初期化する。
     *
     * sessionStorage はテスト間で状態が残る可能性があるため、
     * 各テストを独立して実行できるように保存内容を削除する。
     */
    beforeEach(() => {
        sessionStorage.clear();
    });

    /**
     * ユーザーIDを保存した場合、
     * 同じユーザーIDを取得できることを確認する。
     */
    test("ユーザーIDを保存して取得できること", () => {
        const userId = 123;

        userSessionStorage.setUserId(userId);

        expect(userSessionStorage.getUserId()).toBe(userId);
    });

    /**
     * ユーザーIDが保存されていない場合、
     * undefined が返されることを確認する。
     */
    test("ユーザーIDが保存されていない場合は undefined を返すこと", () => {
        const result = userSessionStorage.getUserId();

        expect(result).toBeUndefined();
    });

    /**
     * sessionStorage に数値へ変換できない値が保存されている場合、
     * undefined が返されることを確認する。
     */
    test("数値に変換できない値が保存されている場合は undefined を返すこと", () => {
        sessionStorage.setItem("userId", "invalid-user-id");

        const result = userSessionStorage.getUserId();

        expect(result).toBeUndefined();
    });

    /**
     * setUserId で指定したユーザーIDが、
     * sessionStorage に文字列として保存されることを確認する。
     */
    test("ユーザーIDを sessionStorage に文字列として保存できること", () => {
        userSessionStorage.setUserId(123);

        expect(sessionStorage.getItem("userId")).toBe("123");
    });
});