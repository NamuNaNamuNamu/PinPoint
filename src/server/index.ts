import express from "express"
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { SocketController } from "./socket/SocketController";
import { socketLogger } from "./logging/SocketLogger";
import { roomState } from "./features/room/RoomState";
import { roomLogger } from "./logging/RoomLogger";
import path from "path";
import { fileURLToPath } from "url";
import { getLocalIPAddress } from "./network/getLocalIPAddress";

const {app, io, httpServer} = createServerEntryPoint();

// 各クライアントとのコネクションごとにスレッドが生成されるように。
io.on("connection", (socket) => {
    onConnect(socket);
});

socketLogger.setIo(io);

prepareClientEntryPoint(app);

httpServer.listen(3001, () => {
    console.log(`Server started: http://${getLocalIPAddress()}:3001\n`);
});

function createServerEntryPoint() {
    const app = express()
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
        cors: {
            origin: "*" // 本番ではアプリURLを指定する
        },
    });

    return {app, io, httpServer};
}

function onConnect(socket: Socket) {
    const socketController = new SocketController(socket);
    socketController.register();
    
    socketLogger.outputAllSockets({
        event: "接続",
        socketId: socket.id
    });

    socket.on("disconnect", (reason) => {
        socketLogger.outputAllSockets({
            event: `切断（理由: ${reason}）`,
            socketId: socket.id
        });
        roomState.leave(socket.id);
        roomLogger.outputRoomState(roomState);
    })
}

// 以下、デプロイ時起動用コード
// npm run server だけで、server ディレクトリと client ディレクトリがどちらも起動するようにする。
function prepareClientEntryPoint(app: express.Express) {
    const __filename = fileURLToPath(import.meta.url); // このファイルの絶対パス
    const __dirname = path.dirname(__filename);
    const distRelativePath = "../../dist";

    app.use(express.static(path.join(__dirname, distRelativePath)));

    app.use((_req, res) => {
        res.sendFile(path.join(__dirname, `${distRelativePath}/index.html`));
    });
}