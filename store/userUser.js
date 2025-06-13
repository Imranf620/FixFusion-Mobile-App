import { create } from 'zustand';

const useUser = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

}));

export default useUser;
