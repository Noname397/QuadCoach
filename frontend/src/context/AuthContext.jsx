import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearStoredUser,
  fetchCurrentUser,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logoutFromApi,
  readStoredUser,
  signOutFromSupabase,
  signUp as signUpRequest,
  storeUser,
  subscribeToAuthChanges,
  updateProfile as updateProfileRequest,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const accessToken = authUser?.access_token;
  const currentUserQuery = useQuery({
    queryKey: ["current-user", accessToken],
    queryFn: () => fetchCurrentUser(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const user = authUser && currentUserQuery.data
    ? { ...authUser, ...currentUserQuery.data.user, ...currentUserQuery.data }
    : authUser;
  const authLoading = loading || Boolean(authUser && currentUserQuery.isPending);

  useEffect(() => {
    if (!currentUserQuery.isError) return;
    setAuthUser(null);
    clearStoredUser();
  }, [currentUserQuery.isError]);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const storedUser = readStoredUser();
      if (!storedUser?.access_token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setAuthUser(storedUser);
      } catch {
        clearStoredUser();
        if (mounted) setAuthUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restoreSession();

    const subscription = subscribeToAuthChanges(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setAuthUser(null);
        clearStoredUser();
        queryClient.removeQueries({ queryKey: ["current-user"] });
        if (mounted) setLoading(false);
        return;
      }

      try {
        setAuthUser({
          ...session.user,
          access_token: session.access_token,
        });
      } catch {
        clearStoredUser();
        if (mounted) setAuthUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) storeUser(user);
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    const nextUser = { ...data.user, access_token: data.session?.access_token };
    setAuthUser(nextUser);
    return nextUser;
  }, []);

  const signUp = useCallback(async (email, password) => {
    return signUpRequest(email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    return loginWithGoogleRequest();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (form) => {
      if (!accessToken) throw new Error("You are not authenticated.");
      return updateProfileRequest(accessToken, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user", accessToken] });
    },
  });

  const updateProfile = useCallback(
    (form) => updateProfileMutation.mutateAsync(form).then((data) => data.profile),
    [updateProfileMutation],
  );

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await logoutFromApi(accessToken);
      }
      await signOutFromSupabase();
    } finally {
      setAuthUser(null);
      clearStoredUser();
      queryClient.removeQueries({ queryKey: ["current-user"] });
    }
  }, [accessToken, queryClient]);

  const value = useMemo(
    () => ({ user, loading: authLoading, authLoading, login, signUp, loginWithGoogle, updateProfile, logout }),
    [user, authLoading, login, signUp, loginWithGoogle, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}