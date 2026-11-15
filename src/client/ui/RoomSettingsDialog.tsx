import { useScoreListEnabled } from "../features/score/scoreListStore";
import { useRoomSettings } from "../features/room/roomSettingsStore";
import { socketController } from "../socket/SocketController";
import { Dialog } from "./ShareDialog/Dialog";

type Props = { roomId: string; closeDialog: () => void };

/** ホストがルーム全体の表示設定を変更する画面。 */
export function RoomSettingsDialog({ roomId, closeDialog }: Props) {
    const { cursorRevealed, answerBarReveal } = useRoomSettings();
    const scoreListEnabled = useScoreListEnabled();
    const toggleAnswerBarReveal = async () => {
        await socketController.controlCurrent({ roomId, deleteExternalElements: false, scrollToContent: false, answerBarReveal: !answerBarReveal });
    };
    return (
        <Dialog onCloseRequest={closeDialog} title="ルーム設定" size="regular">
            <h2 id="dialog-title">ルーム設定</h2>
            <section><h3>カーソル表示</h3><p>現在: {cursorRevealed ? "表示中" : "非表示"}</p><button type="button" onClick={() => void socketController.setCursorRevealed(roomId, !cursorRevealed)}>{cursorRevealed ? "非表示にする" : "表示にする"}</button></section>
            <section><h3>他チーム正解バー表示</h3><p>現在: {answerBarReveal ? "表示中" : "非表示"}</p><button type="button" onClick={() => void toggleAnswerBarReveal()}>{answerBarReveal ? "非表示にする" : "表示にする"}</button></section>
            <section><h3>得点一覧</h3><p>現在: {scoreListEnabled ? "有効" : "無効"}</p><button type="button" onClick={() => void socketController.setScoreListEnabled(roomId, !scoreListEnabled)}>{scoreListEnabled ? "無効にする" : "有効にする"}</button></section>
        </Dialog>
    );
}
