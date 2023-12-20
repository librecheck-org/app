import { afterEach, describe, expect, test, vi } from "vitest";
import { readFromStorage } from "@/infrastructure";

describe("getCurrentUser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("when invoked, should read user details from storage", async () => {
    // Arrange
    vi.mock("@/infrastructure");
    const { getCurrentUser } = await import("@/helpers");

    // Act
    await getCurrentUser();

    // Assert
    expect(readFromStorage).toHaveBeenCalledTimes(1);
  });
});

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