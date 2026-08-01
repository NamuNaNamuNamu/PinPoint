import { useRef, useState } from "react";
import { url } from "../features/url/Url";
import { TextField } from "./TextField";

import "./ShareDialog.scss";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { copyIcon } from "./icons";
import { useCopyStatus } from "./useCopiedIndicator";
import { copyTextToSystemClipboard } from "./clipboard";

type Props = {
    closeDialog: () => void;
};

function RoomURLDialog() {
    const ref = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number>(0);
    const [, setJustCopied] = useState(false);
    const { onCopy, copyStatus } = useCopyStatus();

    const copyRoomLink = async () => {
        try {
            await copyTextToSystemClipboard(roomUrl);
        } catch (e) {
            new Error("クリップボードにコピーできませんでした。")
        }

        setJustCopied(true);

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
            setJustCopied(false);
        }, 3000);

        ref.current?.select();
    };

    const roomUrl = url.createRoomUrl("123");

    return (
        <>
            <h3 className="ShareDialog__active__header">
                通信モード
            </h3>

            <div className="ShareDialog__active__linkRow">
                <TextField
                    ref = {ref}
                    label = "リンク"
                    readonly
                    fullWidth
                    value = { roomUrl }
                />
                <FilledButton
                    size = "large"
                    label = "リンクをコピー"
                    icon={copyIcon}
                    status={copyStatus}
                    onClick={() => {
                        copyRoomLink();
                        onCopy();
                    }}
                />
            </div>
        </>
    )
}

const ShareDialogInner = ({ closeDialog }: Props) => {
    return (
        <Dialog size = "small" onCloseRequest = {closeDialog} title = {false}>
            <div className="ShareDialog">
                <RoomURLDialog/>
            </div>
        </Dialog>
    );
};

export const ShareDialog = ({ closeDialog }: Props) => {
  return (
    <ShareDialogInner
      closeDialog = { closeDialog }
    />
  );
};