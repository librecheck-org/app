// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, test, vi } from "vitest";

describe("getCurrentUser", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("when invoked, should read user details from storage", async () => {
        // Arrange
        vi.mock("@/infrastructure/storage");
        const { readFromStorage } = await import("@/infrastructure/storage");
        const { getCurrentUser } = await import("@/infrastructure/iam");

        // Act
        await getCurrentUser();

        // Assert
        expect(readFromStorage).toHaveBeenCalledTimes(1);
    });
});
