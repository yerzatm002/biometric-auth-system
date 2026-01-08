const TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (e) {
    return null;
  }
}

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

  /**
   * JWT payload (sub, exp, etc.)
   */
  getTokenPayload() {
    const token = this.getAccessToken();
    return decodeJwtPayload(token);
  },

  /**
   * Проверка истечения токена (exp в секундах)
   */
  isTokenExpired() {
    const payload = this.getTokenPayload();
    if (!payload?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};
