export function toTsQuery(input: string): string | null {
  const tokens = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0)
    .slice(0, 8);

  if (tokens.length === 0) return null;
  return tokens.map((token) => `${token}:*`).join(" & ");
}