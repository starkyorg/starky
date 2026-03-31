import fs from "fs";
import path from "path";

type HttpsEnv = {
  DEV_HTTPS_ENABLED?: string;
  DEV_HTTPS_CERT_PATH?: string;
  DEV_HTTPS_KEY_PATH?: string;
  [key: string]: string | undefined;
};

const defaultCertPath = ".cert/localhost.pem";
const defaultKeyPath = ".cert/localhost-key.pem";

const isEnabled = (value?: string) => value === "true" || value === "1";

const resolvePath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

export const resolveDevHttpsConfig = (env: HttpsEnv = process.env) => ({
  enabled: isEnabled(env.DEV_HTTPS_ENABLED),
  certPath: resolvePath(env.DEV_HTTPS_CERT_PATH || defaultCertPath),
  keyPath: resolvePath(env.DEV_HTTPS_KEY_PATH || defaultKeyPath),
});

export const getDevHttpsCredentials = (env: HttpsEnv = process.env) => {
  const config = resolveDevHttpsConfig(env);
  if (!config.enabled) return null;

  if (!fs.existsSync(config.keyPath) || !fs.existsSync(config.certPath)) {
    throw new Error(
      `DEV_HTTPS_ENABLED is set, but certificate files were not found. Expected key at ${config.keyPath} and cert at ${config.certPath}. Generate trusted local certs first, for example with mkcert.`
    );
  }

  return {
    key: fs.readFileSync(config.keyPath),
    cert: fs.readFileSync(config.certPath),
  };
};
