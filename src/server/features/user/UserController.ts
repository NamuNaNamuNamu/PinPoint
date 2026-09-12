import type { Socket } from "socket.io";
import { userService } from "./UserService";

class UserController {
    public registerUser = (socket: Socket, userName: string) => {
        return userService.addUser(userName, socket.id);
    };

    public getUser = (userId: number | undefined) => {
        return userService.getUser(userId);
    }

    public updateSocketId = (userId: number | undefined, socketId: string) => {
        return userService.updateSocketId(userId, socketId);
    }
}

export const userController = new UserController();