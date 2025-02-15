import { getAccountAddress, getRouterInstance } from '../config'
import { SwapRoute } from '@storyhunt/smart-order-router'
/**
 * Executes a token swap using the StoryHunt V3 SDK.
 *
 * @param tokenIn - The address of the input token.
 * @param tokenOut - The address of the output token.
 * @param amount - The amount of the input or output token, depending on the `exactIn` parameter.
 * @param exactIn - If true, the swap is executed with an exact input amount. If false, the swap is executed with an exact output amount.
 * @param currentSlippage - The maximum allowed slippage for the swap, in basis points.
 * @param deadlineInUnix - The Unix timestamp after which the swap will be invalid.
 * @returns A promise that resolves to a `SwapRoute` object containing swap details or an `Error`.
 *
 * @throws Will throw an error if no connected address is found, if no trade is found, or if there is an error in getting the quotation.
 */
export async function swapRouterV3(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  exactIn: boolean,
  currentSlippage: number,
  deadlineInUnix: number,
): Promise<SwapRoute<any> | Error> {
  try {
    const address = getAccountAddress()
    if (!address) {
      throw new Error('No connected address found')
    }

    const routerInstance = getRouterInstance()

    const swapData = await routerInstance.getSwapRouteData({
      tokenIn,
      tokenOut,
      amount,
      exactIn,
      recipient: address,
      slippageTolerance: currentSlippage,
      deadline: deadlineInUnix,
    })
    if (!swapData || !swapData.trade) {
      throw new Error('No trade found')
    }
    return swapData
  } catch (error: any) {
    throw new Error(error.message || 'Error in getting quotation:')
  }
}
