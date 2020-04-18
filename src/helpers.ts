// joins its arguments with a space and ignores falsy ones
// its a small utility for className
export function clx(
  ...args: (string | false | 0 | null | undefined)[]
): string {
  return args.filter((e) => e).join(" ");
}

// type-safe Object.entries
// should be used only on objects you know the keys wont be polluted
// https://github.com/microsoft/TypeScript/issues/21826#issuecomment-479851685
export const objectEntries = Object.entries as <T>(
  o: T
) => [Extract<keyof T, string>, T[keyof T]][];

export function trimTrailingFloat(x: number): string {
  // Hack to prevent rounding error issues.
  return Number.parseFloat(x.toPrecision(12)).toString();
}
