import { getTokenBalance, server } from "./getTokenBalance";

describe("getTokenBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns balance for a custom token (e.g., USD:ISSUER)", async () => {
    jest.spyOn(server, "loadAccount").mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "50.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USD",
          asset_issuer: "GISSUERPK",
          balance: "123.4567890",
        },
      ],
    });

    const balance = await getTokenBalance(
      "GPUBLICKEY",
      "USD",
      "GISSUERPK"
    );
    expect(balance).toBe("123.4567890");
  });

  test("returns '0' when user does not hold the target token", async () => {
    jest.spyOn(server, "loadAccount").mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "10.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "EUR",
          asset_issuer: "GOTHERISSUER",
          balance: "5.0000000",
        },
      ],
    });

    const balance = await getTokenBalance(
      "GPUBLICKEY",
      "USD",
      "GISSUERPK"
    );
    expect(balance).toBe("0");
  });

  test("returns balance for native asset (XLM)", async () => {
    jest.spyOn(server, "loadAccount").mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "42.0000000" },
      ],
    });

    const balance = await getTokenBalance("GPUBLICKEY", "XLM", "native");
    expect(balance).toBe("42.0000000");
  });

  test("returns '0' when loadAccount throws (account missing)", async () => {
    jest.spyOn(server, "loadAccount").mockRejectedValue(
      new Error("Account not found")
    );

    const balance = await getTokenBalance(
      "GDOESNOTEXIST",
      "USD",
      "GISSUERPK"
    );
    expect(balance).toBe("0");
  });
});


