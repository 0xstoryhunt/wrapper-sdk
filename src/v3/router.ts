import { Currency } from '@storyhunt/sdk-core'
import { getAccountAddress, getRouterInstance } from '../config'
import { Trade } from '@storyhunt/v3-sdk'

/**
 * Executes a swap using the StoryHunt V3 SDK.
 *
 * @param tokenIn - The address of the input token.
 * @param tokenOut - The address of the output token.
 * @param amount - Parsed amount of the input or output token, depending on the `exactIn` parameter.
 * @param exactIn - If true, the swap is executed with an exact input amount. If false, the swap is executed with an exact output amount.
 * @returns A promise that resolves to an array of `Trade` objects or an `Error`.
 *
 * @throws Will throw an error if the swap fails.
 */
export async function swapRouterV3(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  exactIn: boolean,
): Promise<Trade<Currency, Currency, any>[] | Error> {
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
    })
    if (!swapData) {
      throw new Error('No trade found')
    }
    const bestTrade = [swapData?.trade]
    /** @deprecated FALLBACK CODE TO GET ALL RELATED POOLS
     * 
    const tokenInInfo = await getTokenInfo(tokenIn as `0x${string}`)
    const tokenOutInfo = await getTokenInfo(tokenOut as `0x${string}`)

    const currencyIn =
      tokenIn === getAddressConfig().TOKENS.IP.id
        ? IP.onChain(getAddressConfig().CHAIN_ID)
        : new Token(
            defaultChainId,
            tokenIn as `0x${string}`,
            tokenInInfo!.decimals,
            tokenInInfo!.symbol,
            tokenInInfo!.name,
          )

    const currencyOut =
      tokenOut === getAddressConfig().TOKENS.IP.id
        ? IP.onChain(getAddressConfig().CHAIN_ID)
        : new Token(
            defaultChainId,
            tokenOut as `0x${string}`,
            tokenOutInfo!.decimals,
            tokenOutInfo!.symbol,
            tokenOutInfo!.name,
          )

    const { path } = await findOptimalPathAStar(
      currencyIn.wrapped.address.toLowerCase(),
      currencyOut.wrapped.address.toLowerCase(),
      5,
    )
    console.log({ path })

    if (path.length === 0) {
      throw new Error('No path found')
    }
    const poolsResults = await executeGraphQuery<GraphPoolResponse>(POOLWTOKEN_QUERY, {
      condition: path.reduce((acc: any[], _, i, arr) => {
        if (i + 1 < arr.length) {
          acc.push({ token0_: { id: arr[i] }, token1_: { id: arr[i + 1] } })
          acc.push({ token0_: { id: arr[i + 1] }, token1_: { id: arr[i] } })
        }
        return acc
      }, []),
    })
    const allPools: Pool[] = []
    poolsResults.data?.pools?.forEach(async (pool: any) => {
      console.log('Pool token: ', pool.token0.symbol, pool.token1.symbol)

      const tokenA = new Token(
        defaultChainId,
        pool.token0.id,
        +pool.token0.decimals,
        pool.token0.symbol,
        pool.token0.name,
      )
      const tokenB = new Token(
        defaultChainId,
        pool.token1.id,
        +pool.token1.decimals,
        pool.token1.symbol,
        pool.token1.name,
      )

      if (!pool.ticks) return
      const ticks: Tick[] = pool.ticks.map((tick: any) => ({
        index: parseInt(tick.tickIdx),
        liquidityGross: JSBI.BigInt(tick.liquidityGross),
        liquidityNet: JSBI.BigInt(tick.liquidityNet),
      }))

      ticks.sort((a, b) => a.index - b.index)

      const tickSpacing = +pool.feeTier === 3000 ? 60 : +pool.feeTier === 500 ? 10 : 200
      const tickDataProvider = new TickListDataProvider(ticks, tickSpacing)

      const poolObj = new Pool(
        tokenA,
        tokenB,
        parseInt(pool.feeTier),
        JSBI.BigInt(pool.sqrtPrice),
        JSBI.BigInt(pool.liquidity),
        parseInt(pool.tick),
        tickDataProvider,
      )

      allPools.push(poolObj)
    })

    if (allPools.length === 0) {
      throw new Error('No pool found')
    }
    console.log('All pools:', allPools.length)

    const bestTrade = exactIn
      ? await Trade.bestTradeExactIn(
          allPools,
          CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amount.toString())),
          currencyOut,
          { maxHops: 3, maxNumResults: 1 },
        )
      : await Trade.bestTradeExactOut(
          allPools,
          currencyIn,
          CurrencyAmount.fromRawAmount(currencyOut, JSBI.BigInt(amount.toString())),
          { maxHops: 3, maxNumResults: 1 },
        )
 */
    if (bestTrade.length === 0) {
      throw new Error('No trade found')
    }
    return bestTrade as any
  } catch (error: any) {
    console.error('Error in swap:', error)
    return error
  }
}
