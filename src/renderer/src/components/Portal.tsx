import { useState } from 'react';
import { createPortal } from 'react-dom';
import ModifyGameName from './ModalContent/ModifyGameName'
export default function Portal({gameId, updata}: {gameId: number; updata: React.Dispatch<React.SetStateAction<any>>}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        修改游戏名
      </button>
      {showModal && createPortal(
        <ModifyGameName onClose={() => setShowModal(false)} gameId={gameId} updata={updata}/>,
        document.body
      )}
    </>
  );
}