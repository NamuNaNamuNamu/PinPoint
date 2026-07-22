import { socketController } from "../socket/SocketController";

export const TopRightUI = (
    <button
        style = {{
            background: "#437aad",
            border: "none",
            color: "#fff",
            width: "max-content",
            fontWeight: "bold",
        }}
        onClick = {() => {
            socketController.joinRoom("123"); // TODO: ルーム参加の仕組みを整える（UI作成してそれトリガーに発火）
            alert("123に部屋参加");
        }}
    >
    部屋参加
    </button>
);