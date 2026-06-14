// Derives a URL-safe slug from arbitrary text. A pure function: same input,
// same output, no I/O. Rules are added one at a time, each forced by a test.
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
