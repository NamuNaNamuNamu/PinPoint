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
     * 現在のURLに room パラメータを付与したURLを生成する
     *
     * 例:
     * http://localhost:5173/ → http://localhost:5173/?room=abc123
     */
    public createRoomUrl = (roomId: string): string => {
        const url = new URL(window.location.href);
        url.searchParams.set("room", roomId);
        return url.toString();
    };
}

export const url = new Url();