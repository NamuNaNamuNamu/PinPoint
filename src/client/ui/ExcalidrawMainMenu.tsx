import { MainMenu } from "@excalidraw/excalidraw";
import { useState } from "react";

import { usersIcon } from "./icons";
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
            </MainMenu>

            {isDialogOpen && (
                <ShareDialog
                    closeDialog={() => setIsDialogOpen(false)}
                    currentRoomId={currentRoomId}
                    onCurrentRoomIdChange={onCurrentRoomIdChange}
                />
            )}
        </>
    );
}

export default ExcalidrawMainMenu;
