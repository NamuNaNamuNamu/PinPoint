import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { scoreListStore } from "./scoreListStore";

/** サーバーからの得点一覧の有効状態通知を購読する。 */
export function registerScoreListListener(): void {
    socket.off(SocketEvents.SCORE_LIST_ENABLED_UPDATED);
    socket.on(SocketEvents.SCORE_LIST_ENABLED_UPDATED, (payload: { enabled: boolean }) => {
        scoreListStore.set(payload.enabled);
    });
}
