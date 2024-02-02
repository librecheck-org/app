// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, StorageKey } from "@/models";
import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { Ref, ref } from "vue";
import { getRecordPairs, newUuid } from "@/helpers";

describe("useMergeableObjectStore", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    async function useMockPersistentStore(value: Ref) {
        const { usePersistentStore } = await import("@/infrastructure");

        const ensureIsInitialized = vi.fn();
        const read = vi.fn().mockImplementation(() => value.value);
        const update = vi.fn().mockImplementation((updates, updater) => {
            value.value = updater(value.value, updates);
        });

        const mockPersistentStore = { ensureIsInitialized, read, update };
        usePersistentStore.mockReturnValue(mockPersistentStore);
        return mockPersistentStore;
    }

    async function useMockMergeableObjectStore(
        value: Ref,
        createWorkingCopy: Mock | undefined = undefined,
        mapDetailsToWorkingCopy: Mock | undefined = undefined,
        mapWorkingCopyToDetails: Mock | undefined = undefined
    ) {
        const { useMergeableObjectStore } = await import("@/stores/shared");

        createWorkingCopy ??= vi.fn();
        mapDetailsToWorkingCopy ??= vi.fn();
        mapWorkingCopyToDetails ??= vi.fn();

        return useMergeableObjectStore(StorageKey.Submissions, value, createWorkingCopy, mapDetailsToWorkingCopy, mapWorkingCopyToDetails);
    }

    test("when ensureWorkingCopy is invoked with undefined, a new working copy should be created", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        const mockPersistentStore = await useMockPersistentStore(value);

        const newObjectUuid = newUuid();

        const createWorkingCopy = vi.fn().mockReturnValue({ uuid: newObjectUuid });
        const store = await useMockMergeableObjectStore(value, createWorkingCopy);

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

        const value = ref();
        const mockPersistentStore = await useMockPersistentStore(value);

        const existingObjectUuid = newUuid();

        const mapDetailsToWorkingCopy = vi.fn().mockReturnValue({ uuid: existingObjectUuid });
        const store = await useMockMergeableObjectStore(value, undefined, mapDetailsToWorkingCopy);

        value.value.details[existingObjectUuid] = {
            uuid: existingObjectUuid,
            timestamp: new Date(),
        };

        // Act
        await store.ensureWorkingCopy(existingObjectUuid);

        // Assert
        expect(mapDetailsToWorkingCopy).toBeCalledTimes(1);
        expect(mockPersistentStore.update).toBeCalledTimes(1);

        const updates = mockPersistentStore.update.mock.lastCall[0];
        const newWorkingCopy = updates.workingCopies[existingObjectUuid];
        expect(newWorkingCopy).toBeDefined();
        expect(newWorkingCopy.uuid).toBe(existingObjectUuid);
    });

    test("when ensureWorkingCopy is invoked with a UUID, and its working copy exists but it is stale, a new working copy should be created from existing object", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        const mockPersistentStore = await useMockPersistentStore(value);

        const existingObjectUuid = newUuid();
        const existingObjectTimestamp = new Date();

        const mapDetailsToWorkingCopy = vi.fn().mockReturnValue({ uuid: existingObjectUuid, timestamp: existingObjectTimestamp });
        const store = await useMockMergeableObjectStore(value, undefined, mapDetailsToWorkingCopy);

        value.value.workingCopies[existingObjectUuid] = {
            uuid: existingObjectUuid,
            timestamp: new Date(existingObjectTimestamp.getTime() - 1),
        };

        value.value.details[existingObjectUuid] = {
            uuid: existingObjectUuid,
            timestamp: existingObjectTimestamp,
        };

        // Act
        await store.ensureWorkingCopy(existingObjectUuid);

        // Assert
        expect(mapDetailsToWorkingCopy).toBeCalledTimes(1);
        expect(mockPersistentStore.update).toBeCalledTimes(1);

        const updates = mockPersistentStore.update.mock.lastCall[0];
        const newWorkingCopy = updates.workingCopies[existingObjectUuid];
        expect(newWorkingCopy).toBeDefined();
        expect(newWorkingCopy.uuid).toBe(existingObjectUuid);
        expect(newWorkingCopy.timestamp).toBe(existingObjectTimestamp);
    });

    test("when ensureWorkingCopy is invoked with a UUID, and its working copy exists and it has changes, the same working copy should be returned", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        const mockPersistentStore = await useMockPersistentStore(value);

        const existingObjectUuid = newUuid();
        const existingObjectTimestamp = new Date();

        const mapDetailsToWorkingCopy = vi.fn().mockReturnValue({ uuid: existingObjectUuid, timestamp: existingObjectTimestamp });
        const store = await useMockMergeableObjectStore(value, undefined, mapDetailsToWorkingCopy);

        value.value.workingCopies[existingObjectUuid] = {
            uuid: existingObjectUuid,
            timestamp: new Date(existingObjectTimestamp.getTime() + 1),
            changeStatus: ChangeStatus.Updated,
        };

        value.value.details[existingObjectUuid] = {
            uuid: existingObjectUuid,
            timestamp: existingObjectTimestamp,
        };

        // Act
        const result = await store.ensureWorkingCopy(existingObjectUuid);

        // Assert
        expect(mapDetailsToWorkingCopy).toBeCalledTimes(0);
        expect(mockPersistentStore.update).toBeCalledTimes(0);
        expect(result).toBe(value.value.workingCopies[existingObjectUuid]);
    });

    test("when deleteWorkingCopy is invoked, and related working copy does not exist, no error should be thrown", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();

        const store = await useMockMergeableObjectStore(value);

        // Act & Assert
        expect(async () => await store.deleteWorkingCopy(objectUuid)).not.toThrow();
    });

    test("when deleteWorkingCopy is invoked, and related working copy exists, it should be deleted", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();

        const store = await useMockMergeableObjectStore(value);

        value.value.workingCopies[objectUuid] = {
            uuid: objectUuid,
        };

        // Act
        await store.deleteWorkingCopy(objectUuid);

        // Assert
        const pairs = getRecordPairs(value.value.workingCopies);
        expect(pairs.length).toBe(0);
    });

    test("when readObject is invoked, and related working copy does not exist, stored details should be returned", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();

        const store = await useMockMergeableObjectStore(value);

        value.value.details[objectUuid] = {
            uuid: objectUuid,
        };

        // Act
        const result = await store.readObject(objectUuid);

        // Assert
        expect(result).toBeDefined();
        expect(result.uuid).toBe(objectUuid);
    });

    test("when readObject is invoked, and related details do not exist, working copy should be returned", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();

        const store = await useMockMergeableObjectStore(value);

        value.value.workingCopies[objectUuid] = {
            uuid: objectUuid,
        };

        // Act
        const result = await store.readObject(objectUuid);

        // Assert
        expect(result).toBeDefined();
        expect(result.uuid).toBe(objectUuid);
    });

    test("when readObject is invoked, and working copy is newer than details, working copy should be returned", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();
        const detailsTimestamp = new Date();
        const workingCopyTimestamp = new Date(detailsTimestamp.getTime() + 1);

        const store = await useMockMergeableObjectStore(value);

        value.value.details[objectUuid] = {
            uuid: objectUuid,
            timestamp: detailsTimestamp,
        };

        value.value.workingCopies[objectUuid] = {
            uuid: objectUuid,
            timestamp: workingCopyTimestamp,
        };

        // Act
        const result = await store.readObject(objectUuid);

        // Assert
        expect(result).toBeDefined();
        expect(result.uuid).toBe(objectUuid);
        expect(result.timestamp).toBe(workingCopyTimestamp);
    });

    test("when readObject is invoked, and working copy is older than details, details should be returned", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();
        const detailsTimestamp = new Date();
        const workingCopyTimestamp = new Date(detailsTimestamp.getTime() - 1);

        const store = await useMockMergeableObjectStore(value);

        value.value.details[objectUuid] = {
            uuid: objectUuid,
            timestamp: detailsTimestamp,
        };

        value.value.workingCopies[objectUuid] = {
            uuid: objectUuid,
            timestamp: workingCopyTimestamp,
        };

        // Act
        const result = await store.readObject(objectUuid);

        // Assert
        expect(result).toBeDefined();
        expect(result.uuid).toBe(objectUuid);
        expect(result.timestamp).toBe(detailsTimestamp);
    });

    test("when deleteObject is invoked, a working copy with deleted change status should exist", async () => {
        // Arrange
        vi.mock("@/infrastructure");

        const value = ref();
        await useMockPersistentStore(value);

        const objectUuid = newUuid();

        const mapDetailsToWorkingCopy = vi.fn().mockReturnValue({ uuid: objectUuid });
        const store = await useMockMergeableObjectStore(value, undefined, mapDetailsToWorkingCopy);

        value.value.details[objectUuid] = {
            uuid: objectUuid,
        };

        // Act
        await store.deleteObject(objectUuid);

        // Assert
        const workingCopy = value.value.workingCopies[objectUuid];
        expect(workingCopy).toBeDefined();
        expect(workingCopy.uuid).toBe(objectUuid);
        expect(workingCopy.changeStatus).toBe(ChangeStatus.Deleted);
    });
});