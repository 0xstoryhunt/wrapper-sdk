import { SwapRouter, Trade } from '@storyhunt/v3-sdk';
import JSBI from 'jsbi';
import { ADDRESSES, defaultChain } from '../constants';
import {
  getTokenBalance,
  getAllowence,
  universalWriteContract,
} from '../utils';

import { formatUnits } from 'viem';
import { SWAP_ROUTER_ABI } from './abi';
import { getAccountAddress, getWriteClient } from '../config';
import { ethers } from 'ethers';
import { Percent, Token, TradeType } from '@storyhunt/sdk-core';

/**
 * Executes a swap using StoryHunt V3.
 *
 * @param trade - The trade object containing details of the swap, including input and output tokens and trade type.
 * @returns A promise that resolves to a transaction hash, a transaction response, or an error.
 *
 * @throws Will throw an error if no connected address is found.
 * @throws Will throw an error if the input token have wrong address.
 * @throws Will throw an error if the balance/allowence is insufficient.
 * @throws Will throw an error if the transaction fails on-chain.
 * @throws Will throw an error for any other unknown issues.
 *
 * @example
 * ```typescript
 * const trade = new Trade(...);
 * const result = await swapV3(trade);
 * console.log(result);
 * ```
 */
export async function swapV3(
  trade: Trade<Token, Token, TradeType>
): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }

    const tokenInAddress = trade.inputAmount.currency.address as `0x${string}`;
    if (!tokenInAddress) {
      throw new Error('Input token must have an address');
    }

    // Check balance
    const tokenBalance = await getTokenBalance(tokenInAddress);
    const formattedBalance = Number(
      formatUnits(tokenBalance.value, tokenBalance.decimals)
    );
    const inputAmount = BigInt(trade.inputAmount.toFixed(0));
    const requiredMinimum = BigInt(100); // Arbitrary minimum

    if (
      formattedBalance <
        Number(formatUnits(requiredMinimum, tokenBalance.decimals)) ||
      inputAmount > tokenBalance.value
    ) {
      throw new Error('Insufficient balance');
    }

    // Check allowance
    const allowance = await getAllowence(
      tokenInAddress,
      ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`
    );

    if (allowance < inputAmount) {
      throw new Error('Insufficient allowance');
    }

    //wrap if ip
    // if(trade.inputAmount.currency.address === ADDRESSES.TOKENS.IP.id){
    //   await wrap(inputAmount);
    // }

    const { calldata, value } = SwapRouter.swapCallParameters(trade, {
      slippageTolerance: new Percent(JSBI.BigInt(50), JSBI.BigInt(10000)), // 0.5%
      deadline: JSBI.BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes from now
      recipient: address,
    });

    // Execute the swap
    const hash = await universalWriteContract(walletClient, {
      address: ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
      abi: SWAP_ROUTER_ABI,
      functionName: 'multicall',
      args: [[calldata]],
      value: BigInt(value),
      chain: defaultChain,
    });

    return hash;

    //unwrap if wip
  } catch (error) {
    console.error('Error in swap:', error);
    return error as unknown as Error;
  }
}
