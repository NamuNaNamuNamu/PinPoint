type Props = { status: "connected" | "reconnecting" | "left" };

/**
 * ルーム再接続中または猶予切れを固定位置で通知する。
 *
 * @param props 現在の接続状態。
 * @returns 接続中は何も描画せず、それ以外は状態テキストを描画する。
 */
export function ConnectionStatus({ status }: Props) {
    if (status === "connected") return null;
    return (
        <div className="ConnectionStatus">
            {status === "left" ? "通信が切断され、ルームから退出しました。" : "通信が切断されています。再接続中…"}
        </div>
    );
}
