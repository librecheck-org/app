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
 * Message types which can be received or sent by checklists worker.
 */
export const enum ChecklistsWorkerMessageType {
    /**
     * Instructs the worker to initialize itself.
     */
    Initialize = "initialize",

    /**
     * Starts the periodic sync of checklists data.
     */
    StartPeriodicSync = "start_periodic_sync",

    /**
     * Forces an immediate sync, which is executed immediately
     * or right after a periodic sync, if one is in progress.
     */
    ForceImmediateSync = "force_immediate_sync",

    /**
     * Event triggered when a sync operation starts.
     */
    SyncStarted = "sync_started",

    /**
     * Event triggered when a sync operation completes successfully
     * or it fails due to network errors.
     */
    SyncCompleted = "sync_completed",

    /**
     * Event triggered when a sync operation fails due to merge issues.
     */
    SyncFailed = "sync_failed",

    DefinitionsRead = "definitions_read",
    SubmissionsRead = "submissions_read",
}

/**
 * Message types which can be received or sent by system status worker.
 */
export const enum SystemStatusWorkerMessageType {
    /**
     * Instructs the worker to initialize itself.
     */
    Initialize = "initialize",

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
     * Server could be reached.
     */
    Healthy = "healthy",

    /**
     * Server could not be reached for a short time.
     */
    Unhealthy = "unhealthy",

    /**
     * Server cannot be reached.
     */
    Disconnected = "disconnected"
}

/**
 * System status information which is persisted for offline usage.
 * Volatile information, such as server connection status or checklists sync status,
 * do not belong here because there is no need to persist them.
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
