import { useRef, useState } from "react";
import { url } from "../../features/url/Url";
import { TextField } from "./TextField";

import "./ShareDialog.scss";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { copyIcon, playerPlayIcon } from "../icons";
import { useCopyStatus } from "../../hooks/useCopiedIndicator";
import { copyTextToSystemClipboard } from "./clipboard";

type Props = {
    closeDialog: () => void;
};

type ShareStartDialogProps = {
    startCollaborating: () => void;
}

type ShareDialogInnerProps = {
    closeDialog: () => void;
    isCollaborating: boolean;
    startCollaborating: () => void;
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

    const roomUrl = url.createRoomUrl("123"); // TODO: 自分が参加している部屋で作成する。

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

const ShareStartDialog = ({ startCollaborating }: ShareStartDialogProps) => {
//   const { t } = useI18n();

//   const { collabAPI } = props;

  return (
    <>
      <div className="ShareDialog__picker__header">
        通信モード
      </div>

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
  )
};

const ShareDialogInner = ({ closeDialog, isCollaborating, startCollaborating }: ShareDialogInnerProps) => {
    return (
        <Dialog size = "small" onCloseRequest = {closeDialog} title = {false}>
            <div className="ShareDialog">
                {isCollaborating ? <RoomURLDialog/> : <ShareStartDialog startCollaborating = { startCollaborating } />}
            </div>
        </Dialog>
    )
};

export const ShareDialog = ({ closeDialog }: Props) => {
  const [isCollaborating, setIsCollaborating] = useState(false); // TODO: 現在通信しているかを判定するメソッドを実装する
    
  return (
    <ShareDialogInner
      closeDialog = { closeDialog }
      isCollaborating = { isCollaborating }
      startCollaborating = { () => setIsCollaborating(true) }
    />
  );
};