import { SwapRoute } from '@storyhunt/smart-order-router'
import { encodeFunctionData, formatUnits, maxUint64 } from 'viem'
import { ethers } from 'ethers'

import { getAddressConfig } from '../config'
import { getTokenBalance, getAllowence, universalSendTransaction } from '../utils'

import { SWAP_ROUTER_ABI } from './abi'
import { getAccountAddress, getWriteClient } from '../config'

/**
 * Executes a swap using StoryHunt V3.
 *
 * @param swapData - The swap route object containing details of the swap, including input and output tokens and trade type.
 * @returns A promise that resolves to a transaction hash, a transaction response, or an error.
 *
 * @throws Will throw an error if no connected address is found.
 * @throws Will throw an error if the input token has an incorrect address.
 * @throws Will throw an error if the balance or allowance is insufficient.
 * @throws Will throw an error if the transaction fails on-chain.
 * @throws Will throw an error for any other unknown issues.
 *
 * @example
 * ```typescript
 * const swapData = new SwapRoute(...);
 * const result = await swapV3(swapData);
 * console.log(result);
 * ```
 */
export async function swapV3(swapData: SwapRoute<any>): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }
    const inputCurrency = swapData.trade.inputAmount.currency
    const outputCurrency = swapData.trade.outputAmount.currency
    const inputAmount = BigInt(+swapData.trade.inputAmount.toExact() * 10 ** inputCurrency.decimals)

    // Check balance
    const tokenBalance = await getTokenBalance(
      inputCurrency.isNative ? getAddressConfig().TOKENS.IP.id : inputCurrency.address,
    )
    const formattedBalance = Number(formatUnits(tokenBalance.value, tokenBalance.decimals))
    const requiredMinimum = BigInt(100) // Arbitrary minimum

    if (
      formattedBalance < Number(formatUnits(requiredMinimum, tokenBalance.decimals)) ||
      inputAmount > tokenBalance.value
    ) {
      throw new Error('Insufficient balance')
    }

    // Check allowance
    const allowance = inputCurrency.isNative
      ? maxUint64
      : await getAllowence(inputCurrency.address, getAddressConfig().V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`)

    if (allowance < inputAmount) {
      throw new Error('Insufficient allowance')
    }

    //calldata
    const calls = []
    let value = BigInt(0)

    /** GET SWAP CALLDATA / VALUE */
    if (!swapData.methodParameters) {
      throw new Error('No method parameters found')
    }
    const { calldata, value: swapValue } = swapData.methodParameters
    calls.push(calldata)
    value += BigInt(swapValue)

    /** REFUND IP WHEN INPUT IS IP / CALLDATA */
    if (outputCurrency?.isNative || inputCurrency?.isNative) {
      calls.push(
        encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: 'refundIP',
          args: [],
        }),
      )
    }

    const finalEncoding = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: 'multicall',
      args: [calls],
    })

    const transaction = {
      chainId: getAddressConfig().CHAIN_ID,
      from: address,
      to: getAddressConfig().V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`,
      data: finalEncoding,
      value: value,
      estimatedGasUsed: swapData.estimatedGasUsed.toString() || BigInt(10_000_000),
    }
    // Execute the swap
    const hash = await universalSendTransaction(walletClient, transaction)

    return hash

    //unwrap if wip
  } catch (error) {
    console.error('Error in swap:', error)
    return error as unknown as Error
  }
}
