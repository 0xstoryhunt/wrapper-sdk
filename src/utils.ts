import { getAccount, getBalance, getClient, readContract } from '@wagmi/core';
import { encodeFunctionData, erc20Abi } from 'viem';
import { ADDRESSES, config } from './constants';
import { useWriteContract } from 'wagmi';
import { MaxUint256 } from '@uniswap/sdk-core';

export const estimateGasCost = async (
  gasParams: {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args: unknown[];
    value: bigint;
  },
  gasPercentage = BigInt(100)
) => {
  try {
    const client = getClient(config);
    const data = encodeFunctionData(gasParams);

    const estimatedGas = await client?.request({
      method: 'eth_estimateGas',
      params: [
        {
          // from: client?.account.address as `0x${string}`,
          to: gasParams.address as `0x${string}`,
          data,
          value: `0x${gasParams.value.toString(16)}`,
        },
      ],
    });

    const adjustedGas = estimatedGas
      ? (BigInt(estimatedGas) * gasPercentage) / BigInt(100)
      : undefined;

    return adjustedGas;
  } catch (error) {
    console.error('Error estimating gas:', error);
    return undefined;
  }
};

export const tokenApproval = async (
  token: string,
  spender: string,
  amount: bigint = BigInt(MaxUint256.toString())
) => {
  const { writeContractAsync: approvalWriter } = useWriteContract();
  return await approvalWriter({
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender as `0x${string}`, amount],
  });
};

export const getAllowence = async (token: string, spender: string) => {
  const address = getAccount(config).address;
  if (!address) {
    throw new Error('No connected address found');
  }

  return await readContract(config, {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, spender as `0x${string}`],
  });
};

export const getTokenBalance = async (token = ADDRESSES.TOKENS.IP.id) => {
  const address = getAccount(config).address;
  if (!address) {
    throw new Error('No connected address found');
  }
  if (token === ADDRESSES.TOKENS.IP.id) {
    return await getBalance(config, {
      address,
    });
  }
  return await getBalance(config, {
    address,
    token: token as `0x${string}`,
  });
};
