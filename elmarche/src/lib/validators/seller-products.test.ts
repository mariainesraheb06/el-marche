import { describe, expect, it } from "vitest";
import { createProductSchema, isValidImagePath, updateProductSchema } from "./seller-products";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "99999999-9999-4999-8999-999999999999";
const image = (n: number) => `${userId}/${String(n).repeat(8)}-2222-4222-8222-222222222222.jpg`;

const valid = {
  title: "Jogger baggy noir",
  description: "Jogger en coton épais, coupe ample, taille élastique.",
  priceDzd: 3200,
  categoryId: 1,
  wilayaCode: 16,
  imagePaths: [image(1), image(2), image(3)],
};

describe("createProductSchema", () => {
  it("accepts a valid payload and defaults tags to an empty list", () => {
    const result = createProductSchema.parse(valid);
    expect(result.tags).toEqual([]);
    expect(result.priceDzd).toBe(3200);
  });

  it("rejects fewer than 3 images", () => {
    expect(createProductSchema.safeParse({ ...valid, imagePaths: [image(1), image(2)] }).success).toBe(false);
  });

  it("rejects more than 5 images", () => {
    const six = [1, 2, 3, 4, 5, 6].map(image);
    expect(createProductSchema.safeParse({ ...valid, imagePaths: six }).success).toBe(false);
  });

  it("rejects a price of zero or a fractional price", () => {
    expect(createProductSchema.safeParse({ ...valid, priceDzd: 0 }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...valid, priceDzd: "12.5" }).success).toBe(false);
  });

  it("rejects an unknown wilaya", () => {
    expect(createProductSchema.safeParse({ ...valid, wilayaCode: 999 }).success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts a partial update and rejects an empty one", () => {
    expect(updateProductSchema.safeParse({ title: "Nouveau titre" }).success).toBe(true);
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });
});

describe("isValidImagePath", () => {
  it("accepts a file inside the seller's own folder", () => {
    expect(isValidImagePath(image(1), userId)).toBe(true);
  });

  it("rejects other folders, other extensions and path tricks", () => {
    expect(isValidImagePath(image(1), otherUserId)).toBe(false);
    expect(isValidImagePath(image(1).replace(".jpg", ".gif"), userId)).toBe(false);
    expect(isValidImagePath(`${userId}/../${otherUserId}/x.jpg`, userId)).toBe(false);
  });
});