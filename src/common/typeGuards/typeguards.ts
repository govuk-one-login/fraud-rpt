export function stringTypeGuard(value: string | undefined): value is string {
  return !!value;
}
