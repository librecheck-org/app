export const enum StorageKey {
    App = "lc.app",
    Tokens = "lc.tokens",
    CurrentUser = "lc.currentUser"
}

export interface AppInfo {

}

export interface Tokens {
    get accessToken(): string;
    get refreshToken(): string;
}