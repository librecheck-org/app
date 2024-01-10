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
 * Message types which can be received or sent by any worker.
 */
export const enum GenericWorkerMessageType {
    /**
     * Instructs the worker to initialize itself.
     */
    Initialize = "initialize",

    /**
     * Event triggered when worker has successfully initialized itself.
     */
    Initialized = "initialized"
}

/**
 * Message types which can be received or sent by system status worker.
 */
export const enum SystemStatusWorkerMessageType {
    /**
     * Starts the periodic server connection check.
     */
    StartPeriodicServerConnectionCheck = "start_periodic_server_connection_check",

    /**
     * Event triggered when server connection has been checked.
     */
    ServerConnectionChecked = "server_connection_checked"
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
    RejectPromise = "reject_promise",

    /**
     * A storage event triggered when an update operation
     * has been successfully completed. This kind of event must be used
     * to trigger a refresh when data is changed in another tab or context.
     */
    StorageUpdated = "storage_updated",
}

/**
 * Status of checklists sync.
 */
export const enum ChecklistsSyncStatus {
    /**
     * Sync is not currently and no merge issues arose in previous runs.
     */
    Idle = "idle",

    /**
     * Sync is running.
     */
    Running = "running",

    /**
     * Previous sync failed because of merge issues. This status should be
     * brought to user attention, because it might need to solve those issues.
     */
    Failed = "failed"
}

/**
 * Status of server connection.
 */
export const enum ServerConnectionStatus {
    /**
     * Server could be reached and it is healthy
     */
    Healthy = "healthy",

    /**
     * Server could be reached, but it is unhealthy.
     */
    Unhealthy = "unhealthy",

    /**
     * Server could not be reached.
     */
    Disconnected = "disconnected"
}

/**
 * System status information which is persisted for offline usage.
 * Volatile information, such as server connection status or checklists sync status,
 * do not belong here because there is no need to persist it.
 */
export interface SystemStatus {
    /**
     * Client version.
     */
    clientVersion: string;

    /**
     * Server version.
     */
    serverVersion: string;
}
