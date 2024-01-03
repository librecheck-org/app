// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { AddHeadersMiddleware, readFromStorage } from "@/infrastructure";
import { Configuration, DefaultConfig, UserDetails } from "@/apiClients";
import { StorageKey } from "@/models";

export async function initDefaultApiConfig(): Promise<void> {
    const env = await (await fetch("/env.json")).json();

    DefaultConfig.config = new Configuration({
        basePath: env?.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL,
        middleware: [new AddHeadersMiddleware()]
    });
}

export async function getCurrentUser(): Promise<UserDetails | undefined> {
    return await readFromStorage<UserDetails>(StorageKey.CurrentUser);
}

export function newUuid(): string {
    return crypto.randomUUID();
}

export function getCurrentDate(): Date {
    return new Date();
}

export function getRecordValues<T>(record: Record<string, T>): T[] {
    return Object.entries(record).map(kv => kv[1]);
}

export function fireAndForget(action: () => Promise<void>) {
    Promise.resolve().then(action);
}