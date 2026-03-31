import path from "path";
import { resolveDevHttpsConfig } from "../utils/devHttps";

describe("resolveDevHttpsConfig", () => {
  it("is disabled by default", () => {
    expect(resolveDevHttpsConfig({})).toEqual({
      certPath: path.resolve(process.cwd(), ".cert/localhost.pem"),
      enabled: false,
      keyPath: path.resolve(process.cwd(), ".cert/localhost-key.pem"),
    });
  });

  it("enables local https when the flag is set", () => {
    expect(
      resolveDevHttpsConfig({
        DEV_HTTPS_ENABLED: "true",
      })
    ).toEqual({
      certPath: path.resolve(process.cwd(), ".cert/localhost.pem"),
      enabled: true,
      keyPath: path.resolve(process.cwd(), ".cert/localhost-key.pem"),
    });
  });

  it("resolves relative certificate paths from the repo root", () => {
    expect(
      resolveDevHttpsConfig({
        DEV_HTTPS_ENABLED: "1",
        DEV_HTTPS_CERT_PATH: "certs/dev-cert.pem",
        DEV_HTTPS_KEY_PATH: "certs/dev-key.pem",
      })
    ).toEqual({
      certPath: path.resolve(process.cwd(), "certs/dev-cert.pem"),
      enabled: true,
      keyPath: path.resolve(process.cwd(), "certs/dev-key.pem"),
    });
  });
});
