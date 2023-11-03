export const enum StorageKey {
    SystemStatus = "lc.systemStatus",
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

export interface SystemStatus {
    clientVersion: string;
    serverVersion: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}