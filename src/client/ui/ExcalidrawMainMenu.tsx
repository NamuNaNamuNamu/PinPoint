import { MainMenu } from "@excalidraw/excalidraw";
import { useState } from "react";

import { useScoreListEnabled } from "../features/score/scoreListStore";
import { listOrderedIcon, usersIcon } from "./icons";
import { ScoreListDialog } from "./ScoreListDialog";
import { ShareDialog } from "./ShareDialog/ShareDialog";

type Props = {
    currentRoomId: string | undefined;
    onCurrentRoomIdChange: (roomId: string | undefined) => void;
};

/**
 * 通信モードの開始と共有ダイアログの表示を行う Excalidraw のメインメニュー。
 */
function ExcalidrawMainMenu({ currentRoomId, onCurrentRoomIdChange }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isScoreListOpen, setIsScoreListOpen] = useState(false);
    const scoreListEnabled = useScoreListEnabled();
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
            </MainMenu>

            {isDialogOpen && (
                <ShareDialog
                    closeDialog={() => setIsDialogOpen(false)}
                    currentRoomId={currentRoomId}
                    onCurrentRoomIdChange={onCurrentRoomIdChange}
                />
            )}
            {isScoreListOpen && <ScoreListDialog closeDialog={() => setIsScoreListOpen(false)} />}
        </>
    );
}

export default ExcalidrawMainMenu;
