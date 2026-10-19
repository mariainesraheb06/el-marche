// Shared favourites logic.
//
// The endpoints are fixed by docs/api-contract.md:
//   PUT    /api/favorites/{productId}  -> 204   (idempotent, also logs a "favorite" event)
//   DELETE /api/favorites/{productId}  -> 204
//
// Errors always come back as { error: { code, message } } (api-contract.md:10), and the
// message is already in French, so the client can display it as-is.

export type FavoriteAction = "add" | "remove";

// Used only when the API does not send a usable message.
export const DEFAULT_ERROR = "Impossible de mettre à jour vos favoris.";
const NETWORK_ERROR = "Connexion impossible. Réessayez.";

/** Builds the request for one favourites operation. */
export function favoriteRequest(
  action: FavoriteAction,
  productId: string,
): { url: string; method: "PUT" | "DELETE" } {
  return {
    url: `/api/favorites/${productId}`,
    method: action === "add" ? "PUT" : "DELETE",
  };
}

/**
 * Extracts the French error message from an API response.
 * Returns null when the body is missing, not JSON, or has no usable message,
 * so the caller can fall back to a generic string instead of showing "[object Object]".
 */
export async function readApiErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    const message = (body as { error?: { message?: unknown } } | null)?.error?.message;
    return typeof message === "string" && message.trim().length > 0 ? message : null;
  } catch {
    return null;
  }
}

export type FavoriteToggleOutcome =
  /** The wishlist now matches the value the UI already showed. */
  | "success"
  /** Signed out, or the session expired: send the visitor to /login. */
  | "redirect-login"
  /** The API refused: the optimistic value must be undone. */
  | "reverted"
  /** The request never reached the API: the optimistic value must be undone. */
  | "network-error";

export type FavoriteToggleResult = {
  outcome: FavoriteToggleOutcome;
  /** The state the UI must display once the request settles (kept, or rolled back). */
  isFavorite: boolean;
  /** French message to show, or null when there is nothing to report. */
  message: string | null;
};

/**
 * Runs one wishlist toggle and decides what the UI should end up showing.
 *
 * Kept free of React so the optimistic update, the rollback and the signed-out
 * case can be tested directly (vitest runs with environment: "node").
 * `fetchImpl` is only a test seam.
 */
export async function runFavoriteToggle(options: {
  productId: string;
  /** Current state before the tap. */
  isFavorite: boolean;
  isLoggedIn: boolean;
  fetchImpl?: typeof fetch;
}): Promise<FavoriteToggleResult> {
  const { productId, isFavorite, isLoggedIn } = options;

  // Signed out: send no request at all.
  if (!isLoggedIn) {
    return { outcome: "redirect-login", isFavorite, message: null };
  }

  // Optimistic update: flip immediately, before awaiting the API.
  const optimistic = !isFavorite;
  const { url, method } = favoriteRequest(optimistic ? "add" : "remove", productId);

  try {
    const response = await (options.fetchImpl ?? fetch)(url, { method });

    if (response.ok) {
      return { outcome: "success", isFavorite: optimistic, message: null };
    }

    // Roll back: isFavorite goes back to the value the UI had before the tap.
    if (response.status === 401) {
      return { outcome: "redirect-login", isFavorite, message: null };
    }
    return {
      outcome: "reverted",
      isFavorite,
      message: (await readApiErrorMessage(response)) ?? DEFAULT_ERROR,
    };
  } catch {
    return { outcome: "network-error", isFavorite, message: NETWORK_ERROR };
  }
}

/**
 * Flips one product in the shared wishlist, returning a new set.
 * Used for the optimistic update so the previous set is never mutated.
 */
export function toggleFavoriteId(
  ids: ReadonlySet<string>,
  productId: string,
): Set<string> {
  const next = new Set(ids);
  if (!next.delete(productId)) next.add(productId);
  return next;
}

/**
 * Applies what the API decided to the shared wishlist: keeps the optimistic value
 * when the request succeeded, or puts the previous one back when it did not.
 */
export function applyFavoriteResult(
  ids: ReadonlySet<string>,
  productId: string,
  result: Pick<FavoriteToggleResult, "isFavorite">,
): Set<string> {
  const next = new Set(ids);
  if (result.isFavorite) next.add(productId);
  else next.delete(productId);
  return next;
}