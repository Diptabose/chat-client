export function isNullOrUndefined(data: unknown) {
  return data === null || data === undefined;
}

export function isStringEmpty(data: string) {
  return data.trim() === "";
}
