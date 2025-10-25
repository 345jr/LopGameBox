import { useState } from 'react';
import { createPortal } from 'react-dom';
import ModalContent from './ModalContent/ModalContent';
import { VscGear } from 'react-icons/vsc';
import { motion } from 'motion/react';

export default function Portal({
  gameId,
  onRefresh,
}: {
  gameId: number;
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        className="iconBtn"
        initial={{ y: 0 }}
        whileHover={{ y: -5 }}
      >
        <VscGear />
      </motion.button>
      {showModal &&
        createPortal(
          <ModalContent onClose={() => setShowModal(false)} gameId={gameId}  onRefresh={onRefresh} />,
          document.body,
        )}
    </>
  );
}
