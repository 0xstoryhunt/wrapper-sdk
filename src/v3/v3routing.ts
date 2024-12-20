import { Pool, Tick, TickListDataProvider, Trade } from '@uniswap/v3-sdk';
import * as STORYHUNT from '@uniswap/sdk-core';
import { getToken } from '@wagmi/core';
import JSBI from 'jsbi';
import { createClient, fetchExchange } from 'urql';
import { ADDRESSES, config, defaultChainId } from '../constants';
import { POOL_QUERY, POOLWTOKEN_QUERY } from './queries';

export const v3routing = async (
  tokenIn: string,
  tokenOut: string,
  amount: bigint,
  exactIn: boolean
) => {
  try {
    const tokenInInfo = await getToken(config, {
      address: tokenIn as `0x${string}`,
    });
    const tokenOutInfo = await getToken(config, {
      address: tokenOut as `0x${string}`,
    });

    const currencyIn =
      tokenIn === ADDRESSES.TOKENS.IP.id
        ? new STORYHUNT.Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id,
            ADDRESSES.TOKENS.WIP?.decimals,
            ADDRESSES.TOKENS.WIP?.symbol,
            ADDRESSES.TOKENS.WIP?.name
          )
        : new STORYHUNT.Token(
            defaultChainId,
            tokenIn,
            tokenInInfo?.decimals,
            tokenInInfo?.symbol,
            tokenInInfo?.name
          );
    const currencyOut =
      tokenOut === ADDRESSES.TOKENS.IP.id
        ? new STORYHUNT.Token(
            defaultChainId,
            ADDRESSES.TOKENS.WIP.id,
            ADDRESSES.TOKENS.WIP?.decimals,
            ADDRESSES.TOKENS.WIP?.symbol,
            ADDRESSES.TOKENS.WIP?.name
          )
        : new STORYHUNT.Token(
            defaultChainId,
            tokenIn,
            tokenOutInfo?.decimals,
            tokenOutInfo?.symbol,
            tokenOutInfo?.name
          );

    const graphClient = createClient({
      url: 'https://api.goldsky.com/api/public/project_cm3zj9u61wxu901wog58adpjp/subgraphs/storyhunt-odyssey-testnet/1.0.0/gn',
      exchanges: [fetchExchange],
    });
    const topPoolResult = (await graphClient
      .query(POOL_QUERY, {}, { requestPolicy: 'network-only' })
      .toPromise()) as any;
    const tokenPoolResult = (await graphClient
      .query(
        POOLWTOKEN_QUERY,
        {
          token0: currencyIn?.address.toLowerCase(),
          token1: currencyOut.address.toLowerCase(),
        },
        { requestPolicy: 'network-only' }
      )
      .toPromise()) as any;

    const allPools: any[] = (
      [
        ...(topPoolResult.data?.pools || []),
        ...(tokenPoolResult.data?.pools || []),
      ] as any[]
    )
      .map(async (pool: any) => {
        // Validate liquidity balance
        if (
          parseFloat(pool.totalValueLockedToken0) < 0.01 ||
          parseFloat(pool.totalValueLockedToken1) < 0.01
        ) {
          console.log('Insufficient liquidity', pool.id);
          return;
        }

        // // Validate fee tier consistency
        if (![500, 3000, 10000].includes(parseInt(pool.feeTier))) {
          console.log('Inconsistent fee tier', pool.id);
          return;
        }

        const tokenA = new STORYHUNT.Token(
          defaultChainId,
          pool.token0.id,
          +pool.token0.decimals,
          pool.token0.symbol,
          pool.token0.name
        );
        const tokenB = new STORYHUNT.Token(
          defaultChainId,
          pool.token1.id,
          +pool.token1.decimals,
          pool.token1.symbol,
          pool.token1.name
        );

        // Create ticks array
        const ticks: Tick[] = pool.ticks.map((tick: any) => ({
          index: parseInt(tick.tickIdx),
          liquidityGross: JSBI.BigInt(tick.liquidityGross),
          liquidityNet: JSBI.BigInt(tick.liquidityNet),
        }));
        if (ticks.length === 0) {
          console.log('No ticks found for pool', pool.id);
          return;
        }

        // // Ensure the ticks are sorted by tick index
        ticks.sort((a, b) => a.index - b.index);

        // Define tickSpacing based on fee tier
        const tickSpacing =
          +pool.feeTier === 3000 ? 60 : +pool.feeTier === 500 ? 10 : 200; // Adjust as necessary

        // Create a TickListDataProvider
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
      .filter(pool => pool);
    console.log('All pools:', allPools);

    return exactIn
      ? await Trade.bestTradeExactIn(
          allPools,
          STORYHUNT.CurrencyAmount.fromRawAmount(
            currencyIn,
            JSBI.BigInt(amount.toString())
          ),
          currencyOut,
          { maxHops: 3, maxNumResults: 1 }
        )
      : (await Trade.bestTradeExactOut(
          allPools,
          currencyIn,
          STORYHUNT.CurrencyAmount.fromRawAmount(
            currencyOut,
            JSBI.BigInt(amount.toString())
          ),
          { maxHops: 3, maxNumResults: 1 }
        )) || [];
  } catch (error) {
    console.error('Error in swap:', error);
    return error;
  }
};
