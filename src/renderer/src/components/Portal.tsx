import { useState } from 'react'
import { createPortal } from 'react-dom'
import ModalContent from './ModalContent/ModalContent'
import { VscGear } from 'react-icons/vsc'

export default function Portal({ gameId, onRefresh }: { gameId: number; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <button onClick={() => setShowModal(true)} className="iconBtn iconBtn-wrapper">
        <VscGear />
      </button>
      {showModal &&
        createPortal(
          <ModalContent
            onClose={() => setShowModal(false)}
            gameId={gameId}
            onRefresh={onRefresh}
          />,
          document.body
        )}
    </>
  )
}
