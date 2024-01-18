// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, expect, test } from "vitest";

describe("newUuid", () => {
    test("when invoked, should return non-empty string", async () => {
        // Arrange
        const { newUuid } = await import("@/helpers");

        // Act
        const result = newUuid();

        // Assert
        expect(result.length).toBeGreaterThan(0);
    });
});

describe("getCurrentDate", () => {
    test("when invoked, should return a date", async () => {
        // Arrange
        const { getCurrentDate } = await import("@/helpers");

        // Act
        const result = getCurrentDate();

        // Assert
        expect(result).toBeInstanceOf(Date);
    });
});

describe("getRecordPairs", () => {
    test("with an empty record, should return an empty array", async () => {
        // Arrange
        const { getRecordPairs } = await import("@/helpers");

        // Act
        const result = getRecordPairs({});

        // Assert
        expect(result.length).toBe(0);
    });

    test("with a record, should return an array with its keys and values", async () => {
        // Arrange
        const { getRecordPairs } = await import("@/helpers");

        // Act
        const result = getRecordPairs({
            "k1": 1,
            "k2": 2
        });

        // Assert
        expect(result.length).toBe(2);
        expect(result[0]).toMatchObject({ key: "k1", value: 1 });
        expect(result[1]).toMatchObject({ key: "k2", value: 2 });
    });
});

describe("getRecordValues", () => {
    test("with an empty record, should return an empty array", async () => {
        // Arrange
        const { getRecordValues } = await import("@/helpers");

        // Act
        const result = getRecordValues({});

        // Assert
        expect(result.length).toBe(0);
    });

    test("with a record, should return an array with its values", async () => {
        // Arrange
        const { getRecordValues } = await import("@/helpers");

        // Act
        const result = getRecordValues({
            "k1": 1,
            "k2": 2
        });

        // Assert
        expect(result.length).toBe(2);
        expect(result[0]).toBe(1);
        expect(result[1]).toBe(2);
    });
});

describe("fireAndForget", () => {
    test("when invoked, should schedule an async execution of input function", async () => {
        // Arrange
        const { fireAndForget } = await import("@/helpers");
        let executed = false;

        // Act
        await fireAndForget(async () => {
            executed = true;
        });

        // Assert
        expect(executed).toBe(true);
    });
});