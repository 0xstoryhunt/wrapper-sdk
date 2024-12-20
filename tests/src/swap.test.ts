import { ADDRESSES } from '../../src/constants';
import { v3routing, v3swap } from '../../src';
import { Token } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';

describe('routing', () => {
  test('routing wip/FATE to be defined', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.FATE.id; // FATE token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await v3routing(tokenIn, tokenOut, amount, false);
    expect(routes).toBeDefined();
  }, 15000);

  test('routing wip/ip to be empty', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.IP.id; // IP token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await v3routing(tokenIn, tokenOut, amount, false);
    expect(routes.toString()).toBe('not swap but unwrap');
  }, 15000);
});

describe('swap viem client', () => {
  test('should execute a successful swap from 0.001 WIP to FATE', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id;
    const tokenOut = ADDRESSES.TOKENS.FATE.id;
    const amountIn = BigInt(10 ** 15); //  0.001 WIP

    // Get a route for the swap
    const routes: Trade<Token, Token, any>[] | Error = await v3routing(
      tokenIn,
      tokenOut,
      amountIn,
      true
    );

    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
    //@ts-ignore
    expect(routes.length).toBeGreaterThan(0);

    // Take the best trade (first one returned)
    //@ts-ignore
    const bestTrade = routes[0];
    expect(bestTrade).toBeDefined();

    // Execute the swap
    const swapResult = await v3swap(bestTrade);
    //console.log("swapResult" ,swapResult)
    expect(swapResult).toBeDefined();
    // If successful, this should be a transaction hash (a string)
    expect(typeof swapResult).toBe('string');
    expect((swapResult as string).length).toBeGreaterThan(0);
  }, 60000);
});
