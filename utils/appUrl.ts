type AppUrlEnv = {
  BASE_URL?: string;
  DOMAIN?: string;
  [key: string]: string | undefined;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getAppBaseUrl = (env: AppUrlEnv = process.env) => {
  const configuredBaseUrl = env.BASE_URL || env.DOMAIN || "http://localhost:8080";
  return trimTrailingSlash(configuredBaseUrl);
};

export const buildAppUrl = (
  path: string,
  env: AppUrlEnv = process.env
) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl(env)}${normalizedPath}`;
};
