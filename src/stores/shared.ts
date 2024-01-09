// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export interface GenericStore<T> {
    value: T;

    ensureIsInitialized(): Promise<void>;
    read(): Promise<void>;
    update: (value: Partial<T> | undefined) => Promise<void>;
}

export function mergeUpdates(value: object, updates: Partial<object>): object {
    return { ...value, ...updates };
}