import * as STORYHUNT from '@uniswap/sdk-core';
import { SwapRouter, Trade } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import { ADDRESSES, defaultChain } from '../constants';
import {
  getTokenBalance,
  getAllowence,
  estimateGasCost,
  universalWriteContract,
} from '../utils';

import { formatUnits } from 'viem';
import { SWAP_ROUTER_ABI } from './abi';
import { getAccountAddress, getWriteClient } from '../config';

export const swapV3 = async (
  trade: Trade<STORYHUNT.Token, STORYHUNT.Token, STORYHUNT.TradeType>
) => {
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

    const { calldata, value } = SwapRouter.swapCallParameters(trade, {
      slippageTolerance: new STORYHUNT.Percent(
        JSBI.BigInt(50),
        JSBI.BigInt(10000)
      ), // 0.5%
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
  } catch (error) {
    console.error('Error in swap:', error);
    return error;
  }
};
