import express from "express";
import { createServer } from "http";
import path from "path";
import { type DisconnectReason, Server, Socket } from "socket.io";
import { fileURLToPath } from "url";

import { socketLogger } from "./logging/SocketLogger";
import { getLocalIPAddress } from "./network/getLocalIPAddress";
import { SocketController } from "./socket/SocketController";

const { app, io, httpServer } = createServerEntryPoint();

// 各クライアントとのコネクションごとにスレッドが生成されるように。
io.on("connection", (socket) => {
    onConnect(socket);
});

socketLogger.setIo(io);

prepareClientEntryPoint(app);

httpServer.listen(3001, () => {
    console.log(`Server started: http://${getLocalIPAddress()}:3001\n`);
});

/**
 * Express、HTTPサーバー、Socket.IOサーバーを生成する。
 *
 * @returns 生成したアプリケーションとサーバー群
 */
function createServerEntryPoint() {
    const app = express();
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
        cors: {
            origin: "*", // 本番ではアプリURLを指定する
        },
    });

    return { app, io, httpServer };
}

/**
 * 新しいソケット接続を初期化し、切断時の後処理を登録する。
 *
 * @param socket 接続したクライアントのソケット
 */
function onConnect(socket: Socket) {
    const socketController = new SocketController(socket);
    socketController.register();

    socketLogger.outputAllSockets({
        event: "接続",
        socketId: socket.id,
    });

    socket.on("disconnect", (reason) => {
        onDisconnect(socket, reason);
    });
}

/**
 * 切断したユーザーをログ出力し、参加中のルームから退室させる。
 *
 * ユーザー情報を取得できない場合は、ルーム操作を行わない。
 *
 * @param socket 切断したクライアントのソケット
 * @param reason Socket.IOが通知した切断理由
 */
function onDisconnect(socket: Socket, reason: DisconnectReason) {
    socketLogger.outputAllSockets({
        event: `切断（理由: ${reason}）`,
        socketId: socket.id,
    });
}

// 以下、デプロイ時起動用コード
/**
 * ビルド済みクライアントを配信するExpressルートを設定する。
 * npm run server だけで、server ディレクトリと client ディレクトリがどちらも起動するようにする。
 *
 * @param app 設定対象のExpressアプリケーション
 */
function prepareClientEntryPoint(app: express.Express) {
    const __filename = fileURLToPath(import.meta.url); // このファイルの絶対パス
    const __dirname = path.dirname(__filename);
    const distRelativePath = "../../dist";

    app.use(express.static(path.join(__dirname, distRelativePath)));

    app.use((_req, res) => {
        res.sendFile(path.join(__dirname, `${distRelativePath}/index.html`));
    });
}
