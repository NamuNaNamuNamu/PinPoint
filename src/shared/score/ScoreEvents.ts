/**
 * 得点表に表示する参加者の累積得点。
 */
export type ScoreEntry = { userId: number; userName: string; score: number };

/**
 * サーバーが配信するルームの得点スナップショット。
 */
export type ScoresUpdated = { scores: readonly ScoreEntry[] };
