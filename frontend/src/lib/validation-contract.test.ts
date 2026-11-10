import { describe, expect, it } from "vitest";
import * as backend from "../../../backend/src/common/validation/validation-contract.ts";
import * as frontend from "./validation-contract.ts";

describe("validation contract", () => {
  it("exports the same names as the backend contract", () => {
    expect(Object.keys(frontend).sort()).toEqual(Object.keys(backend).sort());
  });

  it.each(Object.keys(backend))("%s matches the backend exactly", (name) => {
    const key = name as keyof typeof backend;
    const expected = backend[key];
    const actual = frontend[key as keyof typeof frontend];
    if (expected instanceof RegExp) {
      expect(String(actual)).toBe(String(expected));
    } else {
      expect(actual).toEqual(expected);
    }
  });
});
