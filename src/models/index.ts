export const enum StorageKey {
    AppInfo = "lc.appInfo",
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
    clientVersion: string;
    serverVersion: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}