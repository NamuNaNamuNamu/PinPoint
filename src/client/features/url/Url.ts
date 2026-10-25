export type InitialRoomCommand = {
    roomId: string;
    questionId: number | undefined;
    deleteExternalElements: boolean;
    reveal: boolean;
    scrollToContent: boolean;
    hasScrollToContentParam: boolean;
    scoreReset: boolean;
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
     * URL の `question` パラメータを正の整数として取得する。
     *
     * @returns 問題 ID。未指定または正の整数以外の場合は `undefined`。
     */
    public getQuestionIdFromParams = (): number | undefined => {
        const value = new URLSearchParams(window.location.search).get("question");
        const questionId = Number(value);
        return Number.isInteger(questionId) && questionId > 0 ? questionId : undefined;
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
     * URL の `reveal` が文字列 `true` かを判定する。
     *
     * @returns `true` が明示された場合は `true`。
     */
    public shouldReveal = (): boolean => {
        return new URLSearchParams(window.location.search).get("reveal") === "true";
    };

    /**
     * URL の `scrollToContent` に従い、問題適用後に表示範囲を合わせるかを判定する。
     *
     * @returns 文字列 `true` が明示された場合だけ `true`。未指定を含むそれ以外は `false`。
     */
    public shouldScrollToContent = (): boolean => {
        return new URLSearchParams(window.location.search).get("scrollToContent") === "true";
    };

    /**
     * URL に `scrollToContent` が明示されているかを判定する。
     *
     * @returns パラメータが存在する場合は `true`。
     */
    public hasScrollToContentParam = (): boolean => {
        return new URLSearchParams(window.location.search).has("scrollToContent");
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
            questionId: this.getQuestionIdFromParams(),
            deleteExternalElements: this.shouldDeleteExternalElements(),
            reveal: this.shouldReveal(),
            scrollToContent: this.shouldScrollToContent(),
            hasScrollToContentParam: this.hasScrollToContentParam(),
            scoreReset: this.shouldResetScores(),
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
