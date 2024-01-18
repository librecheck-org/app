// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, test, vi } from "vitest";
import { ChangeStatus, StorageKey, SubmissionLocalChange, Submissions, updateChangeStatus } from "@/models";

describe("newUuid", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("when invoked, should return non-empty string", async () => {
        // Arrange
        vi.mock("@/infrastructure");
        const { usePersistentStore } = await import("@/infrastructure");
        const { setupMergeableObjectStore } = await import("@/stores/shared");

        usePersistentStore.mockReturnValue(1);

        // Act
        const store = setupMergeableObjectStore(StorageKey.Submissions);

        // Assert
        expect(store.length).toBeGreaterThan(0);
    });
});