import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { load, save } from "../lib/persist";

export interface Profile {
  name: string;
  phone: string;
  address: string;
  apt: string;
  city: string;
  zip: string;
  sizes: { top: string; bottom: string; shoe: string };
}

const KEY = "tonite.profile.v1";

const DEFAULT_PROFILE: Profile = {
  name: "",
  phone: "",
  address: "",
  apt: "",
  city: "New York, NY",
  zip: "",
  sizes: { top: "M", bottom: "M", shoe: "38" },
};

interface Ctx {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  setSizes: (sizes: Partial<Profile["sizes"]>) => void;
}

const ProfileCtx = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => load(KEY, DEFAULT_PROFILE));

  useEffect(() => {
    save(KEY, profile);
  }, [profile]);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const setSizes = useCallback((sizes: Partial<Profile["sizes"]>) => {
    setProfile((p) => ({ ...p, sizes: { ...p.sizes, ...sizes } }));
  }, []);

  const value = useMemo(() => ({ profile, update, setSizes }), [profile, update, setSizes]);
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
