import 'dotenv/config';
import {  Account, Address, Chain, encodeFunctionData, WalletClient } from 'viem';
import { erc20Abi } from 'viem';
import { MaxUint256 } from '@uniswap/sdk-core';
import { ADDRESSES, defaultChain } from './constants';
import { readContract, writeContract } from 'viem/actions';
import { getPublicClient, getWriteClient, getAccountAddress, getAccount } from './config';
import { GasParams, TokenInfo } from './v3/types';
import { ethers } from 'ethers';


/**
 * Estimates gas cost for a given contract call, applying an optional percentage.
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
    chain: defaultChain
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
    
};

/**
 * Approves V3_SWAP_ROUTER to use a certain amount of tokens on behalf of the user's account.
 * Uses universalWriteContract to handle both WalletClient and ethers.Signer.
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
    chain: defaultChain
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
    
};

/**
 * Approves V3_NONFUNGIBLE_POSITION_MANAGER to use a certain amount of tokens on behalf of the user's account.
 * Uses universalWriteContract to handle both WalletClient and ethers.Signer.
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
    chain: defaultChain
  };

  // universalWriteContract returns a hash (if viem) or ethers TransactionResponse
  const result = await universalWriteContract(writeClient, params);
  // If needed, check result type and normalize:
  console.log('Transaction hash : ', result);
    
};

/**
 * Retrieves the allowance of a token for a given spender.
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
 * Retrieves the balance of the user's account. If the token is the native IP token,
 * it returns the native balance. Otherwise, it returns the ERC-20 token balance.
 */
export const getTokenBalance = async (token = ADDRESSES.TOKENS.IP.id) => {
  const publicClient = getPublicClient();
  const address = getAccountAddress();
  if (!address) {
    throw new Error('No connected address found');
  }

  if (token === ADDRESSES.TOKENS.IP.id) {
    // Native token balance
    const balance = await publicClient.getBalance({ address: address as Address });
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

  return { decimals, symbol, name };
}



type ContractCallParams = {
  address: `0x${string}`,
  abi: any,
  functionName: string,
  args?: unknown[],
  value?: bigint,
  gas?: bigint,
  chain?: Chain
};

/**
 * Type guard to check if the client is a viem WalletClient.
 */
function isWalletClient(client: WalletClient | ethers.Signer): client is WalletClient {
  return typeof (client as WalletClient).request === 'function';
}

/**
 * universalWriteContract:
 * Executes a contract write operation using either a viem WalletClient or an ethers Signer.
 * 
 * @param walletClient - The write-capable client (WalletClient or ethers Signer).
 * @param params - The contract call parameters.
 * 
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
    gas,
    chain,
  } = params;

  if (isWalletClient(walletClient)) {
    // viem WalletClient flow
    console.log('is wallet client')
    const hash = await writeContract(walletClient, {
      address,
      abi,
      functionName,
      args,
      value,
      gas,
      account : walletClient.account as Account,
      chain
    });
    return hash;
  } else {
    // ethers Signer flow
    const contract = new ethers.Contract(address, abi, walletClient);
    const overrides: ethers.Overrides = {};

    if (value !== undefined) {
      overrides.value = value;
    }
    // if (gas !== undefined) {
    //   overrides.gasLimit = gas;
    // }

    const tx = await contract[functionName](...(args as []), overrides);
    return tx.hash;
  }
}