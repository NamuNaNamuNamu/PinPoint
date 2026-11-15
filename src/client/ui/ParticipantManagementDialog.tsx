import "./ParticipantManagementDialog.scss";

import { useEffect, useState } from "react";

import type { RoomParticipant } from "../../shared/room/RoomEvents";
import { socketController } from "../socket/SocketController";
import { Dialog } from "./ShareDialog/Dialog";
import { FilledButton } from "./ShareDialog/FilledButton";

type Props = { roomId: string; closeDialog: () => void };

/** ホストが現在の参加・再接続保留ユーザーを確認し、残留者を退出させる画面。 */
export function ParticipantManagementDialog({ roomId, closeDialog }: Props) {
    const [participants, setParticipants] = useState<readonly RoomParticipant[]>([]);
    const refresh = async () => setParticipants((await socketController.getRoomParticipants(roomId)) ?? []);
    useEffect(() => {
        void refresh();
    }, [roomId]);

    return (
        <Dialog onCloseRequest={closeDialog} title="参加者管理" size="regular">
            <div className="ParticipantManagementDialog">
                <h2 id="dialog-title" className="ParticipantManagementDialog__title">
                    参加者管理
                </h2>
                <FilledButton
                    className="ParticipantManagementDialog__refresh"
                    label="更新"
                    size="large"
                    onClick={() => void refresh()}
                />
                <ol className="ParticipantManagementDialog__list">
                    {participants.map((participant) => (
                        <li key={participant.userId} className="ParticipantManagementDialog__participant">
                            {participant.userName}（ID: {participant.userId}）{" "}
                            {participant.isCreator
                                ? "ホスト"
                                : participant.connectionStatus === "reconnecting"
                                  ? "再接続待ち"
                                  : "接続中"}
                            {!participant.isCreator && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void socketController.kickUser(roomId, participant.userId).then(refresh)
                                    }
                                >
                                    退出させる
                                </button>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </Dialog>
    );
}
