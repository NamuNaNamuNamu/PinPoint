import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketController } from "./socket/SocketController";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*" // 本番ではアプリURLを指定する
    },
});

io.on("connection", (socket) => {
    socketController.register(socket);
});

httpServer.listen(3001, () => {
    console.log("Server started: http://localhost:3001");
});