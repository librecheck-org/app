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
    Read = "execute_read",

    /**
     * Execute an update operation.
     */
    Update = "execute_update",

    /**
     * Execute a delete operation.
     */
    Delete = "execute_delete",

    /**
     * Resolve blocking promise, sent by the worker when a blocking operation
     * has been successfully completed.
     */
    Unlock = "resolve_promise",

    /**
     * Reject blocking promise, sent by the worker when a blocking operation
     * has __not__ been successfully completed.
     */
    RejectPromise = "reject_promise"
}