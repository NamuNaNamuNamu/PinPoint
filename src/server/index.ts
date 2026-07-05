import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketController } from "./socket/SocketController";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://192.168.3.33:5173",
            "*" // 本番では消す
        ]
    },
});

io.on("connection", (socket) => {
    socketController.register(socket);
});

httpServer.listen(3001, () => {
    console.log("Server started: http://localhost:3001");
});