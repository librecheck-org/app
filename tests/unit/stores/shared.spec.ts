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
        const mockPersistentStore = { read, update };
        usePersistentStore.mockReturnValue(mockPersistentStore);
        vi.spyOn(mockPersistentStore, "update");
        return mockPersistentStore;
    }

    test("when ensureWorkingCopy is invoked with undefined, a new working copy should be created", async () => {
        // Arrange
        vi.mock("@/infrastructure");
        const { usePersistentStore } = await import("@/infrastructure");
        const { useMergeableObjectStore } = await import("@/stores/shared");

        const mockPersistentStore = useMockPersistentStore(usePersistentStore);

        const newObjectUuid = newUuid();

        const value = ref();
        const createWorkingCopy = vi.fn().mockReturnValue({ uuid: newObjectUuid });
        const mapToWorkingCopy = vi.fn();
        const store = useMergeableObjectStore(StorageKey.Submissions, value, createWorkingCopy, mapToWorkingCopy);

        // Act
        await store.ensureWorkingCopy(undefined);

        // Assert
        expect(createWorkingCopy).toBeCalledTimes(1);
        expect(mockPersistentStore.update).toBeCalledTimes(1);

        const updates = mockPersistentStore.update.mock.lastCall[0];
        const newWorkingCopy = updates.workingCopies[newObjectUuid];
        expect(newWorkingCopy).toBeDefined();
        expect(newWorkingCopy.uuid).toBe(newObjectUuid);
    });

    test("when ensureWorkingCopy is invoked with a UUID, and its working copy does not exist, a new working copy should be created from existing object", async () => {
        // Arrange
        vi.mock("@/infrastructure");
        const { usePersistentStore } = await import("@/infrastructure");
        const { useMergeableObjectStore } = await import("@/stores/shared");

        const mockPersistentStore = useMockPersistentStore(usePersistentStore);

        const existingObjectUuid = newUuid();

        const value = ref();
        const createWorkingCopy = vi.fn();
        const mapToWorkingCopy = vi.fn().mockReturnValue({ uuid: existingObjectUuid });
        const store = useMergeableObjectStore(StorageKey.Submissions, value, createWorkingCopy, mapToWorkingCopy);

        // Act
        await store.ensureWorkingCopy(existingObjectUuid);

        // Assert
        expect(mapToWorkingCopy).toBeCalledTimes(1);
        expect(mockPersistentStore.update).toBeCalledTimes(1);

        const updates = mockPersistentStore.update.mock.lastCall[0];
        const newWorkingCopy = updates.workingCopies[existingObjectUuid];
        expect(newWorkingCopy).toBeDefined();
        expect(newWorkingCopy.uuid).toBe(existingObjectUuid);
    });
});