import {
  Account,
  Address,
  Chain,
  encodeFunctionData,
  WalletClient,
} from 'viem';
import { erc20Abi } from 'viem';
import { MaxUint256 } from '@storyhunt/core';
import { ADDRESSES, defaultChain } from './constants';
import { readContract, writeContract } from 'viem/actions';
import {
  getPublicClient,
  getWriteClient,
  getAccountAddress,
  getAccount,
  executeGraphQuery,
} from './config';
import { GasParams, GraphPoolResponse, PoolInfo, TokenInfo } from './v3/types';
import { ethers } from 'ethers';
import { POOL_ABI, POOL_FACTORY_ABI, WIP_ABI } from './v3/abi';
import JSBI from 'jsbi';
import { USER_POSITIONS_QUERY } from './v3/queries';

/**
 * Estimates gas cost for a given contract call, applying an optional percentage.
 *
 * @param gasParams - The parameters required for estimating gas.
 * @param gasPercentage - The percentage to adjust the estimated gas by (default is 100).
 * @returns The estimated gas cost adjusted by the given percentage, or undefined if an error occurs.
 */
export const estimateGasCost = async (
  gasParams: GasParams,
  gasPercentage = BigInt(100)
): Promise<bigint | undefined> => {
  try {
    const publicClient = getPublicClient();
    const data = encodeFunctionData(gasParams);
    const address = getAccountAddress();
    const estimatedGas = await publicClient?.request({
      method: 'eth_estimateGas',
      params: [
        {
          from: address as `0x${string}`,
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

/**
 * Approves a spender to use a certain amount of tokens on behalf of the user's account.
 * Uses universalWriteContract to handle both WalletClient and ethers.Signer.
 *
 * @param token - The address of the token to approve.
 * @param spender - The address of the spender to approve.
 * @param amount - The amount of tokens to approve (default is MaxUint256).
 */
export const tokenApproval = async (
  token: string,
  spender: string,
  amount: bigint = BigInt(MaxUint256.toString())
) => {
  const writeClient = getWriteClient();
  const account = getAccount();
  if (!account) {
    throw new Error('No connected account found.');
  }

  const params = {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender as `0x${string}`, amount],
    chain: defaultChain,
    value: BigInt(0),
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
};

/**
 * Approves V3_SWAP_ROUTER to use a certain amount of tokens on behalf of the user's account.
 * Uses universalWriteContract to handle both WalletClient and ethers.Signer.
 *
 * @param token - The address of the token to approve.
 * @param amount - The amount of tokens to approve (default is MaxUint256).
 */
export const v3RoutertokenApproval = async (
  token: string,
  amount: bigint = BigInt(MaxUint256.toString())
) => {
  const writeClient = getWriteClient();
  const account = getAccount();
  if (!account) {
    throw new Error('No connected account found.');
  }

  const params = {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'approve',
    args: [ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS, amount],
    chain: defaultChain,
    value: BigInt(0),
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  return result;
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
};

/**
 * Approves V3_NONFUNGIBLE_POSITION_MANAGER to use a certain amount of tokens on behalf of the user's account.
 * Uses universalWriteContract to handle both WalletClient and ethers.Signer.
 *
 * @param token - The address of the token to approve.
 * @param amount - The amount of tokens to approve (default is MaxUint256).
 */
export const v3PositionManagertokenApproval = async (
  token: string,
  amount: bigint = BigInt(MaxUint256.toString())
) => {
  const writeClient = getWriteClient();
  const account = getAccount();
  if (!account) {
    throw new Error('No connected account found.');
  }

  const params = {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'approve',
    args: [ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount],
    chain: defaultChain,
    value: BigInt(0),
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  return result;
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
};

/**
 * Retrieves the allowance of a token for a given spender.
 *
 * @param token - The address of the token.
 * @param spender - The address of the spender.
 * @returns The allowance of the token for the given spender.
 */
export const getAllowence = async (token: string, spender: string) => {
  const publicClient = getPublicClient();
  const account = getAccountAddress();
  if (!account) {
    throw new Error('No connected address found');
  }

  return (await readContract(publicClient, {
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account as `0x${string}`, spender as `0x${string}`],
  })) as bigint;
};

/**
 * Retrieves the pool of a token pair.
 *
 * @param token0 - The address of the first token.
 * @param token1 - The address of the second token.
 * @param fee - The fee tier of the pool (500, 3000, or 10000).
 * @returns The address of the pool for the given token pair and fee tier.
 */
export const getPool = async (
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee: 500 | 3000 | 10000
) => {
  const publicClient = getPublicClient();
  const account = getAccountAddress();
  if (!account) {
    throw new Error('No connected address found');
  }

  return (await readContract(publicClient, {
    address: ADDRESSES.V3_POOL_FACTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: POOL_FACTORY_ABI,
    functionName: 'getPool',
    args: [token0, token1, fee],
  })) as `0x${string}`;
};

/**
 * Retrieves the balance of the user's account. If the token is the native IP token,
 * it returns the native balance. Otherwise, it returns the ERC-20 token balance.
 *
 * @param token - The address of the token (default is the native IP token).
 * @returns An object containing the balance value and decimals.
 */
export const getTokenBalance = async (token = ADDRESSES.TOKENS.IP.id) => {
  const publicClient = getPublicClient();
  const address = getAccountAddress();
  if (!address) {
    throw new Error('No connected address found');
  }

  if (token === ADDRESSES.TOKENS.IP.id) {
    // Native token balance
    const balance = await publicClient.getBalance({
      address: address as Address,
    });
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
        args: [address as `0x${string}`],
      }) as Promise<bigint>,
    ]);

    return { value: balance, decimals };
  }
};

/**
 * Retrieves token information such as decimals, symbol, and name.
 *
 * @param address - The address of the token.
 * @returns An object containing the token information.
 */
export async function getTokenInfo(address: `0x${string}`): Promise<TokenInfo> {
  const publicClient = getPublicClient();
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

  return { decimals, symbol, name, address };
}

/**
 * Retrieves pool information such as fee, state, liquidity, tick, ticks, sqrtPriceX96.
 *
 * @param address - The address of the pool.
 * @returns An object containing the pool information.
 */
export async function getPoolInfo(address: `0x${string}`): Promise<PoolInfo> {
  const publicClient = getPublicClient();
  const [fee, state, liquidity] = await Promise.all([
    readContract(publicClient, {
      address,
      abi: POOL_ABI,
      functionName: 'fee',
    }) as Promise<number>,
    readContract(publicClient, {
      address,
      abi: POOL_ABI,
      functionName: 'slot0',
    }) as Promise<any>,
    readContract(publicClient, {
      address,
      abi: POOL_ABI,
      functionName: 'liquidity',
    }) as Promise<string>,
  ]);
  const ticks = await readContract(publicClient, {
    address,
    abi: POOL_ABI,
    functionName: 'ticks',
    args: [state[1]],
  });

  return {
    fee,
    state,
    liquidity: JSBI.BigInt(liquidity.toString()),
    tick: state[1],
    ticks,
    sqrtPriceX96: JSBI.BigInt(state[0].toString()),
  };
}

type ContractCallParams = {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args: unknown[];
  value: bigint;
  chain?: Chain;
};

type TransactionParams = {
  to: `0x${string}`;
  value?: bigint;
  gasLimit?: bigint;
  data: `0x${string}`;
  chain?: Chain;
};

/**
 * Type guard to check if the client is a viem WalletClient.
 *
 * @param client - The client to check.
 * @returns True if the client is a viem WalletClient, false otherwise.
 */
function isWalletClient(
  client: WalletClient | ethers.Signer
): client is WalletClient {
  return typeof (client as WalletClient).request === 'function';
}

/**
 * universalWriteContract:
 * Executes a contract write operation using either a viem WalletClient or an ethers Signer.
 *
 * @param walletClient - The write-capable client (WalletClient or ethers.Signer).
 * @param params - The contract call parameters.
 * @returns The transaction hash (if viem walletClient) or an ethers TransactionResponse (if ethers Signer).
 */
export async function universalWriteContract(
  walletClient: WalletClient | ethers.Signer,
  params: ContractCallParams
): Promise<string | ethers.TransactionResponse> {
  const {
    address,
    abi,
    functionName,
    args = [],
    value,
    chain = defaultChain,
  } = params;
  console.log('is wallet client');
  // Estimate gas
  const estimatedGas = await estimateGasCost({
    address: params.address,
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
    value: params.value,
  });

  if (isWalletClient(walletClient)) {
    // viem WalletClient flow

    const hash = await writeContract(walletClient, {
      address,
      abi,
      functionName,
      args,
      value,
      gas: estimatedGas,
      account: walletClient.account as Account,
      chain,
    });
    return hash;
  } else {
    // ethers Signer flow
    const contract = new ethers.Contract(address, abi, walletClient);
    const overrides: ethers.Overrides = {};

    if (value !== undefined) {
      overrides.value = value;
    }
    if (estimatedGas !== undefined) {
      overrides.gasLimit = estimatedGas;
    }

    const tx = await contract[functionName](...(args as []), overrides);
    return tx.hash;
  }
}

/**
 * universalSendTransaction:
 * Sends a transaction using either a viem WalletClient or an ethers Signer.
 *
 * @param walletClient - The write-capable client (WalletClient or ethers.Signer).
 * @param params - The transaction parameters.
 * @returns The transaction hash (if viem walletClient) or an ethers TransactionResponse (if ethers Signer).
 */
export async function universalSendTransaction(
  walletClient: WalletClient | ethers.Signer,
  params: TransactionParams
): Promise<string | ethers.TransactionResponse> {
  const { to, value, gasLimit, data, chain = defaultChain } = params;

  if (isWalletClient(walletClient)) {
    // viem WalletClient flow
    console.log('is wallet client');
    const hash = await walletClient.sendTransaction({
      to,
      value,
      gasLimit,
      data,
      chain,
      account: walletClient.account as Account,
    });
    return hash;
  } else {
    // ethers Signer flow
    const tx = await walletClient.sendTransaction({
      to,
      value,
      gasLimit,
      data,
    });
    return tx.hash;
  }
}

/**
 * Wrap IP into WIP (calls "deposit" on the WIP contract).
 *
 * @param value - The amount of native IP to wrap, in wei (bigint).
 * @returns The transaction hash of the wrap operation.
 */
export async function wrap(value: bigint) {
  const writeClient = getWriteClient();
  const txHash = await universalWriteContract(writeClient, {
    address: ADDRESSES.TOKENS.WIP.id as `0x${string}`,
    abi: WIP_ABI,
    functionName: 'deposit',
    args: [],
    value,
  });

  return txHash;
}

/**
 * Unwrap WIP back to native IP (calls "withdraw" on the WIP contract).
 *
 * @param value - The amount of WIP to unwrap, in wei (bigint).
 * @returns The transaction hash of the unwrap operation.
 */
export async function unwrap(value: bigint) {
  const writeClient = getWriteClient();
  const txHash = await universalWriteContract(writeClient, {
    address: ADDRESSES.TOKENS.WIP.id as `0x${string}`,
    abi: WIP_ABI,
    functionName: 'withdraw',
    args: [value],
    value: BigInt(0),
  });

  return txHash;
}

/**
 * Retrieves the user's pools in V3.
 *
 * @returns The user's pools in V3.
 */
export async function getUserPoolsV3(): Promise<any> {
  const address = getAccountAddress();
  const userPoolsResults = await executeGraphQuery<GraphPoolResponse>(
    USER_POSITIONS_QUERY,
    {
      userId: address?.toLowerCase(),
    }
  );
  return userPoolsResults;
}
