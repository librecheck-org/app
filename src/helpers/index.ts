// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export function newUuid(): string {
    return crypto.randomUUID();
}

export function getCurrentDate(): Date {
    return new Date();
}

interface KeyValuePair<TKey, TValue> {
    get key(): TKey;
    get value(): TValue;
}

export function getRecordPairs<T>(record: Record<string, T>): KeyValuePair<string, T>[] {
    return Object.entries(record).map(kv => { return { key: kv[0], value: kv[1] }; });
}

export function getRecordValues<T>(record: Record<string, T>): T[] {
    return getRecordPairs(record).map(kv => kv.value);
}

export function fireAndForget(action: () => Promise<void>) {
    Promise.resolve().then(action);
}