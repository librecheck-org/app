export const enum StorageKey {
    Tokens = "lc.tokens",
    CurrentUser = "lc.currentUser"
}

export interface Tokens {
    get accessToken(): string;
    get refreshToken(): string;
}