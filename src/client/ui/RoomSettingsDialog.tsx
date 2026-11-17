import "./RoomSettingsDialog.scss";

import { useRoomSettings } from "../features/room/roomSettingsStore";
import { useScoreListEnabled } from "../features/score/scoreListStore";
import { socketController } from "../socket/SocketController";
import { Dialog } from "./ShareDialog/Dialog";
import { FilledButton } from "./ShareDialog/FilledButton";

type Props = { roomId: string; closeDialog: () => void };

/** ホストがルーム全体の表示設定を変更する画面。 */
export function RoomSettingsDialog({ roomId, closeDialog }: Props) {
    const { cursorRevealed, answerBarReveal } = useRoomSettings();
    const scoreListEnabled = useScoreListEnabled();
    const toggleAnswerBarReveal = async () => {
        await socketController.controlCurrentQuestion({
            roomId,
            deleteExternalElements: false,
            scrollToContent: false,
            answerBarReveal: !answerBarReveal,
        });
    };
    return (
        <Dialog onCloseRequest={closeDialog} title="ルーム設定" size="regular">
            <div className="RoomSettingsDialog">
                <h2 id="dialog-title" className="RoomSettingsDialog__title">
                    ルーム設定
                </h2>
                <section className="RoomSettingsDialog__section">
                    <div>
                        <h3 className="RoomSettingsDialog__sectionTitle">カーソル表示</h3>
                        <p className="RoomSettingsDialog__current">現在: {cursorRevealed ? "表示中" : "非表示"}</p>
                    </div>
                    <FilledButton
                        label={cursorRevealed ? "非表示にする" : "表示にする"}
                        size="large"
                        onClick={() => void socketController.setCursorRevealed(roomId, !cursorRevealed)}
                    />
                </section>
                <section className="RoomSettingsDialog__section">
                    <div>
                        <h3 className="RoomSettingsDialog__sectionTitle">他チーム回答バー表示</h3>
                        <p className="RoomSettingsDialog__current">現在: {answerBarReveal ? "表示中" : "非表示"}</p>
                    </div>
                    <FilledButton
                        label={answerBarReveal ? "非表示にする" : "表示にする"}
                        size="large"
                        onClick={() => void toggleAnswerBarReveal()}
                    />
                </section>
                <section className="RoomSettingsDialog__section">
                    <div>
                        <h3 className="RoomSettingsDialog__sectionTitle">得点一覧</h3>
                        <p className="RoomSettingsDialog__current">現在: {scoreListEnabled ? "有効" : "無効"}</p>
                    </div>
                    <FilledButton
                        label={scoreListEnabled ? "無効にする" : "有効にする"}
                        size="large"
                        onClick={() => void socketController.setScoreListEnabled(roomId, !scoreListEnabled)}
                    />
                </section>
            </div>
        </Dialog>
    );
}
