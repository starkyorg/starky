import { getTokenBalance } from '../getTokenBalance';
import StellarSdk from 'stellar-sdk';

jest.mock('stellar-sdk', () => {
  const mockServer = {
    accounts: () => ({
      strictGet: jest.fn(),
    }),
  };
  return {
    Horizon: {
      Server: jest.fn().mockImplementation(() => mockServer),
    },
  };
});

describe('getTokenBalance', () => {
  let mockStrictGet: jest.Mock;

  beforeEach(() => {
    const server = new StellarSdk.Horizon.Server('test');
    mockStrictGet = (server.accounts() as any).strictGet;
    jest.clearAllMocks();
  });

  it('should return the correct balance when the token is found', async () => {
    const mockAccount = {
      balances: [
        { asset_type: 'native', balance: '100' },
        { asset_type: 'credit', asset_code: 'USDC', asset_issuer: 'GISSUER123', balance: '50.5' },
      ],
    };
    mockStrictGet.mockResolvedValue(mockAccount);

    const balance = await getTokenBalance('GUSER123', 'USDC', 'GISSUER123');
    expect(balance).toBe('50.5');
  });

  it('should return "0" when the token is not found in the account', async () => {
    const mockAccount = {
      balances: [
        { asset_type: 'native', balance: '100' },
      ],
    };
    mockStrictGet.mockResolvedValue(mockAccount);

    const balance = await getTokenBalance('GUSER123', 'USDC', 'GISSUER123');
    expect(balance).toBe('0');
  });

  it('should return "0" when the account does not exist (404)', async () => {
    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };
    mockStrictGet.mockRejectedValue(error404);

    const balance = await getTokenBalance('GNONEXISTENT', 'USDC', 'GISSUER123');
    expect(balance).toBe('0');
  });

  it('should throw an error for network failures other than 404', async () => {
    mockStrictGet.mockRejectedValue(new Error('Network Error'));

    await expect(getTokenBalance('GUSER123', 'USDC', 'GISSUER123')).rejects.toThrow(
      'Failed to retrieve token balance'
    );
  });
});
