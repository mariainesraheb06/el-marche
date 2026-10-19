import { describe, expect, it, vi } from "vitest";
import {
  applyFavoriteResult,
  favoriteRequest,
  readApiErrorMessage,
  runFavoriteToggle,
  toggleFavoriteId,
} from "./favorites";

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

describe("favoriteRequest", () => {
  it("maps add to PUT on the product endpoint", () => {
    expect(favoriteRequest("add", "9f1c0a2e-0000-4000-8000-000000000000")).toEqual({
      url: "/api/favorites/9f1c0a2e-0000-4000-8000-000000000000",
      method: "PUT",
    });
  });

  it("maps remove to DELETE on the same endpoint", () => {
    expect(favoriteRequest("remove", "abc")).toEqual({
      url: "/api/favorites/abc",
      method: "DELETE",
    });
  });

  it("uses the endpoint from docs/api-contract.md", () => {
    expect(favoriteRequest("add", "abc").url).toBe("/api/favorites/abc");
  });
});

describe("readApiErrorMessage", () => {
  it("returns the French message from the contract error shape", async () => {
    const response = jsonResponse(401, {
      error: { code: "unauthorized", message: "Connexion requise." },
    });
    expect(await readApiErrorMessage(response)).toBe("Connexion requise.");
  });

  it("returns a 404 message from the service layer", async () => {
    const response = jsonResponse(404, {
      error: { code: "not_found", message: "Produit introuvable." },
    });
    expect(await readApiErrorMessage(response)).toBe("Produit introuvable.");
  });

  it("returns null when the body is not JSON", async () => {
    const response = new Response("<html>gateway error</html>", { status: 500 });
    expect(await readApiErrorMessage(response)).toBeNull();
  });

  it("returns null when the error object is missing", async () => {
    expect(await readApiErrorMessage(jsonResponse(500, {}))).toBeNull();
  });

  it("returns null when the message is empty or only whitespace", async () => {
    expect(await readApiErrorMessage(jsonResponse(500, { error: { message: "" } }))).toBeNull();
    expect(await readApiErrorMessage(jsonResponse(500, { error: { message: "  " } }))).toBeNull();
  });

  it("returns null when the message is not a string", async () => {
    expect(await readApiErrorMessage(jsonResponse(500, { error: { message: 42 } }))).toBeNull();
  });
});

describe("runFavoriteToggle — unauthenticated", () => {
  it("sends no request and asks the UI to go to the login page", async () => {
    const fetchImpl = vi.fn();
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.outcome).toBe("redirect-login");
    expect(result.message).toBeNull();
  });

  it("leaves the current state untouched", async () => {
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: true,
      isLoggedIn: false,
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });

    expect(result.isFavorite).toBe(true);
  });
});

describe("runFavoriteToggle — optimistic update", () => {
  it("sends PUT when the product is not a favourite yet", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("/api/favorites/abc", { method: "PUT" });
  });

  it("sends DELETE when the product is already a favourite", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await runFavoriteToggle({
      productId: "abc",
      isFavorite: true,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/favorites/abc", { method: "DELETE" });
  });

  it("keeps the flipped state when the API accepts the change", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("success");
    expect(result.isFavorite).toBe(true);
    expect(result.message).toBeNull();
  });
});

describe("runFavoriteToggle — rollback on failure", () => {
  it("undoes the optimistic change on a server error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("reverted");
    expect(result.isFavorite).toBe(false);
  });

  it("surfaces the French message sent by the service", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(404, { error: { code: "not_found", message: "Produit introuvable." } }));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: true,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("reverted");
    expect(result.isFavorite).toBe(true);
    expect(result.message).toBe("Produit introuvable.");
  });

  it("falls back to a French message when the API sends none", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("reverted");
    expect(result.message).toBe("Impossible de mettre à jour vos favoris.");
  });

  it("undoes the optimistic change when the network fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("network-error");
    expect(result.isFavorite).toBe(false);
    expect(result.message).toBe("Connexion impossible. Réessayez.");
  });
});

describe("runFavoriteToggle — expired session", () => {
  it("rolls back and asks for the login page on 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: { code: "unauthorized", message: "Connexion requise." } }));
    const result = await runFavoriteToggle({
      productId: "abc",
      isFavorite: false,
      isLoggedIn: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.outcome).toBe("redirect-login");
    expect(result.isFavorite).toBe(false);
    expect(result.message).toBeNull();
  });
});

describe("toggleFavoriteId", () => {
  it("adds a product that was not in the wishlist", () => {
    expect(toggleFavoriteId(new Set(["a"]), "b")).toEqual(new Set(["a", "b"]));
  });

  it("removes a product that was already in the wishlist", () => {
    expect(toggleFavoriteId(new Set(["a", "b"]), "a")).toEqual(new Set(["b"]));
  });

  it("never mutates the set it was given", () => {
    const original = new Set(["a"]);
    toggleFavoriteId(original, "b");
    expect(original).toEqual(new Set(["a"]));
  });
});

describe("applyFavoriteResult", () => {
  it("keeps the product after a successful add", () => {
    expect(applyFavoriteResult(new Set(), "a", { isFavorite: true })).toEqual(new Set(["a"]));
  });

  it("puts the product back after a rollback on add", () => {
    expect(applyFavoriteResult(new Set(["a"]), "a", { isFavorite: false })).toEqual(new Set());
  });

  it("leaves the other products untouched", () => {
    expect(applyFavoriteResult(new Set(["a", "b"]), "b", { isFavorite: false })).toEqual(
      new Set(["a"]),
    );
  });

  it("never mutates the set it was given", () => {
    const original = new Set(["a"]);
    applyFavoriteResult(original, "b", { isFavorite: true });
    expect(original).toEqual(new Set(["a"]));
  });
});