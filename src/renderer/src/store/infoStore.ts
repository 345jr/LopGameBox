import { create } from 'zustand';

interface InfoStore {
    info: string | number |null;
    display: boolean;
    setInfo: (info: string| number |null) => void;
    onInfo: () => void;
    offInfo: () => void;
    flashInfo:()=>void
}

const useInfoStore = create<InfoStore>((set) => ({
    info: null,
    display:false,
    onInfo: () => set({display:true}),
    offInfo: () => set({display:false}),
    setInfo: (newInfo) => set({info:newInfo}),
    flashInfo: () => set({info:null}),
}));

export default useInfoStore;