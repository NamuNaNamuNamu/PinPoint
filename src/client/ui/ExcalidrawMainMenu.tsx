import { MainMenu } from "@excalidraw/excalidraw"
import { usersIcon } from "./icons";
import { socketController } from "../socket/SocketController";
import { url } from "../features/url/Url";
import { useState } from "react";

import { ShareDialog } from "./ShareDialog/ShareDialog";

function ExcalidrawMainMenu() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <MainMenu>
                <MainMenu.Item
                    onSelect = {async () => {
                        const room = await socketController.createRoom();
                        socketController.joinRoom(room.id);
                        console.log(url.createRoomUrl(room.id));
                    }}
                >
                temp: 部屋作成
                </MainMenu.Item>
                <MainMenu.Item
                    icon = {usersIcon}
                    onSelect = {() => {
                        // URL発行

                        // 画面に出力する
                        //   URL

                        //   QRコード

                        // とりあえず画面を出すところから始めてみる
                        setIsDialogOpen(true);
                    }}
                >
                通信モード
                </MainMenu.Item>
            </MainMenu>

            {isDialogOpen && (
                <ShareDialog
                    closeDialog = {() => setIsDialogOpen(false)}
                />
            )}
        </>
    )
}

export default ExcalidrawMainMenu;