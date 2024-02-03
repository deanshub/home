export function getOrThrow(env: string): string {
  const value = process.env[env];
  if (value === undefined) {
    throw new Error(`Environment variable "${env}" is not set`);
  }
  return value;
}
