import { getAccount } from '@wagmi/core';
import { useWriteContract } from 'wagmi';
import { estimateGasCost, getAllowence, getTokenBalance } from '../utils';
import { formatUnits } from 'viem';
import {
  Trade,
  SwapRouter,
} from '@uniswap/v3-sdk';
import { config } from '../constants';
import * as STORYHUNT from '@uniswap/sdk-core';
import JSBI from 'jsbi';
import { ADDRESSES } from '../constants';

const SWAPROUTER_MULTICALL_ABI = [
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
    ],
    name: 'multicall',
    outputs: [
      {
        internalType: 'bytes[]',
        name: 'results',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
];

export const v3swap = async (trade: Trade<any, any, any>) => {
  try {
    const address = getAccount(config).address;
    if (!address) {
      throw new Error('No connected address found');
    }
    const tokenBalance = await getTokenBalance(
      trade.inputAmount.currency.address
    );

    //check balance
    const formattedBalance = formatUnits(
      tokenBalance.value,
      tokenBalance?.decimals
    );
    if (
      formattedBalance < formatUnits(BigInt(100), tokenBalance.decimals) ||
      BigInt(trade.inputAmount.toFixed(0)) > tokenBalance.value
    ) {
      throw new Error('Insufficient balance');
    }

    //check allowence
    const allowance = await getAllowence(
      trade.inputAmount.currency.address,
      ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS
    );
    if (allowance < BigInt(trade.inputAmount.toFixed(0))) {
      throw new Error('Insufficient allowance');
    }
    const { writeContractAsync: swapWriter } = useWriteContract();
    const methodParameters = SwapRouter.swapCallParameters(trade, {
      slippageTolerance: new STORYHUNT.Percent(
        JSBI.BigInt(50), //0.5%
        JSBI.BigInt(10000)
      ),
      deadline: JSBI.BigInt(Math.floor(Date.now() / 1000) + 60 * 20), //20 minutes
      recipient: address,
    });
    const estimatedGas = await estimateGasCost({
      address: ADDRESSES.V2_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
      abi: SWAPROUTER_MULTICALL_ABI,
      functionName: 'swap',
      args: [[methodParameters?.calldata]],
      value: BigInt(methodParameters.value),
    });

    const hash = await swapWriter({
      address: ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
      abi: SWAPROUTER_MULTICALL_ABI,
      functionName: 'swap',
      args: [[methodParameters?.calldata]],
      value: BigInt(methodParameters.value),
      gas: estimatedGas,
    });
    return hash;
  } catch (error) {
    console.error('Error in swap:', error);
    return error;
  }
};