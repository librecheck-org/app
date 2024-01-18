// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, test, vi } from "vitest";
import { StorageKey } from "@/models";
import { newUuid } from "@/helpers";
import { ref } from "vue";

describe("useMergeableObjectStore", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function useMockPersistentStore(usePersistentStore) {
        const read = vi.fn();
        const update = vi.fn();
        const mocks = { read, update };
        usePersistentStore.mockReturnValue(mocks);
        return mocks;
    }

    test("when createWorkingCopy is invoked with undefined, a new working copy should be created", async () => {
        // Arrange
        vi.mock("@/infrastructure");
        const { usePersistentStore } = await import("@/infrastructure");
        const { useMergeableObjectStore } = await import("@/stores/shared");

        const mockPersistentStore = useMockPersistentStore(usePersistentStore);

        const value = ref();
        const createNewWorkingCopy = vi.fn().mockReturnValue({ uuid: newUuid() });
        const mapToWorkingCopy = vi.fn();
        const store = useMergeableObjectStore(StorageKey.Submissions, value, createNewWorkingCopy, mapToWorkingCopy);

        // Act
        await store.createWorkingCopy(undefined);

        // Assert
        expect(createNewWorkingCopy).toBeCalledTimes(1);
        expect(mockPersistentStore.update).toBeCalledTimes(1);
    });
});