import { create } from "zustand";
import { tokenService } from "./tokenService";

export const useAuthStore = create((set) => {
  const initialToken = tokenService.getAccessToken();
  const initialUserId = tokenService.getUserId();

  return {
    accessToken: initialToken,
    userId: initialUserId,
    isAuthenticated: !!initialToken,

    setAuth: ({ accessToken, userId }) => {
      if (accessToken) tokenService.setAccessToken(accessToken);
      if (userId !== undefined && userId !== null) tokenService.setUserId(userId);

      set({
        accessToken,
        userId: userId ?? null,
        isAuthenticated: !!accessToken,
      });
    },

    clearAuth: () => {
      tokenService.clear();
      set({
        accessToken: null,
        userId: null,
        isAuthenticated: false,
      });
    },
  };
});
