// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Represents a message which can received or sent by workers.
 */
export class WorkerMessage {
    /**
     * Constructor.
     * @param type Message type.
     * @param payload Generic payload, which is sent to or from the worker and,
     * therefore, it must be serializable. Proxy objects are not a valid payload.
     */
    constructor(public type: string, public payload: any) {
    }
}

/**
 * Message types which can be received or sent by storage worker.
 */
export const enum StorageWorkerMessageType {
    /**
     * Execute a read operation.
     */
    ExecuteRead = "execute_read",

    /**
     * Execute an update operation.
     */
    ExecuteUpdate = "execute_update",

    /**
     * Execute a delete operation.
     */
    ExecuteDelete = "execute_delete",

    /**
     * Resolve blocking promise, sent by the worker when a blocking operation
     * has been successfully completed.
     */
    ResolvePromise = "resolve_promise",

    /**
     * Reject blocking promise, sent by the worker when a blocking operation
     * has __not__ been successfully completed.
     */
    RejectPromise = "reject_promise"
}

/**
 * Describes a function, identified by its module and its name,
 * which will be used by storage worker to atomically update,
 * with an exclusive lock, a stored value.
 */
export interface StorageUpdater {
    /**
     * File name, without extension, containing the updater function.
     * File must a direct child of "stores" folder.
     */
    get module(): string;

    /**
     * Name of the updater function.
     */
    get function(): string;
}

export const enum ServerConnectionStatus {
    Healthy = "healthy",
    Unhealthy = "unhealthy",
    Disconnected = "disconnected"
}

export interface SystemStatus {
    clientVersion: string;
    serverVersion: string;
}
