// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export * from "./Checklists";

export const enum StorageKey {
    // Base
    SystemStatus = "lc.base.systemStatus",
    // Iam
    Tokens = "lc.iam.tokens",
    CurrentUser = "lc.iam.currentUser",
    // Checklists
    Definitions = "lc.checklists.definitions",
    Submissions = "lc.checklists.submissions",
}

export const enum ServerConnectionStatus {
    Healthy = "healthy",
    Unhealthy = "unhealthy",
    Disconnected = "disconnected"
}

export class WorkerMessage {
    constructor(public type: string, public payload: any) {
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