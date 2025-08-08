import { useState } from 'react';
import { createPortal } from 'react-dom';
import ModifyGameName from './ModalContent/ModifyGameName'
import { VscGear } from "react-icons/vsc";

export default function Portal({gameId, updata}: {gameId: number; updata: React.Dispatch<React.SetStateAction<any>>}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        <VscGear  className='text-white text-2xl'/> 
      </button>
      {showModal && createPortal(
        <ModifyGameName onClose={() => setShowModal(false)} gameId={gameId} updata={updata}/>,
        document.body
      )}
    </>
  );
}