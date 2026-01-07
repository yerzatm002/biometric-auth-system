const TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

export const tokenService = {
  setAccessToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeAccessToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  setUserId(userId) {
    localStorage.setItem(USER_ID_KEY, String(userId));
  },

  getUserId() {
    const value = localStorage.getItem(USER_ID_KEY);
    return value ? Number(value) : null;
  },

  removeUserId() {
    localStorage.removeItem(USER_ID_KEY);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};
