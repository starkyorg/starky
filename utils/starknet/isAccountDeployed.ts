import { NetworkName } from '../../types/networks';
import { getClassHashAt } from './classHash';

export const isAccountDeployed = async (
  starknetNetwork: NetworkName,
  accountAddress: string,
): Promise<boolean> => {
  try {
    const classHash = await getClassHashAt({ contractAddress: accountAddress, starknetNetwork });
    return !!classHash;
  } catch (e) {
    return false;
  }
}