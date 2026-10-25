import { useSyncExternalStore } from "react";
import { scoreStore } from "../features/score/scoreStore";

type Props = { userId: number | undefined };

/**
 * Excalidraw の右上へ固定表示する、現在ユーザーの累積得点。
 *
 * @param props 表示対象となる操作ユーザー ID。
 * @returns Excalidraw の固定 UI に配置する得点表示。
 */
export function CurrentScore({ userId }: Props) {
    const scores = useSyncExternalStore(scoreStore.subscribe, scoreStore.getSnapshot);
    const score = scores.find((entry) => entry.userId === userId)?.score ?? 0;
    return (
        <div style={{ background: "var(--island-bg-color)", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            得点: {score}
        </div>
    );
}
