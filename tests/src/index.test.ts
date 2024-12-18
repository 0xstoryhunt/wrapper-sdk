import 'dotenv/config';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ADDRESSES, defaultChain, v3routingViem, v3swapViem } from '../../src';
import { Trade } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';


const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const expectedAddress = process.env.TEST_PUBLIC_ADDRESS as `0x${string}`;

beforeAll(async () => {
  //connect wallet
  if (!privateKey || !expectedAddress) {
    throw new Error('TEST_PRIVATE_KEY and TEST_PUBLIC_ADDRESS not set in .env');
  }
});

afterAll(async () => {
  //disconnect wallet
});

describe('config wallet client', () => {
  test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
    const walletAccount = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      chain: defaultChain,
      transport: http(),
      account: walletAccount,
    });

    if (!walletAccount || !walletAccount.address) {
      throw new Error(
        'No account is connected. Check private key configuration.'
      );
    }

    expect(walletClient.account.address.toLowerCase()).toBe(
      expectedAddress.toLowerCase()
    );
  });
});


describe('routing', () => {
  test('routing wip/jutsu to be defined', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.JUTSU.id; // IP token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await v3routingViem(tokenIn, tokenOut, amount, false);
    expect(routes).toBeDefined();
  },15000);

  test('routing wip/ip to be empty', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.IP.id; // IP token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await v3routingViem(tokenIn, tokenOut, amount, false);
    expect(routes.toString()).toBe("");
  },15000);
});

describe('swap', () => {
  test('should execute a successful swap from USDC (1.6) to IP', async () => {
    const tokenIn = ADDRESSES.TOKENS.USDC.id; 
    const tokenOut = ADDRESSES.TOKENS.IP.id;
    const amountIn = BigInt(10 ** 5); // 1.6 USDC

    // Get a route for the swap
    const routes : Trade<Token, Token, any>[] | Error= await v3routingViem(tokenIn, tokenOut, amountIn, true);

    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
    //@ts-ignore
    expect(routes.length).toBeGreaterThan(0);

    // Take the best trade (first one returned)
    //@ts-ignore
    const bestTrade = routes[0];
    expect(bestTrade).toBeDefined();

    // Execute the swap
    const swapResult = await v3swapViem(bestTrade);
    //console.log("swapResult" ,swapResult)
    expect(swapResult).toBeDefined();
    // If successful, this should be a transaction hash (a string)
    expect(typeof swapResult).toBe('string');
    expect((swapResult as string).length).toBeGreaterThan(0);
  }, 60000); 


  test('should execute a successful swap from WIP (0.001) to JUTSU', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; 
    const tokenOut = ADDRESSES.TOKENS.JUTSU.id;
    const amountIn = BigInt(10 ** 15); // 0.001 WIP

    // Get a route for the swap
    const routes : Trade<Token, Token, any>[] | Error= await v3routingViem(tokenIn, tokenOut, amountIn, true);

    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
    //@ts-ignore
    expect(routes.length).toBeGreaterThan(0);

    // Take the best trade (first one returned)
    //@ts-ignore
    const bestTrade = routes[0];
    expect(bestTrade).toBeDefined();

    // Execute the swap
    const swapResult = await v3swapViem(bestTrade);
    //console.log("swapResult" ,swapResult)
    expect(swapResult).toBeDefined();
    // If successful, this should be a transaction hash (a string)
    expect(typeof swapResult).toBe('string');
    expect((swapResult as string).length).toBeGreaterThan(0);
  }, 60000); // Increased timeout, as swaps may take longer
});
