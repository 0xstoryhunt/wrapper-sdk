import { createClient, fetchExchange } from 'urql';
import {
  Pool,
  Tick,
  TickListDataProvider,
  Trade,
} from '@uniswap/v3-sdk';
import * as STORYHUNT from '@uniswap/sdk-core';
import JSBI from 'jsbi';

import { ADDRESSES, defaultChainId } from '../constants';
import { getTokenInfo } from '../utilsViem';
import { GraphPoolResponse, TokenInfo } from './types';
import { POOL_QUERY, POOLWTOKEN_QUERY } from './queries';

export async function v3routingViem(
  tokenIn: string,
  tokenOut: string,
  amount: bigint,
  exactIn: boolean
): Promise<Trade<STORYHUNT.Token, STORYHUNT.Token, any>[] | Error> {

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
        ? new STORYHUNT.Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id as `0x${string}`,
            ADDRESSES.TOKENS.WIP.decimals,
            ADDRESSES.TOKENS.WIP.symbol,
            ADDRESSES.TOKENS.WIP.name
          )
        : new STORYHUNT.Token(
            defaultChainId,
            tokenIn as `0x${string}`,
            tokenInInfo!.decimals,
            tokenInInfo!.symbol,
            tokenInInfo!.name
          );

    const currencyOut =
      tokenOut === ADDRESSES.TOKENS.IP.id
        ? new STORYHUNT.Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id as `0x${string}`,
            ADDRESSES.TOKENS.WIP.decimals,
            ADDRESSES.TOKENS.WIP.symbol,
            ADDRESSES.TOKENS.WIP.name
          )
        : new STORYHUNT.Token(
            defaultChainId,
            tokenOut as `0x${string}`,
            tokenOutInfo!.decimals,
            tokenOutInfo!.symbol,
            tokenOutInfo!.name
          );

    const graphClient = createClient({
      url: 'https://api.goldsky.com/api/public/project_cm3zj9u61wxu901wog58adpjp/subgraphs/storyhunt-odyssey-testnet/1.0.0/gn',
      exchanges: [fetchExchange],
    });

    const topPoolResult = await graphClient
      .query<GraphPoolResponse>(POOL_QUERY, {}, { requestPolicy: 'network-only' })
      .toPromise();

    const tokenPoolResult = await graphClient
      .query<GraphPoolResponse>(
        POOLWTOKEN_QUERY,
        {
          token0: currencyIn.address.toLowerCase(),
          token1: currencyOut.address.toLowerCase(),
        },
        { requestPolicy: 'network-only' }
      )
      .toPromise();

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
            console.log('Insufficient liquidity', pool.id);
            return;
          }

          if (![500, 3000, 10000].includes(parseInt(pool.feeTier))) {
            console.log('Inconsistent fee tier', pool.id);
            return;
          }

          const tokenA = new STORYHUNT.Token(
            defaultChainId,
            pool.token0.id as `0x${string}`,
            Number(pool.token0.decimals),
            pool.token0.symbol,
            pool.token0.name
          );

          const tokenB = new STORYHUNT.Token(
            defaultChainId,
            pool.token1.id as `0x${string}`,
            Number(pool.token1.decimals),
            pool.token1.symbol,
            pool.token1.name
          );

          const ticks: Tick[] = pool.ticks.map((tick) => ({
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

    //console.log('All pools:', allPools);

    if (exactIn) {
      return await Trade.bestTradeExactIn(
        allPools,
        STORYHUNT.CurrencyAmount.fromRawAmount(
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
          STORYHUNT.CurrencyAmount.fromRawAmount(
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