import { Pool, Tick, TickListDataProvider, Trade } from '@storyhunt/v3-sdk';
import JSBI from 'jsbi';

import { ADDRESSES, defaultChainId } from '../constants';
import { getTokenInfo } from '../utils';
import { GraphPoolResponse, TokenInfo } from './types';
import { POOL_QUERY, POOLWTOKEN_QUERY } from './queries';
import { executeGraphQuery } from '../config';
import { Token, TradeType, CurrencyAmount } from '@storyhunt/core';

/**
 * Executes a swap using the StoryHunt V3 SDK.
 *
 * @param tokenIn - The address of the input token.
 * @param tokenOut - The address of the output token.
 * @param amount - The amount of the input or output token, depending on the `exactIn` parameter.
 * @param exactIn - If true, the swap is executed with an exact input amount. If false, the swap is executed with an exact output amount.
 * @returns A promise that resolves to an array of `Trade` objects or an `Error`.
 *
 * @throws Will throw an error if the swap fails.
 */
export async function swapRouterV3(
  tokenIn: string,
  tokenOut: string,
  amount: bigint,
  exactIn: boolean
): Promise<Trade<Token, Token, TradeType>[] | Error> {
  try {
    let tokenInInfo: TokenInfo | undefined;
    let tokenOutInfo: TokenInfo | undefined;

    // If tokenIn is not the native IP token, fetch metadata
    if (tokenIn !== ADDRESSES.TOKENS.IP.id) {
      tokenInInfo = await getTokenInfo(tokenIn as `0x${string}`);
    }

    // If tokenOut is not the native IP token, fetch metadata
    if (tokenOut !== ADDRESSES.TOKENS.IP.id) {
      tokenOutInfo = await getTokenInfo(tokenOut as `0x${string}`);
    }

    const currencyIn =
      tokenIn === ADDRESSES.TOKENS.IP.id
        ? new Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id as `0x${string}`,
            ADDRESSES.TOKENS.WIP.decimals,
            ADDRESSES.TOKENS.WIP.symbol,
            ADDRESSES.TOKENS.WIP.name
          )
        : new Token(
            defaultChainId,
            tokenIn as `0x${string}`,
            tokenInInfo!.decimals,
            tokenInInfo!.symbol,
            tokenInInfo!.name
          );

    const currencyOut =
      tokenOut === ADDRESSES.TOKENS.IP.id
        ? new Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id as `0x${string}`,
            ADDRESSES.TOKENS.WIP.decimals,
            ADDRESSES.TOKENS.WIP.symbol,
            ADDRESSES.TOKENS.WIP.name
          )
        : new Token(
            defaultChainId,
            tokenOut as `0x${string}`,
            tokenOutInfo!.decimals,
            tokenOutInfo!.symbol,
            tokenOutInfo!.name
          );

    const topPoolResult =
      await executeGraphQuery<GraphPoolResponse>(POOL_QUERY);

    const tokenPoolResult = await executeGraphQuery<GraphPoolResponse>(
      POOLWTOKEN_QUERY,
      {
        token0: currencyIn.address.toLowerCase(),
        token1: currencyOut.address.toLowerCase(),
      }
    );

    const allPoolsData = [
      ...(topPoolResult.data?.pools || []),
      ...(tokenPoolResult.data?.pools || []),
    ];

    const allPools = (
      await Promise.all(
        allPoolsData.map(async (pool): Promise<Pool | undefined> => {
          if (
            parseFloat(pool.totalValueLockedToken0) < 0.01 ||
            parseFloat(pool.totalValueLockedToken1) < 0.01
          ) {
            //console.log('Insufficient liquidity', pool.id);
            return;
          }

          if (![500, 3000, 10000].includes(parseInt(pool.feeTier))) {
            console.log('Inconsistent fee tier', pool.id);
            return;
          }

          const tokenA = new Token(
            defaultChainId,
            pool.token0.id as `0x${string}`,
            Number(pool.token0.decimals),
            pool.token0.symbol,
            pool.token0.name
          );

          const tokenB = new Token(
            defaultChainId,
            pool.token1.id as `0x${string}`,
            Number(pool.token1.decimals),
            pool.token1.symbol,
            pool.token1.name
          );

          const ticks: Tick[] = pool.ticks.map(tick => ({
            index: parseInt(tick.tickIdx),
            liquidityGross: JSBI.BigInt(tick.liquidityGross),
            liquidityNet: JSBI.BigInt(tick.liquidityNet),
          }));

          if (ticks.length === 0) {
            console.log('No ticks found for pool', pool.id);
            return;
          }

          ticks.sort((a, b) => a.index - b.index);

          const tickSpacing =
            +pool.feeTier === 3000 ? 60 : +pool.feeTier === 500 ? 10 : 200;

          const tickDataProvider = new TickListDataProvider(ticks, tickSpacing);

          const poolObj = new Pool(
            tokenA,
            tokenB,
            parseInt(pool.feeTier),
            JSBI.BigInt(pool.sqrtPrice),
            JSBI.BigInt(pool.liquidity),
            parseInt(pool.tick),
            tickDataProvider
          );
          return poolObj;
        })
      )
    ).filter((p): p is Pool => p !== undefined);

    console.log('All pools:', allPools.length);

    if (exactIn) {
      return await Trade.bestTradeExactIn(
        allPools,
        CurrencyAmount.fromRawAmount(
          currencyIn,
          JSBI.BigInt(amount.toString())
        ),
        currencyOut,
        { maxHops: 3, maxNumResults: 1 }
      );
    } else {
      return (
        (await Trade.bestTradeExactOut(
          allPools,
          currencyIn,
          CurrencyAmount.fromRawAmount(
            currencyOut,
            JSBI.BigInt(amount.toString())
          ),
          { maxHops: 3, maxNumResults: 1 }
        )) || []
      );
    }
  } catch (error: any) {
    console.error('Error in swap:', error);
    return error;
  }
}
