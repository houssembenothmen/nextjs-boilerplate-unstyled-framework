/** `data-foo={dataAttr(cond)}` renders `data-foo=""` when true, nothing when false. */
export const dataAttr = (condition: unknown) => (condition ? "" : undefined);
export const ariaAttr = (condition: unknown) => (condition ? true : undefined);
