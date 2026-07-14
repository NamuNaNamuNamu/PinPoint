import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketController } from "./socket/SocketController";
import { socketLogger } from "./logging/SocketLogger";

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
    socketLogger.outputAllSockets(io, `接続: ${socket.id}`);

    socket.on("disconnect", (reason) => {
        socketLogger.outputAllSockets(io, `切断: ${socket.id}\n理由: ${reason}`);
    })
});

httpServer.listen(3001, () => {
    console.log("Server started: http://localhost:3001");
});