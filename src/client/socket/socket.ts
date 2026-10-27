import { io } from "socket.io-client";

/**
 * Socket.IO サーバーとの通信に使用するクライアントソケット。
 *
 * 現在のページと同一オリジンの Socket.IO サーバーへ接続する。
 * アプリケーション全体で同一のソケットインスタンスを共有するため、
 * シングルトンとして生成・エクスポートする。
 */
export const socket = io();
