import { useRef } from "react";
import { url } from "../features/url/Url";
import { TextField } from "./TextField";

import "./RoomURLDialog.scss";
import { Dialog } from "./Dialog";

type Props = {
    closeDialog: () => void;
};

function RoomURLDialog({ closeDialog }: Props) {
    const ref = useRef<HTMLInputElement>(null);

    return (
        <>
            <h3 className="RoomURLDialog__active__header">
                通信モード
            </h3>

            <div className="RoomURLDialog__active__linkRow">
                <TextField
                    ref = {ref}
                    label = "リンク"
                    readonly
                    fullWidth
                    value = {url.createRoomUrl("123")}
                />
            </div>
        </>
    )
}

const ShareDialogInner = ({ closeDialog }: Props) => {
    return (
        <Dialog size = "small" onCloseRequest = {closeDialog} title = {false}>
            <div className="ShareDialog">
                    <RoomURLDialog
                        closeDialog = { closeDialog }
                    />
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