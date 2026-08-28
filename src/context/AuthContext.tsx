import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Workspace, WhatsAppAccount } from '../types/crm';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  whatsappAccount: WhatsAppAccount | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshWorkspaceData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [whatsappAccount, setWhatsappAccount] = useState<WhatsAppAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = async (currentUser: User) => {
    try {
      // 1. Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profData) {
        setProfile(profData as Profile);
      }

      // 2. Fetch Branify Workspace
      const { data: wsData } = await supabase
        .from('workspaces')
        .select('*')
        .eq('slug', 'branify')
        .maybeSingle();

      if (wsData) {
        setWorkspace(wsData as Workspace);

        // 3. Fetch WhatsApp Account
        const { data: waData } = await supabase
          .from('whatsapp_accounts')
          .select('*')
          .eq('workspace_id', wsData.id)
          .maybeSingle();

        if (waData) {
          setWhatsappAccount(waData as WhatsAppAccount);
        }
      }
    } catch (err) {
      console.error('Error loading user profile or workspace:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setProfile(null);
        setWorkspace(null);
        setWhatsappAccount(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWorkspace(null);
  };

  const refreshWorkspaceData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspace,
        whatsappAccount,
        loading,
        signIn,
        signUp,
        signOut,
        refreshWorkspaceData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
