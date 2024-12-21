import { getWriteClient, initClient, unwrap, wrap } from '../../src';
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
import { Token } from '@storyhunt/core';
import { Trade } from '@storyhunt/v3-sdk';

const privateKey = '0x...' as `0x${string}`;
const expectedAddress = '0x...' as `0x${string}`;

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

describe('Wrap and Unwrap Integration Tests', () => {
  // const WIP_ADDRESS = ADDRESSES.TOKENS.WIP.id;
  // const IP_ADDRESS = ADDRESSES.TOKENS.IP.id;

  test('Wrap IP into WIP', async () => {
    const wrapAmount = BigInt(10 ** 18); // 1 IP in wei

    // Get initial balances
    // const initialIPBalance = await getTokenBalance(IP_ADDRESS);
    // const initialWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Initial IP Balance:', initialIPBalance.value.toString());
    // console.log('Initial WIP Balance:', initialWIPBalance.value.toString());

    // Perform wrap
    const txHash = await wrap(wrapAmount);
    expect(txHash).toBeDefined();
    expect(typeof txHash).toBe('string'); // Expecting a transaction hash as string

    console.log('Wrap transaction hash:', txHash);

    // // Get final balances
    // const finalIPBalance = await getTokenBalance(IP_ADDRESS);
    // const finalWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Final IP Balance:', finalIPBalance.value.toString());
    // console.log('Final WIP Balance:', finalWIPBalance.value.toString());

    // // Check that IP decreased and WIP increased
    // expect(finalIPBalance.value).toBeLessThan(initialIPBalance.value);
    // expect(finalWIPBalance.value).toBeGreaterThan(initialWIPBalance.value);
  }, 60000);

  test('Unwrap WIP back to IP', async () => {
    const unwrapAmount = BigInt(10 ** 18); // 1 WIP in wei

    // Get initial balances
    // const initialIPBalance = await getTokenBalance(IP_ADDRESS);
    // const initialWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Initial IP Balance:', initialIPBalance.value.toString());
    // console.log('Initial WIP Balance:', initialWIPBalance.value.toString());

    // Perform unwrap
    const txHash = await unwrap(unwrapAmount);
    expect(txHash).toBeDefined();
    expect(typeof txHash).toBe('string'); // Expecting a transaction hash as string

    console.log('Unwrap transaction hash:', txHash);

    // Get final balances
    // const finalIPBalance = await getTokenBalance(IP_ADDRESS);
    // const finalWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Final IP Balance:', finalIPBalance.value.toString());
    // console.log('Final WIP Balance:', finalWIPBalance.value.toString());

    // // Check that WIP decreased and IP increased
    // expect(finalWIPBalance.value).toBeLessThan(initialWIPBalance.value);
    // expect(finalIPBalance.value).toBeGreaterThan(initialIPBalance.value);
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
  }, 60000);

  test('already has a pool', async () => {
    const error = await createPoolV3(tokenA, tokenB, desirePrice, fee);
    if (error instanceof Error) {
      expect(error.message).toBe('Pool already exists');
    }
  }, 60000);

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
  }, 60000);

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
  }, 60000);

  test('should remove liquidity from the position', async () => {
    const liquidityToRemove = 50; // 50% worth of liquidity

    const result = await removeLiquidityV3(positionId, liquidityToRemove);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string'); // Transaction hash
  }, 60000);

  test('should collect fees from the position', async () => {
    const result = await collectFeeV3(positionId);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string'); // Transaction hash
  }, 60000);
});
