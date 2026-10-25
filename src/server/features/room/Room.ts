import type { User } from "../user/User";
import { randomUUID } from "node:crypto";

/**
 * Socket 切断後、同じユーザーの再接続を待つ猶予時間（ミリ秒）。
 */
export const ROOM_RECONNECT_GRACE_MS = 30_000;

/**
 * ユーザーが参加するルームを表す。
 */
export class Room {
    private id: string;
    private readonly creatorUserId: number;
    private users: User[] = [];
    private currentQuestionId: number | undefined;
    private answerRevealed = false;
    private scoreListEnabled = true;
    private readonly disconnectTokensByUserId = new Map<number, string>();

    /**
     * ルームを生成する。
     *
     * @param params ルームの初期設定。
     */
    constructor(params: RoomParams) {
        this.id = params.id;
        this.creatorUserId = params.creatorUserId;
    }

    /**
     * ルーム ID を取得する。
     *
     * @returns ルーム ID。
     */
    public getId(): string {
        return this.id;
    }

    /**
     * 指定ユーザーがこのルームの作成者かを判定する。
     *
     * @param userId 判定するユーザー ID。
     * @returns 作成者である場合は `true`。
     */
    public isCreatedBy(userId: number): boolean {
        return this.creatorUserId === userId;
    }

    /**
     * 参加中ユーザーの ID を取得する。
     *
     * @returns 参加順を維持したユーザー ID 一覧。
     */
    public getUserIds(): readonly number[] {
        return this.users.map((user) => user.getId());
    }

    /**
     * 現在適用中の問題 ID を取得する。
     *
     * @returns 問題が未適用の場合は `undefined`。
     */
    public getCurrentQuestionId(): number | undefined {
        return this.currentQuestionId;
    }

    /**
     * 現在の問題を設定し、正解表示を隠す。
     *
     * @param questionId 新たに適用する問題 ID。
     */
    public setCurrentQuestionId(questionId: number): void {
        this.currentQuestionId = questionId;
        this.answerRevealed = false;
    }

    /** 現在の問題の正解を表示済みにする。 */
    public revealAnswer(): void {
        this.answerRevealed = true;
    }

    /**
     * 現在の問題の正解が表示済みかを返す。
     *
     * @returns 正解表示済みの場合は `true`。
     */
    public isAnswerRevealed(): boolean {
        return this.answerRevealed;
    }

    /**
     * 得点一覧を参加者へ表示できるかを返す。
     *
     * @returns 表示可能な場合は `true`。
     */
    public isScoreListEnabled(): boolean {
        return this.scoreListEnabled;
    }

    /**
     * 得点一覧の表示可否を更新する。
     *
     * @param enabled 更新後の表示可否。
     * @returns 状態が変化した場合は `true`。
     */
    public setScoreListEnabled(enabled: boolean): boolean {
        if (this.scoreListEnabled === enabled) {
            return false;
        }
        this.scoreListEnabled = enabled;
        return true;
    }

    /**
     * ユーザーをルームに追加する。
     *
     * @param user 追加するユーザー。
     */
    public addUser(user: User): void {
        this.disconnectTokensByUserId.delete(user.getId());
        if (this.hasUser(user.getId())) {
            return;
        }

        this.users.push(user);
    }

    /**
     * 指定した ID のユーザーをルームから削除する。
     *
     * @param userId 削除するユーザー ID。
     */
    public removeUserById(userId: number): void {
        this.disconnectTokensByUserId.delete(userId);
        this.users = this.users.filter((user) => user.getId() !== userId);
    }

    /**
     * 切断猶予を識別する世代トークンを記録する。
     *
     * @param userId 切断した参加ユーザー ID。
     * @returns 発行したトークン。参加者でない場合は `undefined`。
     */
    public markDisconnected(userId: number): string | undefined {
        if (!this.hasUser(userId)) {
            return undefined;
        }
        const token = randomUUID();
        this.disconnectTokensByUserId.set(userId, token);
        return token;
    }

    /**
     * 指定トークンの切断猶予が継続している場合だけユーザーを退出させる。
     *
     * @param userId 退出候補のユーザー ID。
     * @param token 切断時に発行した世代トークン。
     * @returns ユーザーを削除した場合は `true`。
     */
    public removeIfStillDisconnected(userId: number, token: string): boolean {
        if (this.disconnectTokensByUserId.get(userId) !== token) {
            return false;
        }
        this.removeUserById(userId);
        return true;
    }

    /**
     * 参加ユーザーのソケット ID 一覧を取得する。
     *
     * @returns 参加ユーザーのソケット ID 一覧。
     */
    public getSocketIds(): string[] {
        return this.users.map((user) => user.getSocketId());
    }

    /**
     * 指定した ID のユーザーが参加しているかを判定する。
     *
     * @param userId 検索するユーザー ID。
     * @returns ユーザーが参加している場合は `true`。
     */
    public hasUser(userId: number): boolean {
        return this.users.some((user) => user.getId() === userId);
    }

    /**
     * 参加ユーザーがいないかを判定する。
     *
     * @returns 参加ユーザーがいない場合は `true`。
     */
    public isEmpty(): boolean {
        return this.users.length === 0;
    }
}

/**
 * `Room` を生成するための初期設定を表す。
 */
interface RoomParams {
    id: string;
    creatorUserId: number;
}
