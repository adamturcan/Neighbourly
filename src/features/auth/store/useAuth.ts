import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../../../shared/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: "seeker" | "helper" | "both";
  skills: string[];
  rating: number;
  jobs_done: number;
  lat: number | null;
  lng: number | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      // Dev mode: skip auth, go straight to main app with mock profile
      set({
        session: { access_token: "dev", refresh_token: "dev", expires_in: 99999, token_type: "bearer", user: { id: "dev-user", email: "dev@local", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" } } as unknown as Session,
        user: { id: "dev-user" } as User,
        profile: { id: "dev-user", username: "dev", full_name: "Dev User", bio: null, avatar_url: null, role: "both", skills: ["moving", "chores"], rating: 4.5, jobs_done: 12, lat: 48.1482, lng: 17.1067 },
        initialized: true,
        loading: false,
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, initialized: true });

    if (session?.user) {
      await get().fetchProfile();
    }
    set({ loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      set({ profile: { ...get().profile!, ...updates } });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
