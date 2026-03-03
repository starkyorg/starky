const isEnabled = (value: string | undefined) => {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const isCartridgeControllerEnabled = () =>
  isEnabled(process.env.NEXT_PUBLIC_ENABLE_CARTRIDGE_CONTROLLER) ||
  isEnabled(process.env.ENABLE_CARTRIDGE_CONTROLLER);

