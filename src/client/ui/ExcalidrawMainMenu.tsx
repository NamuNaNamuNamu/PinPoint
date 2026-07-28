import { MainMenu } from "@excalidraw/excalidraw"
import { usersIcon } from "./UsersIcon";
import { socketController } from "../socket/SocketController";

function ExcalidrawMainMenu() {
    return (
        <MainMenu>
            <MainMenu.Item
                icon = {usersIcon}
                onSelect = {() => {
                    const roomNumber = prompt("ルーム番号を入力してね") ?? null;
                    if (roomNumber) socketController.joinRoom(roomNumber); // TODO: ルーム参加の仕組みを整える（UI作成してそれトリガーに発火）
                    if (roomNumber) alert(`${roomNumber} に部屋参加`);
                }}
            >
            通信モード
            </MainMenu.Item>
        </MainMenu>
    )
}

export default ExcalidrawMainMenu;