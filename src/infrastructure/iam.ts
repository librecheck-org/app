// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey } from "@/models";
import { UserDetails } from "@/apiClients";
import { readFromStorage } from "./storage";

export async function getCurrentUser(): Promise<UserDetails | undefined> {
    return await readFromStorage<UserDetails>(StorageKey.CurrentUser);
}
