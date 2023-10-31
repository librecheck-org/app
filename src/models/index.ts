export const enum StorageKey {
    App = "lc.app",
    Tokens = "lc.tokens",
    CurrentUser = "lc.currentUser"
}

export const enum ServerConnectionStatus {
    Healthy = "healthy",
    Unhealthy = "unhealthy",
    Disconnected = "disconnected"
}

export class WorkerMessage {
    constructor(public type: string, public value: any) {
    }
}

export interface AppInfo {

}

export interface Tokens {
    get accessToken(): string;
    get refreshToken(): string;
}