import { MainMenu } from "@excalidraw/excalidraw"
import { usersIcon } from "./icons";
import { socketController } from "../socket/SocketController";
import { url } from "../features/url/Url";
import { useState } from "react";

import { ShareDialog } from "./RoomURLDialog";

function ExcalidrawMainMenu() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <MainMenu>
                <MainMenu.Item
                    icon = {usersIcon}
                    onSelect = {() => {
                        // const roomNumber = prompt("ルーム番号を入力してね") ?? null;
                        // if (roomNumber) socketController.joinRoom(roomNumber); // TODO: ルーム参加の仕組みを整える（UI作成してそれトリガーに発火）
                        // if (roomNumber) alert(`${roomNumber} に部屋参加`);

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