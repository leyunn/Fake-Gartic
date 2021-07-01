import {Modal} from "antd";

const Waiting = ({visible, num}) => {
    return (
        <Modal
            visible={visible}
            // title={`waiting for other players... ${num}/3`}
            closable={false}
            footer={null}
            centered={true}
            // id="wait-modal"
        >
            {(num>=3)?'waiting for the next round to join...':`waiting for other players... ${num}/3`}
        </Modal>
    )
}

export default Waiting;