import { create } from "zustand";

type State = {
  favorites: Record<string, true>;
  toggle: (serviceId: string) => void;
  isFavorite: (serviceId: string) => boolean;
};

export const useFavorites = create<State>((set, get) => ({
  favorites: {},
  toggle: (id) =>
    set((s) => {
      const copy = { ...s.favorites };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return { favorites: copy };
    }),
  isFavorite: (id) => !!get().favorites[id],
}));
