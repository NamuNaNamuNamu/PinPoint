import { MainMenu } from "@excalidraw/excalidraw"
import { usersIcon } from "./icons";
import { socketController } from "../socket/SocketController";
import { useState } from "react";

import { ShareDialog } from "./ShareDialog/ShareDialog";

function ExcalidrawMainMenu() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();

    return (
        <>
            <MainMenu>
                <MainMenu.Item
                    icon = {usersIcon}
                    onSelect = {async () => {
                        // URL発行

                        // 画面に出力する
                        //   URL

                        //   QRコード

                        // とりあえず画面を出すところから始めてみる
                        const roomId = await socketController.getRoomId();
                        setCurrentRoomId(roomId);
                        setIsDialogOpen(true);
                    }}
                >
                通信モード
                </MainMenu.Item>
            </MainMenu>

            {isDialogOpen && (
                <ShareDialog
                    closeDialog = {() => setIsDialogOpen(false)}
                    initCurrentRoomId = { currentRoomId }
                />
            )}
        </>
    )
}

export default ExcalidrawMainMenu;