import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Practice = () => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.set(cardRef.current, { rotateY: 0 });
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(cardRef.current, { rotateY: 180, duration: 0.6 })
      .to(cardRef.current, { rotateY: 180, duration: 0 }, "+=1.8") // "世界"停留 1.8 秒
      .to(cardRef.current, { rotateY: 0, duration: 0.6 })
      .to(cardRef.current, { rotateY: 0, duration: 0 }, "+=1.8"); // "你好"停留 1.8 秒
    return () => tl.kill();
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative h-[100px] w-[200px] [transform-style:preserve-3d]"
    >
      <div className="absolute flex h-full w-full items-center justify-center bg-gray-100 text-2xl [backface-visibility:hidden]">
        你好
      </div>
      <div className="absolute flex h-full w-full items-center justify-center bg-gray-300 text-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
        世界
      </div>
    </div>
  );
};

export default Practice;
