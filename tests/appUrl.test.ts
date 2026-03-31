import { buildAppUrl, getAppBaseUrl } from "../utils/appUrl";

describe("getAppBaseUrl", () => {
  it("prefers BASE_URL when it is configured", () => {
    expect(
      getAppBaseUrl({
        BASE_URL: "https://macau.example/",
        DOMAIN: "https://ignored.example",
      })
    ).toBe("https://macau.example");
  });

  it("falls back to DOMAIN for self-hosted deployments", () => {
    expect(
      getAppBaseUrl({
        DOMAIN: "https://macau.example/",
      })
    ).toBe("https://macau.example");
  });
});

describe("buildAppUrl", () => {
  it("builds slash-command links against the configured app domain", () => {
    expect(
      buildAppUrl("/help", {
        BASE_URL: "https://macau.example/",
      })
    ).toBe("https://macau.example/help");
  });
});
