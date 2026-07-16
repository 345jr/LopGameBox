import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { VscTriangleUp } from 'react-icons/vsc';
import useInfoStore from '@renderer/store/infoStore';

const InfoBox = () => {
  const info = useInfoStore((state) => state.info);
  const display = useInfoStore((state) => state.display);
  const boxRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!display || !boxRef.current) return;
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
      );
    },
    { dependencies: [display, info] },
  );

  if (!display) return null;

  return (
    <div ref={boxRef} className="flex-col-v">
      <VscTriangleUp className="mb-[-10px] text-2xl text-white" />
      <div className="h-30 w-60 rounded-xl border-3 border-stone-900 bg-white p-2 text-black">
        {info || '「暂无信息」'}
      </div>
    </div>
  );
};

export default InfoBox;
