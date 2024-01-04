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
     * Read operation.
     */
    Read = "read",

    /**
     * Update operation.
     */
    Update = "update",

    /**
     * Delete operation.
     */
    Delete = "delete",

    /**
     * Unlock message, sent by the worker when a blocking operation
     * has been completed (successfully or not).
     */
    Unlock = "unlock"
}