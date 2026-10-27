/**
 * sessionStorage を利用してユーザー情報を管理するクラス。
 *
 * ユーザーID自体の生成はサーバー側で行い、
 * クライアント側ではサーバーから払い出されたユーザーIDの
 * 保存・取得のみを行う。
 *
 * sessionStorage とユーザーIDの関係:
 * - 同じタブのページリロード・ページ遷移 : 保持される → 同一ユーザー
 * - 新しいタブ                         : 新規ユーザー
 * - タブを閉じる                       : 破棄される
 */
class UserSessionStorage {
    private static readonly USER_ID_KEY = "userId";

    /**
     * 現在のタブに保存されたユーザーIDを取得する。
     *
     * 同じタブ内で URL を変更してページ遷移した場合も、保存済みのユーザーを使用する。
     *
     * @returns ユーザーID。取得できない場合は `undefined`。
     */
    public getUserIdForCurrentNavigation(): number | undefined {
        return this.getUserId();
    }

    /**
     * sessionStorage から保存済みのユーザーIDを取得する。
     *
     * ナビゲーション種別による破棄は行わないため、同一ページ内で
     * すでに登録済みのユーザーを使う操作に利用する。
     *
     * @returns ユーザーID。保存されていない、または不正な値の場合は `undefined`。
     */
    public getUserId(): number | undefined {
        const storedUserId = sessionStorage.getItem(UserSessionStorage.USER_ID_KEY);

        if (storedUserId === null) {
            return undefined;
        }

        const userId = Number(storedUserId);

        return Number.isInteger(userId) && userId > 0 ? userId : undefined;
    }

    /**
     * ユーザーIDを sessionStorage に保存する。
     *
     * sessionStorage は文字列として値を保持するため、
     * number 型のユーザーIDを文字列に変換して保存する。
     *
     * @param userId 保存するユーザーID。
     */
    public setUserId(userId: number): void {
        sessionStorage.setItem(UserSessionStorage.USER_ID_KEY, String(userId));
    }
}

export const userSessionStorage = new UserSessionStorage();
