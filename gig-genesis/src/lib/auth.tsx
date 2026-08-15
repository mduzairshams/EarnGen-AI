import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = { full_name: string | null; college: string | null; city: string | null };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  avatarUrl: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; code?: string }>;
  signUp: (email: string, password: string, profile: Profile) => Promise<{ error: string | null }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ error: string | null }>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        // Defer profile fetch to avoid deadlocks
        setTimeout(() => fetchProfile(s.user.id, s.user), 0);
      } else {
        setProfile(null);
      }
    });
    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchProfile(data.session.user.id, data.session.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchProfile(id: string, userObj?: User) {
    let { data, error } = await supabase.from("profiles").select("full_name,college,city").eq("id", id).maybeSingle();
    
    // Self-healing database upsert fallback to write meta fields to public.profiles table instantly
    if (!data && userObj?.user_metadata) {
      const userMeta = userObj.user_metadata;
      const fallbackProfile = {
        id,
        full_name: userMeta.full_name || null,
        college: userMeta.college || null,
        city: userMeta.city || null
      };
      
      const { data: upserted } = await supabase
        .from("profiles")
        .upsert(fallbackProfile)
        .select("full_name,college,city")
        .maybeSingle();
      
      if (upserted) {
        data = upserted;
      }
    }
    
    if (data) setProfile(data as Profile);
  }

  // Avatar URL is stored in Supabase auth user metadata — no DB column needed
  const avatarUrl: string | null = session?.user?.user_metadata?.avatar_url ?? null;

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    profile,
    avatarUrl,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null, code: error?.code };
    },
    async signUp(email, password, p) {
      // Do not set emailRedirectTo here: GoTrue validates it against the project's redirect allow list.
      // A missing entry causes errors like "Invalid path specified in request URL". Confirmation links
      // use the Site URL from Supabase Dashboard → Authentication → URL Configuration.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: p },
      });
      return { error: error?.message ?? null };
    },
    async resendSignupConfirmation(email) {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      return { error: error?.message ?? null };
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async updateProfile(data) {
      const id = session?.user?.id;
      if (!id) return { error: "Not signed in" };
      // Map full_name → DB column name; keep other fields as-is
      const { error } = await supabase
        .from("profiles")
        .upsert({ id, ...data });
      if (!error) {
        setProfile((prev) => prev ? { ...prev, ...data } : (data as Profile));
      }
      return { error: error?.message ?? null };
    },
    async uploadAvatar(file) {
      const id = session?.user?.id;
      if (!id) return { error: "Not signed in" };

      // Validate size (max 5 MB)
      if (file.size > 5 * 1024 * 1024) return { error: "Image must be smaller than 5 MB." };

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${id}/avatar.${ext}`;

      // Upload to the 'avatars' storage bucket (create this bucket in Supabase Dashboard)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) return { error: uploadError.message };

      // Get the public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Bust cache by appending a timestamp query param
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Persist in auth user metadata — triggers onAuthStateChange so session updates automatically
      const { error: metaError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      return { error: metaError?.message ?? null };
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
