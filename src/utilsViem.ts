import 'dotenv/config';
import {  encodeFunctionData, WalletClient } from 'viem';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { erc20Abi } from 'viem';
import { MaxUint256 } from '@uniswap/sdk-core';
import { ADDRESSES, defaultChain } from './constants';
import { readContract, writeContract } from 'viem/actions';
import { TokenInfo } from './v3/types';


const rpcUrl =
  defaultChain.rpcUrls.default.http[0] || 'https://odyssey.storyrpc.io';
const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;

if (!privateKey) {
  throw new Error('TEST_PRIVATE_KEY not set in .env');
}

export const account = privateKeyToAccount(privateKey);

export const publicClient = createPublicClient({
  chain: defaultChain, // Adjust if you need a different chain
  transport: http(rpcUrl),
});

export const walletClient: WalletClient = createWalletClient({
  chain: defaultChain,
  transport: http(rpcUrl),
  account,
});

interface GasParams {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args?: unknown[];
  value?: bigint;
}

/**
 * Estimates gas cost for a given contract call, applying an optional percentage.
 */
export const estimateGasCost = async (
  gasParams: GasParams,
  gasPercentage = BigInt(100)
): Promise<bigint | undefined> => {
  try {
    const data = encodeFunctionData({
      abi: gasParams.abi,
      functionName: gasParams.functionName,
      args: gasParams.args || [],
    });

    const estimatedGas = await publicClient.estimateGas({
      to: gasParams.address,
      data,
      value: gasParams.value && gasParams.value > BigInt(0) ? gasParams.value : undefined,
      account: account,
    });

    const adjustedGas = (estimatedGas * gasPercentage) / BigInt(100);
    return adjustedGas;
  } catch (error) {
    console.error('Error estimating gas:', error);
    return undefined;
  }
};

/**
 * Approves a spender to use a certain amount of tokens on behalf of the user's account.
 */
export const tokenApproval = async (
  token: string,
  spender: string,
  amount: bigint = BigInt(MaxUint256.toString())
) => {
  try {
    const hash = await writeContract(walletClient, {
      address: token as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender as `0x${string}`, amount],
      chain: defaultChain,
      account: account
    });
    return hash;
  } catch (error) {
    console.error('Error approving token:', error);
    throw error;
  }
};

/**
 * Retrieves the allowance of a token for a given spender.
 */
export const getAllowence = async (token: string, spender: string) => {
  if (!account.address) {
    throw new Error('No connected address found');
  }

  return (await readContract(publicClient, {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address as `0x${string}`, spender as `0x${string}`],
  })) as bigint;
};

/**
 * Retrieves the balance of the user's account. If the token is the native IP token,
 * it returns the native balance. Otherwise, it returns the ERC-20 token balance.
 */
export const getTokenBalance = async (token = ADDRESSES.TOKENS.IP.id) => {
  if (!account.address) {
    throw new Error('No connected address found');
  }

  if (token === ADDRESSES.TOKENS.IP.id) {
    // Native token balance
    const balance = await publicClient.getBalance({ address: account.address });
    return {
      value: balance,
      decimals: 18, // Native typically 18 decimals
    };
  } else {
    // ERC-20 token balance
    const [decimals, balance] = await Promise.all([
      readContract(publicClient, {
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      }) as Promise<number>,
      readContract(publicClient, {
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address as `0x${string}`],
      }) as Promise<bigint>,
    ]);

    return { value: balance, decimals };
  }
};


export async function getTokenInfo(address: `0x${string}`): Promise<TokenInfo> {
  const [decimals, symbol, name] = await Promise.all([
    readContract(publicClient, {
      address,
      abi: erc20Abi,
      functionName: 'decimals',
    }) as Promise<number>,
    readContract(publicClient, {
      address,
      abi: erc20Abi,
      functionName: 'symbol',
    }) as Promise<string>,
    readContract(publicClient, {
      address,
      abi: erc20Abi,
      functionName: 'name',
    }) as Promise<string>,
  ]);

  return { decimals, symbol, name };
}