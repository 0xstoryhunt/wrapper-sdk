import { useWriteContract } from 'wagmi';
import {ADDRESSES} from '../constants';
import { V3_SWAP_ROUTER_ABI } from './abi';

export const v2Swap = async (
  amount1: bigint,
  amount2Min: bigint,
  path: string[],
  currentAccountAddress: string,
  expirationTimestamp: bigint
) => {
  const { writeContractAsync: swapWriter } = useWriteContract();

  try {
    let hash = '0x';
    if (path[0] == WIP_ADDRESS) {
      // swap Exact ETH for tokens
      hash = await swapWriter({
        abi: v2_router_abi,
        address: v2RouterAddress,
        functionName: 'swapExactETHForTokens',
        args: [
          amount2Min,
          path.map(token => token as `0x${string}`),
          currentAccountAddress as `0x${string}`,
          expirationTimestamp,
        ],
        value: amount1,
      });
    } else if (path[path.length - 1] == WIP_ADDRESS) {
      // swap Exact tokens for ETH
      hash = await swapWriter({
        abi: v2_router_abi,
        address: v2RouterAddress,
        functionName: 'swapExactTokensForETH',
        args: [
          amount1,
          amount2Min,
          path.map(token => token as `0x${string}`),
          currentAccountAddress as `0x${string}`,
          expirationTimestamp,
        ],
      });
    } else {
      hash = await swapWriter({
        abi: v2_router_abi,
        address: v2RouterAddress,
        functionName: 'swapExactTokensForTokens',
        args: [
          amount1,
          amount2Min,
          path.map(token => token as `0x${string}`),
          currentAccountAddress as `0x${string}`,
          expirationTimestamp,
        ],
      });
    }
  } catch (error) {
    console.error('Error in swap:', error);
  }
};
