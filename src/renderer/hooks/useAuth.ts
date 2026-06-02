import { useState, useEffect } from "react";
import { userAPI, type TwitchUser } from "../api/core/user";
import { authAPI } from "../api/core/auth";

export const useAuth = () => {
  const [user, setUser] = useState<TwitchUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const loggedIn = await authAPI.isLoggedIn();
        if (loggedIn.data) {
          const userRes = await userAPI.getCurrentUser();
          if (userRes.status && userRes.data) setUser(userRes.data);
        }
      } catch (err) {
        console.error("Auth hook error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { user, loading };
};