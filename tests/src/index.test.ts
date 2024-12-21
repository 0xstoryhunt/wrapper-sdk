import 'dotenv/config';
import { getWriteClient, initClient } from '../../src';
// import { defaultChain } from '../../src';
// import { ethers } from 'ethers';
import { ADDRESSES } from '../../src';
import {
  swapRouterV3,
  swapV3,
  createPoolV3,
  addLiquidityV3,
  addPositionLiquidityV3,
  removeLiquidityV3,
  collectFeeV3,
} from '../../src';
import { Token } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';

const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const expectedAddress = process.env.TEST_PUBLIC_ADDRESS as `0x${string}`;

beforeAll(async () => {
  // 1. Setup: Initialize SDK with Wallet Client using Viem(Private Key)
  await initClient({ privateKey });

  // 2. Setup: Initialize SDK with Ether Signer
  // const provider = new ethers.JsonRpcProvider(
  //   defaultChain.rpcUrls.default.http[0]
  // );
  // const signer = new ethers.Wallet(privateKey || '', provider);
  // await initClient({ ethersSigner: signer });
});

describe('config wallet client using viem', () => {
  test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
    const walletClient: any = getWriteClient();
    expect(walletClient.account.address.toLowerCase()).toBe(
      expectedAddress.toLowerCase()
    );
  });
});

describe('routing', () => {
  test('routing wip/FATE to be defined', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.FATE.id; // FATE token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await swapRouterV3(tokenIn, tokenOut, amount, false);
    expect(routes).toBeDefined();
  }, 15000);

  test('routing wip/ip to be empty', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.IP.id; // IP token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await swapRouterV3(tokenIn, tokenOut, amount, false);
    expect(routes.toString()).toBe('');
  }, 15000);
});

describe('swap', () => {
  test('should execute a successful swap from 0.001 WIP to FATE', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id;
    const tokenOut = ADDRESSES.TOKENS.FATE.id;
    const amountIn = BigInt(10 ** 18); //  0.001 WIP

    // Get a route for the swap
    const routes: Trade<Token, Token, any>[] | Error = await swapRouterV3(
      tokenIn,
      tokenOut,
      amountIn,
      true
    );
    if (routes instanceof Error) {
      console.log('[Route/error]', routes);
      return;
    } else {
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
    }

    // Take the best trade (first one returned)
    const bestTrade = routes[0];
    expect(bestTrade).toBeDefined();

    // Execute the swap
    const swapResult = await swapV3(bestTrade);
    //console.log("swapResult" ,swapResult)
    expect(swapResult).toBeDefined();
    // If successful, this should be a transaction hash (a string)
    expect(typeof swapResult).toBe('string');
    expect((swapResult as string).length).toBeGreaterThan(0);
  }, 60000);
});

describe('Pool Operations', () => {
  const tokenA = ADDRESSES.TOKENS.WIP.id;
  const tokenB = ADDRESSES.TOKENS.FATE.id;
  const fee = 3000; // 0.3%
  const desirePrice = 1; // 1 WIP = 1 FATE
  const positionId = 1;

  test('should create a new pool', async () => {
    const result = await createPoolV3(tokenA, tokenB, desirePrice, fee);
    if (result instanceof Error) {
      console.log('[Pool/error]', result);
    } else {
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    }
  });

  test('already has a pool', async () => {
    const error = await createPoolV3(tokenA, tokenB, desirePrice, fee);
    if (error instanceof Error) {
      expect(error.message).toBe('Pool already exists');
    }
  });

  test('should add initial liquidity to the pool', async () => {
    const amountA = 10; // 10 WIP
    const amountB = 10; // 10 FATE

    const result = await addLiquidityV3(
      tokenA,
      tokenB,
      fee,
      amountA,
      amountB,
      desirePrice * 0.95,
      desirePrice * 1.05
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  test('should add liquidity to the same position', async () => {
    const additionalAmountA = 10; // 10 WIP
    const additionalAmountB = 10; // 10 FATE

    const result = await addPositionLiquidityV3(
      positionId,
      additionalAmountA,
      additionalAmountB
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  test('should remove liquidity from the position', async () => {
    const liquidityToRemove = 50; // 50% worth of liquidity

    const result = await removeLiquidityV3(positionId, liquidityToRemove);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string'); // Transaction hash
  });

  test('should collect fees from the position', async () => {
    const result = await collectFeeV3(positionId);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string'); // Transaction hash
  });
});
