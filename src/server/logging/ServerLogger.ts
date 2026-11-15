import type { ServerLogEvent } from "./ServerLogEvents";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogPayload = Record<string, unknown>;

/**
 * Fly の標準出力へ、JST 固定の1行JSON形式の運用ログを出力する。
 */
class ServerLogger {
    /**
     * debug レベルの運用ログを出力する。
     *
     * @param event 検索可能な業務イベント名。
     * @param payload イベントに紐付く任意の JSON プロパティ。
     */
    public debug(event: ServerLogEvent, payload: LogPayload = {}): void {
        this.write("debug", event, payload);
    }

    /**
     * info レベルの運用ログを出力する。
     *
     * @param event 検索可能な業務イベント名。
     * @param payload イベントに紐付く任意の JSON プロパティ。
     */
    public info(event: ServerLogEvent, payload: LogPayload = {}): void {
        this.write("info", event, payload);
    }

    /**
     * warn レベルの運用ログを出力する。
     *
     * @param event 検索可能な業務イベント名。
     * @param payload イベントに紐付く任意の JSON プロパティ。
     */
    public warn(event: ServerLogEvent, payload: LogPayload = {}): void {
        this.write("warn", event, payload);
    }

    /**
     * error レベルの運用ログを出力する。
     *
     * @param event 検索可能な業務イベント名。
     * @param payload イベントに紐付く任意の JSON プロパティ。
     */
    public error(event: ServerLogEvent, payload: LogPayload = {}): void {
        this.write("error", event, payload);
    }

    private write(level: LogLevel, event: ServerLogEvent, payload: LogPayload): void {
        const line = JSON.stringify({ timestamp: formatJstTimestamp(), level, event, ...payload });
        if (level === "error") {
            console.error(line);
        } else if (level === "warn") {
            console.warn(line);
        } else if (level === "debug") {
            console.debug(line);
        } else {
            console.info(line);
        }
    }
}

/**
 * 指定された日時を日本標準時（JST）の ISO 8601 形式の文字列に変換する。
 *
 * @param date 変換対象の日時。省略時は現在日時。
 * @returns JST の日時文字列（yyyy-MM-ddTHH:mm:ss.SSS+09:00）。
 */
function formatJstTimestamp(date: Date = new Date()): string {
    const values = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        hourCycle: "h23",
    })
        .formatToParts(date)
        .reduce<Record<string, string>>((result, part) => {
            if (part.type !== "literal") result[part.type] = part.value;
            return result;
        }, {});
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}.${values.fractionalSecond}+09:00`;
}

/**
 * サーバー運用ログを出力する共有ロガー。
 */
export const serverLogger = new ServerLogger();
