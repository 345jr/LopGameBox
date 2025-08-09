import { create } from 'zustand';

interface InfoStore {
    info: string | number |null;
    setInfo: (info: string| number |null) => void;
    flashInfo:()=>void
}

const useInfoStore = create<InfoStore>((set) => ({
    info: null,
    setInfo: (newInfo) => set({info:newInfo}),
    flashInfo: () => set({info:null}),
}));

export default useInfoStore;