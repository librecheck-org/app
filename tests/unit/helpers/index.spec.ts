// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, test, vi } from "vitest";

describe("newUuid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("when invoked, should return a date", async () => {
    // Arrange
    const { getCurrentDate } = await import("@/helpers");

    // Act
    const result = getCurrentDate();

    // Assert
    expect(result).toBeInstanceOf(Date);
  });
});