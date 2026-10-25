import type { ScoresUpdated } from "../../../shared/score/ScoreEvents";
import { SocketEvents } from "../../../shared/SocketEvents";
import { socket } from "../../socket/socket";
import { scoreStore } from "./scoreStore";

/**
 * サーバーからの累積得点通知を UI 用 store へ反映する。
 */
export function registerScoreListener(): void {
    socket.off(SocketEvents.SCORES_UPDATED);
    socket.on(SocketEvents.SCORES_UPDATED, (payload: ScoresUpdated) => scoreStore.set(payload));
}
