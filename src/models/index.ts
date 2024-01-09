// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export * from "./base";
export * from "./checklists";
export * from "./iam";

/**
 * List of all storage keys managed by the application, grouped by "module".
 */
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

/**
 * List of all lock keys managed by the application, grouped by "module".
 */
export const enum LockKey {
    // Checklists
    SyncChecklistsData = "lc.checklists.syncChecklistsData",
}