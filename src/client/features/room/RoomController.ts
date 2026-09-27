/**
 * ルームの作成・参加に関する操作を受け付ける。
 */
class RoomController {
    /**
     * ルーム作成時のメッセージを出力する。
     *
     * @param consoleLog 出力するメッセージ。
     */
    public createRoom = (consoleLog: string) => {
        console.log(consoleLog);
    }

    /**
     * ルーム参加時のメッセージを出力する。
     *
     * @param consoleLog 出力するメッセージ。
     */
    public joinRoom = (consoleLog: string) => {
        console.log(consoleLog);
    };
}

export const roomController = new RoomController();
