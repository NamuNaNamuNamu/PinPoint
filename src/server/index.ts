import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketController } from "./socket/SocketController";
import { socketLogger } from "./logging/SocketLogger";
import { roomState } from "./features/room/RoomState";
import { roomLogger } from "./logging/RoomLogger";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*" // 本番ではアプリURLを指定する
    },
});

io.on("connection", (socket) => {
    const socketController = new SocketController(socket);
    socketController.register();
    socketLogger.setIo(io);
    
    socketLogger.outputAllSockets(`接続: ${socket.id}`);

    socket.on("disconnect", (reason) => {
        socketLogger.outputAllSockets(`切断: ${socket.id}\n理由: ${reason}`);
        roomState.leave(socket.id);
        roomLogger.outputRoomState(roomState);
    })
});

// 以下、デプロイ時起動用コード
// npm run server だけで、server ディレクトリと client ディレクトリがどちらも起動するようにする。
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../../dist")));

app.use((_req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];

        if (!iface) continue;

        for (const net of iface) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return "localhost";
}

const ip = getLocalIPAddress();

httpServer.listen(3001, () => {
    console.log(`Server started: http://${ip}:3001`);
});