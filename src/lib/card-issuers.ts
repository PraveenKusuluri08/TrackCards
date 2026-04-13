// Common card issuers for auto-detection
export const CARD_ISSUERS = [
  "American Express",
  "Bank of America",
  "Capital One",
  "Chase",
  "Citi",
  "Discover",
  "Navy Federal",
  "PNC",
  "US Bank",
  "Wells Fargo",
  "Barclays",
  "Synchrony",
  "Credit One",
  "Ally",
  "Apple",
] as const;

export type CardIssuer = (typeof CARD_ISSUERS)[number];

/**
 * Detect card issuer from card name or issuer input.
 * Returns matching issuer or null if no match.
 */
export function detectCardIssuer(input: string): string | null {
  if (!input || input.trim().length < 2) return null;
  const lower = input.toLowerCase().trim();
  for (const issuer of CARD_ISSUERS) {
    const issuerLower = issuer.toLowerCase();
    // Match if input contains issuer name or vice versa
    if (lower.includes(issuerLower) || issuerLower.includes(lower)) {
      return issuer;
    }
  }
  // Partial matches for common abbreviations and variations
  const abbrev: Record<string, string> = {
    amex: "American Express",
    discover: "Discover",
    "capital one": "Capital One",
    capitalone: "Capital One",
    capital1: "Capital One",
    "capital 1": "Capital One",
    "cap one": "Capital One",
    capone: "Capital One",
    chase: "Chase",
    citi: "Citi",
    citibank: "Citi",
    bofa: "Bank of America",
    boa: "Bank of America",
    "bank of america": "Bank of America",
    "wells fargo": "Wells Fargo",
    barclay: "Barclays",
    "navy fed": "Navy Federal",
    "navy federal": "Navy Federal",
    "us bank": "US Bank",
    usbank: "US Bank",
    pnc: "PNC",
    synchrony: "Synchrony",
  };
  for (const [key, value] of Object.entries(abbrev)) {
    if (lower.includes(key)) return value;
  }
  return null;
}
