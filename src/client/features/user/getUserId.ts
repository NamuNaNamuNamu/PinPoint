/**
 * sessionStorage からユーザーIDを取得する。
 *
 * ユーザーIDはサーバー側で生成するため、
 * sessionStorage に保存されていない場合は undefined を返す。
 *
 * sessionStorage とユーザーIDの関係:
 * - ページリロード               : 保持される → 同一ユーザー
 * - 同じタブ内でのページ遷移     : 保持される → 同一ユーザー
 * - タブを閉じる                 : 破棄される
 * - 新しくサイトへアクセス       : IDなし → サーバー側で新規ユーザーを生成
 */
export function getUserId(): number | undefined {
    const storedUserId = sessionStorage.getItem("userId");

    if (storedUserId === null) {
        return undefined;
    }

    const userId = Number(storedUserId);

    return Number.isNaN(userId)
        ? undefined
        : userId;
}