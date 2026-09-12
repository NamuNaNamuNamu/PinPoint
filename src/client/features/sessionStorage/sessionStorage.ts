/**
 * sessionStorage を利用してユーザー情報を管理するクラス。
 *
 * ユーザーID自体の生成はサーバー側で行い、
 * クライアント側ではサーバーから払い出されたユーザーIDの
 * 保存・取得のみを行う。
 *
 * sessionStorage とユーザーIDの関係:
 * - ページリロード               : 保持される → 同一ユーザー
 * - 同じタブ内でのページ遷移     : 保持される → 同一ユーザー
 * - タブを閉じる                 : 破棄される
 * - 新しくサイトへアクセス       : IDなし → サーバー側で新規ユーザーを生成
 */
class UserSessionStorage {
    private static readonly USER_ID_KEY = "userId";

    /**
     * sessionStorage からユーザーIDを取得する。
     *
     * ユーザーIDが保存されていない場合、
     * または保存されている値を数値に変換できない場合は undefined を返す。
     *
     * @returns ユーザーID。取得できない場合は undefined。
     */
    public getUserId(): number | undefined {
        const storedUserId = sessionStorage.getItem(
            UserSessionStorage.USER_ID_KEY
        );

        if (storedUserId === null) {
            return undefined;
        }

        const userId = Number(storedUserId);

        return Number.isNaN(userId)
            ? undefined
            : userId;
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
        sessionStorage.setItem(
            UserSessionStorage.USER_ID_KEY,
            String(userId)
        );
    }
}

export const userSessionStorage = new UserSessionStorage();