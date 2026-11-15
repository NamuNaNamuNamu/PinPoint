import { MainMenu } from "@excalidraw/excalidraw";
import { useState } from "react";

import { useIsRoomCreator } from "../features/room/roomRoleStore";
import { downloadScoreList } from "../features/score/downloadScoreList";
import { useScoreListEnabled } from "../features/score/scoreListStore";
import { socketController } from "../socket/SocketController";
import { listOrderedIcon, usersIcon } from "./icons";
import { ParticipantManagementDialog } from "./ParticipantManagementDialog";
import { ProblemOperationDialog } from "./ProblemOperationDialog";
import { RoomSettingsDialog } from "./RoomSettingsDialog";
import { ScoreListDialog } from "./ScoreListDialog";
import { ShareDialog } from "./ShareDialog/ShareDialog";

type Props = {
    currentRoomId: string | undefined;
    onCurrentRoomIdChange: (roomId: string | undefined) => void;
};

/**
 * 通信モード・得点一覧・作成者向け参加者管理および得点一覧ダウンロードを提供する Excalidraw のメインメニュー。
 *
 * 作成者向けの操作は、接続中のルームで現在のクライアントが作成者の場合だけ表示する。
 */
function ExcalidrawMainMenu({ currentRoomId, onCurrentRoomIdChange }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isScoreListOpen, setIsScoreListOpen] = useState(false);
    const [isParticipantManagementOpen, setIsParticipantManagementOpen] = useState(false);
    const [isProblemOperationOpen, setIsProblemOperationOpen] = useState(false);
    const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
    const scoreListEnabled = useScoreListEnabled();
    const isRoomCreator = useIsRoomCreator();
    const scoreListAvailable = currentRoomId !== undefined && scoreListEnabled;

    return (
        <>
            <MainMenu>
                <MainMenu.Item
                    icon={usersIcon}
                    onSelect={() => {
                        setIsDialogOpen(true);
                    }}
                >
                    通信モード
                </MainMenu.Item>
                <MainMenu.Item
                    aria-disabled={!scoreListAvailable}
                    className={scoreListAvailable ? undefined : "ScoreListMenuItem--disabled"}
                    disabled={!scoreListAvailable}
                    icon={listOrderedIcon}
                    onSelect={() => {
                        if (scoreListAvailable) {
                            setIsScoreListOpen(true);
                        }
                    }}
                >
                    得点一覧
                </MainMenu.Item>
                {currentRoomId && isRoomCreator && (
                    <MainMenu.Item icon={listOrderedIcon} onSelect={() => setIsProblemOperationOpen(true)}>
                        問題操作
                    </MainMenu.Item>
                )}
                {currentRoomId && isRoomCreator && (
                    <MainMenu.Item icon={usersIcon} onSelect={() => setIsRoomSettingsOpen(true)}>
                        ルーム設定
                    </MainMenu.Item>
                )}
                {currentRoomId && isRoomCreator && (
                    <MainMenu.Item icon={usersIcon} onSelect={() => setIsParticipantManagementOpen(true)}>
                        参加者管理
                    </MainMenu.Item>
                )}
                {currentRoomId && isRoomCreator && (
                    <MainMenu.Item
                        icon={listOrderedIcon}
                        onSelect={() => {
                            void socketController.getScoreReport(currentRoomId).then((scores) => {
                                if (scores) downloadScoreList(scores);
                            });
                        }}
                    >
                        得点一覧をダウンロード
                    </MainMenu.Item>
                )}
            </MainMenu>

            {isDialogOpen && (
                <ShareDialog
                    closeDialog={() => setIsDialogOpen(false)}
                    currentRoomId={currentRoomId}
                    onCurrentRoomIdChange={onCurrentRoomIdChange}
                />
            )}
            {isScoreListOpen && <ScoreListDialog closeDialog={() => setIsScoreListOpen(false)} />}
            {isParticipantManagementOpen && currentRoomId && (
                <ParticipantManagementDialog
                    roomId={currentRoomId}
                    closeDialog={() => setIsParticipantManagementOpen(false)}
                />
            )}
            {isProblemOperationOpen && currentRoomId && <ProblemOperationDialog roomId={currentRoomId} closeDialog={() => setIsProblemOperationOpen(false)} />}
            {isRoomSettingsOpen && currentRoomId && <RoomSettingsDialog roomId={currentRoomId} closeDialog={() => setIsRoomSettingsOpen(false)} />}
        </>
    );
}

export default ExcalidrawMainMenu;
