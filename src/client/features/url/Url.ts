export type InitialRoomCommand = {
    roomId: string;
    deleteExternalElements: boolean;
    scoreReset: boolean;
    scoreSetUser?: number;
    scoreSetValue?: number;
};

class Url {
    /**
     * URLのクエリパラメータから room パラメータを取得する
     *
     * 例:
     * http://localhost:5173/?room=abc123 → "abc123"
     * http://localhost:5173/            → null
     */
    public getRoomIdFromParams = (): string | null => {
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get("room");

        return roomId;
    };

    /**
     * URL の `deleteExternalElements` が文字列 `true` かを判定する。
     *
     * @returns `true` が明示された場合は `true`。
     */
    public shouldDeleteExternalElements = (): boolean => {
        return new URLSearchParams(window.location.search).get("deleteExternalElements") === "true";
    };

    /**
     * URL の `scoreReset` が文字列 `true` かを判定する。
     *
     * @returns `true` が明示された場合は `true`。
     */
    public shouldResetScores = (): boolean => {
        return new URLSearchParams(window.location.search).get("scoreReset") === "true";
    };

    /**
     * URL の `scoreSetUser` を得点補正対象の正の整数として取得する。
     *
     * @returns 正の整数が指定された場合はそのユーザー ID。未指定または無効値の場合は `undefined`。
     */
    public getScoreSetUserFromParams = (): number | undefined => {
        const rawValue = new URLSearchParams(window.location.search).get("scoreSetUser");
        if (rawValue === null) return undefined;
        const value = Number(rawValue);
        return Number.isInteger(value) && value > 0 ? value : undefined;
    };

    /**
     * URL の `scoreSetValue` を補正後得点の 0 以上の整数として取得する。
     *
     * @returns 0 以上の整数が指定された場合はその得点。未指定または無効値の場合は `undefined`。
     */
    public getScoreSetValueFromParams = (): number | undefined => {
        const rawValue = new URLSearchParams(window.location.search).get("scoreSetValue");
        if (rawValue === null) return undefined;
        const value = Number(rawValue);
        return Number.isInteger(value) && value >= 0 ? value : undefined;
    };

    /**
     * 現在の URL を、ページ遷移時に一度だけ実行する入室・問題操作として読み取る。
     *
     * @returns room パラメータがある場合はその操作内容。ない場合は `undefined`。
     */
    public getInitialRoomCommand = (): InitialRoomCommand | undefined => {
        const roomId = this.getRoomIdFromParams();
        if (!roomId) {
            return undefined;
        }

        return {
            roomId,
            deleteExternalElements: this.shouldDeleteExternalElements(),
            scoreReset: this.shouldResetScores(),
            ...(this.getScoreSetUserFromParams() === undefined
                ? {}
                : { scoreSetUser: this.getScoreSetUserFromParams() }),
            ...(this.getScoreSetValueFromParams() === undefined
                ? {}
                : { scoreSetValue: this.getScoreSetValueFromParams() }),
        };
    };

    /**
     * 現在の URL の pathname を保ち、room パラメータだけを持つ URL を生成する。
     *
     * 例:
     * http://localhost:5173/ → http://localhost:5173/?room=abc123
     */
    public createRoomUrl = (roomId: string): string => {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("room", roomId);
        return url.toString();
    };

    /**
     * 現在のURLに room パラメータを設定する。
     *
     * ブラウザの履歴を追加せず、現在のURLを置き換える。
     *
     * 例:
     * http://localhost:5173/ → http://localhost:5173/?room=abc123
     *
     * @param roomId 設定するルームID
     */
    public replaceRoomUrl = (roomId: string): void => {
        window.history.replaceState(null, "", this.createRoomUrl(roomId));
    };
}

export const url = new Url();
