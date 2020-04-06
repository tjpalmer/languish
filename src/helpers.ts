// joins its arguments with a space and ignores falsy ones
// its a small utility for className
export function clx(
  ...args: (string | false | 0 | null | undefined)[]
): string {
  return args.filter((e) => e).join(" ");
}
