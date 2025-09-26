const messageToSign = {
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "string" },
      { name: "verifyingContract", type: "string" },
    ],
    Message: [
      { name: "contents", type: "string" },
      { name: "from", type: "string" },
      { name: "to", type: "string" },
    ],
  },
  primaryType: "Message",
  domain: {
    name: "Starky",
    version: "1",
    chainId: "stellar",
    verifyingContract: "starky.wtf",
  },
  message: {
    contents:
      "Sign this message to verify that you are the owner of this account. This will not trigger a blockchain transaction or cost any gas fees.",
    from: "starky.wtf",
    to: "Discord server",
  },
};

export default messageToSign;
