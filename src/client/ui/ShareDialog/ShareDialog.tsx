import { useRef, useState, type Dispatch } from "react";
import { url } from "../../features/url/Url";
import { TextField } from "./TextField";

import "./ShareDialog.scss";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { copyIcon, playerPlayIcon, playerStopFilledIcon } from "../icons";
import { useCopyStatus } from "../../hooks/useCopiedIndicator";
import { copyTextToSystemClipboard } from "./clipboard";
import { socketController } from "../../socket/SocketController";
import { userSessionStorage } from "../../features/sessionStorage/sessionStorage";

type Props = {
    closeDialog: () => void;
    initCurrentRoomId: string | undefined;
};

type RoomURLDialogProps = {
    currentRoomId: string;
    closeDialog: () => void;
};

type ShareStartDialogProps = {
    startCollaborating: () => void;
};

type ShareDialogInnerProps = {
    closeDialog: () => void;
    currentRoomId: string | undefined;
    startCollaborating: () => void;
};

const startCollaborating = async (setCurrentRoomId: Dispatch<any>) => {
    const userId = userSessionStorage.getUserId();
    const room = await socketController.createRoom();
    const response = userId ? await socketController.joinRoom(userId, room.id) : null;

    if (response) {
        const roomId = response;
        setCurrentRoomId(roomId);
        url.replaceRoomUrl(roomId);
    }
};

function RoomURLDialog({ currentRoomId, closeDialog }: RoomURLDialogProps) {
    const ref = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number>(0);
    const [, setJustCopied] = useState(false);
    const { onCopy, copyStatus } = useCopyStatus();

    const copyRoomLink = async () => {
        try {
            await copyTextToSystemClipboard(roomUrl);
        } catch (e) {
            new Error("クリップボードにコピーできませんでした。");
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

    const roomUrl = url.createRoomUrl(currentRoomId);

    return (
        <>
            <h3 className="ShareDialog__active__header">通信モード</h3>

            <div className="ShareDialog__active__linkRow">
                <TextField ref={ref} label="リンク" readonly fullWidth value={roomUrl} />
                <FilledButton
                    size="large"
                    label="リンクをコピー"
                    icon={copyIcon}
                    status={copyStatus}
                    onClick={() => {
                        copyRoomLink();
                        onCopy();
                    }}
                />
            </div>

            <div className="ShareDialog__active__actions">
                <FilledButton
                    size="large"
                    label="退出する"
                    icon={playerStopFilledIcon}
                    variant="outlined"
                    color="danger"
                    onClick={() => {
                        socketController.leaveRoom(currentRoomId);
                        closeDialog();
                    }}
                />
            </div>
        </>
    );
}

const ShareStartDialog = ({ startCollaborating }: ShareStartDialogProps) => {
    //   const { t } = useI18n();

    //   const { collabAPI } = props;

    return (
        <>
            <div className="ShareDialog__picker__header">通信モード</div>

            <div className="ShareDialog__picker__description">
                <div style={{ marginBottom: "1em" }}>通信モードを開始します。</div>
            </div>

            <div className="ShareDialog__picker__button">
                <FilledButton
                    size="large"
                    label="開始"
                    icon={playerPlayIcon}
                    onClick={() => {
                        startCollaborating();
                        // trackEvent("share", "room creation", `ui (${getFrame()})`);
                        // collabAPI.startCollaboration(null);
                    }}
                />
            </div>

            {/* {props.type === "share" && (
        <div className="ShareDialog__separator">
          <span>{t("shareDialog.or")}</span>
        </div>
      )} */}
        </>
    );
};

const ShareDialogInner = ({ closeDialog, currentRoomId, startCollaborating }: ShareDialogInnerProps) => {
    return (
        <Dialog size="small" onCloseRequest={closeDialog} title={false}>
            <div className="ShareDialog">
                {currentRoomId ? (
                    <RoomURLDialog currentRoomId={currentRoomId} closeDialog={closeDialog} />
                ) : (
                    <ShareStartDialog startCollaborating={startCollaborating} />
                )}
            </div>
        </Dialog>
    );
};

export const ShareDialog = ({ closeDialog, initCurrentRoomId }: Props) => {
    const [currentRoomId, setCurrentRoomId] = useState(initCurrentRoomId);

    return (
        <ShareDialogInner
            closeDialog={closeDialog}
            currentRoomId={currentRoomId}
            startCollaborating={() => startCollaborating(setCurrentRoomId)}
        />
    );
};
