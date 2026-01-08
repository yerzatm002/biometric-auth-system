import { create } from "zustand";
import { tokenService } from "./tokenService";

function getUserIdFromToken(token) {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url -> base64
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    // add padding
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const decoded = JSON.parse(atob(base64));
    return decoded?.sub ? Number(decoded.sub) : null;
  } catch (e) {
    return null;
  }
}

export const useAuthStore = create((set) => {
  const initialToken = tokenService.getAccessToken();
  const initialUserId =
    initialToken ? getUserIdFromToken(initialToken) : tokenService.getUserId();

  return {
    accessToken: initialToken,
    userId: initialUserId,
    isAuthenticated: !!initialToken,

    // MFA state
    isFaceVerified: false,

    setAuth: ({ accessToken, userId }) => {
      const derivedUserId = userId ?? getUserIdFromToken(accessToken);

      if (accessToken) tokenService.setAccessToken(accessToken);
      if (derivedUserId !== undefined && derivedUserId !== null)
        tokenService.setUserId(derivedUserId);

      set({
        accessToken,
        userId: derivedUserId ?? null,
        isAuthenticated: !!accessToken,
        isFaceVerified: false, // reset after login
      });
    },

    setFaceVerified: (value) => set({ isFaceVerified: value }),

    clearAuth: () => {
      tokenService.clear();
      set({
        accessToken: null,
        userId: null,
        isAuthenticated: false,
        isFaceVerified: false,
      });
    },
  };
});
