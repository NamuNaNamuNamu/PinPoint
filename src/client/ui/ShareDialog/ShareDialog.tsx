import "./ShareDialog.scss";

import { useEffect, useRef, useState } from "react";

import { excalidrawCursorSyncController } from "../../features/excalidraw/excalidrawCursor/ExcalidrawCursorSyncController";
import { questionSceneController } from "../../features/question/QuestionSceneController";
import { userSessionStorage } from "../../features/sessionStorage/sessionStorage";
import { url } from "../../features/url/Url";
import { useSuccessStatus } from "../../hooks/useCopiedIndicator";
import { socketController } from "../../socket/SocketController";
import { checkIcon, copyIcon, playerPlayIcon, playerStopFilledIcon } from "../icons";
import { copyTextToSystemClipboard } from "./clipboard";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { TextField } from "./TextField";

/**
 * 共有ダイアログのプロパティ。
 */
type Props = {
    closeDialog: () => void;
    currentRoomId: string | undefined;
    onCurrentRoomIdChange: (roomId: string | undefined) => void;
};

/**
 * 参加中のルーム URL を表示するダイアログのプロパティ。
 */
type RoomURLDialogProps = {
    currentRoomId: string;
    closeDialog: () => void;
    onCurrentRoomIdChange: (roomId: string | undefined) => void;
};

/**
 * 通信モードの開始画面のプロパティ。
 */
type ShareStartDialogProps = {
    startCollaborating: () => Promise<void>;
};

/**
 * 共有ダイアログの内部表示を切り替えるコンポーネントのプロパティ。
 */
type ShareDialogInnerProps = {
    closeDialog: () => void;
    currentRoomId: string | undefined;
    onCurrentRoomIdChange: (roomId: string | undefined) => void;
    startCollaborating: () => Promise<void>;
};

/**
 * 新しいルームを作成し、現在のユーザーを参加させる。
 *
 * 作成と参加に成功した場合は、表示中のルーム ID と URL を更新する。
 *
 * @param onCurrentRoomIdChange 現在のルーム ID を親へ通知する関数。
 */
const startCollaborating = async (onCurrentRoomIdChange: (roomId: string | undefined) => void): Promise<void> => {
    const userId = userSessionStorage.getUserId();
    const room = await socketController.createRoom();
    const response = userId ? await socketController.joinRoom(userId, room.id) : null;

    if (response) {
        const roomId = response;
        onCurrentRoomIdChange(roomId);
        url.replaceRoomUrl(roomId);
    }
};

/**
 * 参加中のルームの共有 URL と退出操作を表示する。
 *
 * @param props 表示するルーム ID とダイアログを閉じる関数。
 */
function RoomURLDialog({ currentRoomId, closeDialog, onCurrentRoomIdChange }: RoomURLDialogProps) {
    const ref = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number>(0);
    const [, setJustCopied] = useState(false);
    const [userName, setUserName] = useState("名無し");
    const [userNameError, setUserNameError] = useState<string | null>(null);
    const [isSavingUserName, setIsSavingUserName] = useState(false);
    const { onSuccess: onCopySuccess, successStatus: copyStatus } = useSuccessStatus();
    const {
        onSuccess: onUserNameSaveSuccess,
        resetSuccessStatus: resetUserNameSaveStatus,
        successStatus: userNameSaveStatus,
    } = useSuccessStatus();

    useEffect(() => {
        const loadUserName = async () => {
            const user = await socketController.getUser(userSessionStorage.getUserId());
            if (user) {
                setUserName(user.name);
            }
        };

        void loadUserName();
    }, []);

    /**
     * ルーム URL をクリップボードへコピーし、コピー状態を一時的に表示する。
     */
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

    /**
     * ルームから退出し、共同編集用のローカル表示状態を消去する。
     */
    const leaveRoom = async () => {
        const response = await socketController.leaveRoom(currentRoomId);
        if (!response) {
            return;
        }

        excalidrawCursorSyncController.clear();
        questionSceneController.clear();
        onCurrentRoomIdChange(undefined);
        closeDialog();
    };

    /**
     * ユーザー名を検証して保存し、成功時に一時的な成功状態を表示する。
     */
    const saveUserName = async () => {
        if (isSavingUserName) {
            return;
        }

        if (!userName.trim()) {
            setUserNameError("ユーザー名を入力してください。");
            return;
        }

        if (userName.length > 12) {
            setUserNameError("ユーザー名は12文字以内で入力してください。");
            return;
        }

        setIsSavingUserName(true);
        const updatedUser = await socketController.updateUserName(userName);
        setIsSavingUserName(false);

        if (!updatedUser) {
            setUserNameError("ユーザー名を保存できませんでした。");
            return;
        }

        setUserName(updatedUser.name);
        setUserNameError(null);
        onUserNameSaveSuccess();
    };

    const roomUrl = url.createRoomUrl(currentRoomId);

    return (
        <>
            <h3 className="ShareDialog__active__header">通信モード</h3>

            <div className="ShareDialog__active__linkRow">
                <div className="ShareDialog__active__userNameField">
                    <TextField
                        label="ユーザー名"
                        fullWidth
                        maxLength={12}
                        value={userName}
                        onChange={(value) => {
                            setUserName(value);
                            setUserNameError(null);
                            resetUserNameSaveStatus();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void saveUserName();
                            }
                        }}
                    />
                    {userNameError && <p className="ShareDialog__active__validationError">{userNameError}</p>}
                </div>
                <FilledButton
                    size="large"
                    label="保存"
                    icon={checkIcon}
                    status={userNameSaveStatus}
                    disabled={isSavingUserName}
                    onClick={saveUserName}
                />
            </div>

            <div className="ShareDialog__active__linkRow">
                <TextField ref={ref} label="リンク" readonly fullWidth value={roomUrl} />
                <FilledButton
                    size="large"
                    label="リンクをコピー"
                    icon={copyIcon}
                    status={copyStatus}
                    onClick={() => {
                        copyRoomLink();
                        onCopySuccess();
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
                        leaveRoom();
                    }}
                />
            </div>
        </>
    );
}

/**
 * 通信モードを開始する前の画面を表示する。
 *
 * @param props 通信モードを開始する関数。
 */
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
                        void startCollaborating();
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

/**
 * ルーム参加状態に応じて共有ダイアログの内容を切り替える。
 *
 * @param props ダイアログの表示状態を決めるプロパティ。
 */
const ShareDialogInner = ({
    closeDialog,
    currentRoomId,
    onCurrentRoomIdChange,
    startCollaborating,
}: ShareDialogInnerProps) => {
    return (
        <Dialog size="small" onCloseRequest={closeDialog} title={false}>
            <div className="ShareDialog">
                {currentRoomId ? (
                    <RoomURLDialog
                        currentRoomId={currentRoomId}
                        closeDialog={closeDialog}
                        onCurrentRoomIdChange={onCurrentRoomIdChange}
                    />
                ) : (
                    <ShareStartDialog startCollaborating={startCollaborating} />
                )}
            </div>
        </Dialog>
    );
};

/**
 * 通信モードの開始、共有 URL の表示、およびルーム退出を行うダイアログ。
 *
 * @param props ダイアログを閉じる関数、確定済みルーム ID、親の状態更新関数。
 */
export const ShareDialog = ({ closeDialog, currentRoomId, onCurrentRoomIdChange }: Props) => {
    return (
        <ShareDialogInner
            closeDialog={closeDialog}
            currentRoomId={currentRoomId}
            onCurrentRoomIdChange={onCurrentRoomIdChange}
            startCollaborating={() => startCollaborating(onCurrentRoomIdChange)}
        />
    );
};
