import { create } from "zustand";
import type { SavedAddress } from "../../types";

type LocationState = {
  current?: SavedAddress;
  recent: SavedAddress[];
  setCurrent: (addr: SavedAddress) => void;
  addRecent: (addr: SavedAddress) => void;
};

const seed: SavedAddress[] = [
  { id: "a1", label: "Domov", line1: "Kovanecká 14", city: "Praha 9" },
  { id: "a2", label: "Práca", line1: "Karlovo nám. 13", city: "Praha 2" },
  { id: "a3", label: "Gym", line1: "Žitná 45", city: "Praha 1" },
];

export const useLocation = create<LocationState>((set, get) => ({
  current: seed[0],
  recent: seed,
  setCurrent: (addr) => {
    set({ current: addr });
    const rest = get().recent.filter((a) => a.id !== addr.id);
    set({ recent: [addr, ...rest].slice(0, 6) });
  },
  addRecent: (addr) => {
    const exists = get().recent.find((a) => a.id === addr.id);
    if (exists) return;
    set({ recent: [addr, ...get().recent].slice(0, 6) });
  },
}));
