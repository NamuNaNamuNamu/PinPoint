import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketController } from "./socket/SocketController";
import { socketLogger } from "./logging/SocketLogger";
import { roomState } from "./features/room/RoomState";
import { roomLogger } from "./logging/RoomLogger";

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

httpServer.listen(3001, () => {
    console.log("Server started: http://192.168.3.23:3001");
});