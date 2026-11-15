import type { ScoreEntry } from "../../../shared/score/ScoreEvents";

const RANK_COLORS = ["#d4af37", "#8b8b8b", "#b87333"] as const;
const RANK_EMOJIS = ["🥇", "🥈", "🥉"] as const;

/** 現在得点を単体で開けるHTMLファイルとしてブラウザへダウンロードさせる。 */
export function downloadScoreList(scores: readonly ScoreEntry[]): void {
    const sorted = [...scores].sort(
        (left, right) => right.score - left.score || left.userName.localeCompare(right.userName),
    );
    const rows = sorted.map((entry, index) => {
        const label = `${index + 1}位　${escapeHtml(entry.userName)}　${entry.score}点`;
        return index < 3
            ? `<section style="color:${RANK_COLORS[index]}"><h2>${RANK_EMOJIS[index]} ${label}</h2></section>`
            : `<li>${label}</li>`;
    });
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>得点一覧</title><style>body{font-family:sans-serif;max-width:720px;margin:48px auto;padding:0 24px}h1{font-size:32px}h2{font-size:28px}.other-ranks{font-size:20px;line-height:1.8}</style></head><body><h1>得点一覧</h1>${rows.filter((_, index) => index < 3).join("")}<ol class="other-ranks" start="4">${rows.filter((_, index) => index >= 3).join("")}</ol></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getFileName();
    anchor.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
    return value.replace(
        /[&<>'"]/g,
        (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!,
    );
}

function getFileName(): string {
    const now = new Date();

    const timestamp =
        [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join(
            "",
        ) +
        "_" +
        [
            String(now.getHours()).padStart(2, "0"),
            String(now.getMinutes()).padStart(2, "0"),
            String(now.getSeconds()).padStart(2, "0"),
        ].join("");

    return `${timestamp}_pinpoint-score-list.html`;
}
