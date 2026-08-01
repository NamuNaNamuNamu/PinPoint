import { url } from "../features/url/Url";
import "./temp.css";

type Props = {
    closeDialog: () => void;
};

function RoomURLDialog({ closeDialog }: Props) {
    return (
        <>
            <div className = "room-url-dialog-overlay">
                <div className = "room-url-dialog">
                    <div className = "room-url-dialog__header">
                        <h3 className = "room-url-dialog__title">通信モード</h3>
                    </div>

                    <div className = ".room-url-dialog__body">
                        <p>以下のURLをコピーして共有してね</p>

                        <input
                            value = { url.createRoomUrl("123") }
                            readOnly
                        />

                        <button onClick = {() => { alert("TODO: copy を実装する") }}>
                            Copy
                        </button>
                    </div>

                    <div className = ".room-url-dialog__footer">
                        <button onClick = { closeDialog }>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RoomURLDialog;