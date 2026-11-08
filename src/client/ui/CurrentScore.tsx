import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useHasCurrentQuestion } from "../features/question/questionStore";
import { animateNumber } from "../features/score/animateNumber";
import { animateOpacity } from "../features/score/animateOpacity";
import { scoreStore } from "../features/score/scoreStore";

type Props = { userId: number | undefined };

/**
 * 現在問題中の参加者だけに表示する、現在ユーザーの累積得点バッジ。
 *
 * @param props 表示対象となる操作ユーザー ID。
 * @returns Excalidraw の固定 UI に配置する得点表示。
 */
export function CurrentScore({ userId }: Props) {
    const scoreSnapshot = useSyncExternalStore(scoreStore.subscribe, scoreStore.getSnapshot);
    const hasCurrentQuestion = useHasCurrentQuestion();
    const score = scoreSnapshot.scores.find((entry) => entry.userId === userId)?.score;
    const [displayedScore, setDisplayedScore] = useState(score ?? 0);
    const [isAnimating, setIsAnimating] = useState(false);
    const displayedScoreRef = useRef(displayedScore);
    const [addedScore, setAddedScore] = useState<{ value: number; opacity: number }>();

    useEffect(() => {
        displayedScoreRef.current = displayedScore;
    }, [displayedScore]);

    useEffect(() => {
        if (score === undefined) {
            return;
        }
        const start = displayedScoreRef.current;
        if (scoreSnapshot.reason !== "scored" && scoreSnapshot.reason !== "recovered") {
            setDisplayedScore(score);
            setIsAnimating(false);
            return;
        }
        if (start === score) {
            return;
        }
        const delta = score - start;
        let removeOpacityAnimation: (() => void) | undefined;
        let removeTimer: ReturnType<typeof setTimeout> | undefined;
        let removeTextTimer: ReturnType<typeof setTimeout> | undefined;
        if (delta > 0) {
            setAddedScore({ value: delta, opacity: 1 });
            removeTimer = setTimeout(() => {
                removeOpacityAnimation = animateOpacity({
                    duration: 1250,
                    onUpdate: (opacity) => setAddedScore({ value: delta, opacity }),
                });
            }, 2500);
            removeTextTimer = setTimeout(() => setAddedScore(undefined), 5000);
        }
        setIsAnimating(true);
        const removeNumberAnimation = animateNumber({
            start,
            end: score,
            duration: 5000,
            onUpdate: (value) => {
                setDisplayedScore(value);
                if (value === score) {
                    setIsAnimating(false);
                }
            },
        });
        return () => {
            removeNumberAnimation();
            if (removeTimer) clearTimeout(removeTimer);
            if (removeTextTimer) clearTimeout(removeTextTimer);
            removeOpacityAnimation?.();
        };
    }, [score, scoreSnapshot.reason]);

    if (!hasCurrentQuestion || score === undefined) {
        return null;
    }

    return (
        <div
            className="CurrentScore"
            style={{
                position: "absolute",
                zIndex: 1,
                pointerEvents: "none",
                background: "var(--island-bg-color)",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: isAnimating ? 700 : undefined,
                color: isAnimating ? "#E53935" : undefined,
                fontSize: isAnimating ? "130%" : undefined,
            }}
        >
            得点: {displayedScore}
            {addedScore && (
                <span className="CurrentScore-added" style={{ opacity: addedScore.opacity }}>
                    + {addedScore.value}
                </span>
            )}
        </div>
    );
}
