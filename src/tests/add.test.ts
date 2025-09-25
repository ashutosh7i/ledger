import { add } from "@/utils/add";

describe("add function", () => {
  it("should return the sum of two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
