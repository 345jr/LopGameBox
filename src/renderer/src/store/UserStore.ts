import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface UserStore {
  JwtToken: string;
  setJwtToken: (token: string) => void;
}
//柯里化函数
const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      //状态
      JwtToken: '',
      //action
      setJwtToken: (token) => set({ JwtToken: token }),
    }),
    //persist的配置项
    {
      name: 'JwtToken',
      partialize: (state) => ({ JwtToken: state.JwtToken }),
    },
  ),
);

export default useUserStore;
