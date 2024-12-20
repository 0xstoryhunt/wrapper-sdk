import 'dotenv/config';
import { ADDRESSES, getWriteClient, initClient, swapRouterV3, swapV3 } from '../../src';
import { Trade } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';


const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const expectedAddress = process.env.TEST_PUBLIC_ADDRESS as `0x${string}`;

beforeAll(async () => {
    await initClient({ privateKey });
  
});

describe('config wallet client using viem', () => {
  test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
    const walletClient : any = getWriteClient();
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

    const routes = await swapRouterV3(tokenIn, tokenOut, amount, false);
    expect(routes).toBeDefined();
  },15000);

  test('routing wip/ip to be empty', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; // WIP token
    const tokenOut = ADDRESSES.TOKENS.IP.id; // IP token
    const amount = BigInt(10 ** 15); // 0.001 WIP

    const routes = await swapRouterV3(tokenIn, tokenOut, amount, false);
    expect(routes.toString()).toBe("");
  },15000);
});

describe('swap viem client', () => {
  test('should execute a successful swap from 0.001 WIP to JUTSU', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id; 
    const tokenOut = ADDRESSES.TOKENS.JUTSU.id;
    const amountIn = BigInt(10 ** 15); //  0.001 WIP

    // Get a route for the swap
    const routes : Trade<Token, Token, any>[] | Error= await swapRouterV3(tokenIn, tokenOut, amountIn, true);

    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
    //@ts-ignore
    expect(routes.length).toBeGreaterThan(0);

    // Take the best trade (first one returned)
    //@ts-ignore
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

})