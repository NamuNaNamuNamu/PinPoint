import { useSyncExternalStore } from "react";

import { scoreStore } from "../features/score/scoreStore";
import { Dialog } from "./ShareDialog/Dialog";

type Props = { closeDialog: () => void };

/**
 * 参加者の累積得点を順位順に表示するダイアログ。
 *
 * @param props ダイアログを閉じる関数。
 * @returns 得点一覧ダイアログ。
 */
export function ScoreListDialog({ closeDialog }: Props) {
    const { scores } = useSyncExternalStore(scoreStore.subscribe, scoreStore.getSnapshot);
    const sortedScores = [...scores].sort((left, right) => right.score - left.score || left.userName.localeCompare(right.userName));

    return (
        <Dialog onCloseRequest={closeDialog} title="得点一覧" size="small">
            <h2 id="dialog-title">得点一覧</h2>
            <ol style={{ paddingLeft: "2em" }}>
                {sortedScores.map((entry, index) => (
                    <li
                        key={entry.userId}
                        style={{
                            fontWeight: index < 3 ? 700 : undefined,
                            color: index === 0 ? "#d4af37" : index === 1 ? "#8b8b8b" : index === 2 ? "#b87333" : undefined,
                        }}
                    >
                        {entry.userName}: {entry.score}
                    </li>
                ))}
            </ol>
        </Dialog>
    );
}
