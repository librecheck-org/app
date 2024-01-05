// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Configuration, DefaultConfig, FetchParams, RequestContext } from "@/apiClients";
import { StorageKey, Tokens } from "@/models";
import { getCurrentUser } from "@/helpers";
import { readFromStorage } from "./storage";

export async function initDefaultApiConfig(): Promise<void> {
    const env = await (await fetch("/env.json")).json();

    DefaultConfig.config = new Configuration({
        basePath: env?.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL,
        middleware: [new AddHeadersMiddleware()]
    });
}

export class AddHeadersMiddleware {
    async pre(context: RequestContext): Promise<FetchParams | void> {
        const fetchParams = { url: context.url, init: context.init };
        const headers = new Headers(fetchParams.init.headers);

        const tokens = await readFromStorage<Tokens>(StorageKey.Tokens);
        if (tokens !== undefined) {
            headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        }

        const currentUser = await getCurrentUser();
        if (currentUser != undefined && currentUser.tenants.length > 0) {
            headers.set("X-Tenant-Uuid", currentUser.tenants[0].tenantUuid);
        }

        fetchParams.init.headers = headers;
    }
}