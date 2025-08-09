import { create } from 'zustand';

interface InfoStore {
    info: string;
    setInfo: (info: string) => void;
    flashInfo:()=>void
}

const useInfoStore = create<InfoStore>((set) => ({
    info: '',
    setInfo: (newInfo) => set({info:newInfo}),
    flashInfo: () => set({info:''}),
}));

export default useInfoStore;