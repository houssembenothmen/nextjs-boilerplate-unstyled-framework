/** Tiny className combiner (no `clsx`/`classnames` dependency). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
