import useInfoStore from '@renderer/store/infoStore';
import { VscTriangleUp } from 'react-icons/vsc';
import { motion } from 'framer-motion';
const InfoBox = () => {
  const info = useInfoStore((state) => state.info);
  const display = useInfoStore((state) => state.display);
  return (
    <>
      {display && (
        <motion.div className='flex flex-col items-center'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VscTriangleUp className="mb-[-10px] text-2xl text-white" />
          <div className="h-30 w-60 rounded-xl bg-white p-2 text-black border-3 border-stone-900">
            {info || '「暂无信息」'}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default InfoBox;
