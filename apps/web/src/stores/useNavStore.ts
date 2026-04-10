import { create } from "zustand";

interface NavStore {
  isOpen: boolean;
  openItems: string[];
  toggle: () => void;
  close: () => void;
  setOpenItems: (items: string[]) => void;
}

export const useNavStore = create<NavStore>()((set) => ({
  isOpen: false,
  openItems: [],
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  setOpenItems: (items) => set({ openItems: items }),
}));
