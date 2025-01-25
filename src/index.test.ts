import {
  getWriteClient,
  initClient,
  unwrap,
  wrap,
  ADDRESSES,
  swapRouterV3,
  swapV3,
  createPoolV3,
  addLiquidityV3,
  addPositionLiquidityV3,
  removeLiquidityV3,
  collectFeeV3,
  getAllowence,
  v3PositionManagertokenApproval,
  getUserPoolsV3,
  v3RoutertokenApproval,
  harvestPosition,
  stakePosition,
  unstakePosition,
} from '.'
// import { defaultChain } from '../../src';
// import { ethers } from 'ethers';

import { IP, Token, TradeType } from '@storyhunt/sdk-core'
import { Trade } from '@storyhunt/v3-sdk'
import JSBI from 'jsbi'
import { parseUnits } from 'viem'

const privateKey = '' as `0x${string}` //process.env.TEST_PRIVATE_KEY as `0x${string}`
const expectedAddress = '' as `0x${string}` //process.env.TEST_PUBLIC_ADDRESS as `0x${string}`

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

beforeAll(async () => {
  // 1. Setup: Initialize SDK with Wallet Client using Viem(Private Key)
  await initClient({ privateKey })

  // 2. Setup: Initialize SDK with Ether Signer
  // const provider = new ethers.JsonRpcProvider(
  //   defaultChain.rpcUrls.default.http[0]
  // );
  // const signer = new ethers.Wallet(privateKey || '', provider);
  // await initClient({ ethersSigner: signer });
})

describe('config wallet client using viem', () => {
  test('Setup: Ensure Wallet Client Account matches TEST_PUBLIC_ADDRESS', async () => {
    const walletClient: any = getWriteClient()
    expect(walletClient.account.address.toLowerCase()).toBe(expectedAddress.toLowerCase())
  })
})

describe('routing', () => {
  test('routing WIP/USDC to be defined', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id // WIP token
    const tokenOut = ADDRESSES.TOKENS.USDC.id // USDC token
    const amount = '1' // 1 WIP

    const routes = await swapRouterV3(tokenIn, tokenOut, amount, false)
    expect(routes).toBeDefined()
  }, 15000)
})

describe('swap', () => {
  test('should get allowance for swap', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP
    const amountIn = JSBI.BigInt(BigInt(10 ** 18).toString())

    // Check allowance
    const allowanceRaw = await getAllowence(tokenIn.id, ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS as `0x${string}`)

    // Convert allowances to BigInt for accurate comparison
    const allowance = JSBI.BigInt(allowanceRaw.toString())

    if (JSBI.lessThan(allowance, amountIn)) {
      console.log(`getting allowance for token ${tokenIn.symbol}`)
      const tokenAllowance = await v3RoutertokenApproval(tokenIn.id)
      expect(typeof tokenAllowance).toBe('string')
    }
  }, 60000)

  test('should execute a successful swap from 0.001 WIP to USDC', async () => {
    const tokenIn = ADDRESSES.TOKENS.WIP.id
    const tokenOut = ADDRESSES.TOKENS.USDC.id
    const amountIn = '1' //  1 WIP

    // Get a route for the swap
    const routes: Trade<IP | Token, IP | Token, TradeType>[] | Error = await swapRouterV3(
      tokenIn,
      tokenOut,
      amountIn,
      true,
    )
    if (routes instanceof Error) {
      console.log('[Route/error]', routes)
      return
    } else {
      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
      expect(routes.length).toBeGreaterThan(0)
    }

    // Take the best trade (first one returned)
    const bestTrade = routes[0]
    expect(bestTrade).toBeDefined()

    // Execute the swap
    const swapResult = await swapV3(bestTrade)
    //console.log("swapResult" ,swapResult)
    expect(swapResult).toBeDefined()
    // If successful, this should be a transaction hash (a string)
    expect(typeof swapResult).toBe('string')
    expect((swapResult as string).length).toBeGreaterThan(0)
  }, 60000)
})

describe('Wrap and Unwrap Integration Tests', () => {
  // const WIP_ADDRESS = ADDRESSES.TOKENS.WIP.id;
  // const IP_ADDRESS = ADDRESSES.TOKENS.IP.id;

  test('Wrap IP into WIP', async () => {
    const wrapAmount = BigInt(10 ** 18) // 1 IP in wei

    // Get initial balances
    // const initialIPBalance = await getTokenBalance(IP_ADDRESS);
    // const initialWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Initial IP Balance:', initialIPBalance.value.toString());
    // console.log('Initial WIP Balance:', initialWIPBalance.value.toString());

    // Perform wrap
    const txHash = await wrap(wrapAmount)
    expect(txHash).toBeDefined()
    expect(typeof txHash).toBe('string') // Expecting a transaction hash as string

    console.log('Wrap transaction hash:', txHash)

    // // Get final balances
    // const finalIPBalance = await getTokenBalance(IP_ADDRESS);
    // const finalWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Final IP Balance:', finalIPBalance.value.toString());
    // console.log('Final WIP Balance:', finalWIPBalance.value.toString());

    // // Check that IP decreased and WIP increased
    // expect(finalIPBalance.value).toBeLessThan(initialIPBalance.value);
    // expect(finalWIPBalance.value).toBeGreaterThan(initialWIPBalance.value);
  }, 60000)

  test('Unwrap WIP back to IP', async () => {
    const unwrapAmount = BigInt(10 ** 18) // 1 WIP in wei

    // Get initial balances
    // const initialIPBalance = await getTokenBalance(IP_ADDRESS);
    // const initialWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Initial IP Balance:', initialIPBalance.value.toString());
    // console.log('Initial WIP Balance:', initialWIPBalance.value.toString());

    // Perform unwrap
    const txHash = await unwrap(unwrapAmount)
    expect(txHash).toBeDefined()
    expect(typeof txHash).toBe('string') // Expecting a transaction hash as string

    console.log('Unwrap transaction hash:', txHash)

    // Get final balances
    // const finalIPBalance = await getTokenBalance(IP_ADDRESS);
    // const finalWIPBalance = await getTokenBalance(WIP_ADDRESS);

    // console.log('Final IP Balance:', finalIPBalance.value.toString());
    // console.log('Final WIP Balance:', finalWIPBalance.value.toString());

    // // Check that WIP decreased and IP increased
    // expect(finalWIPBalance.value).toBeLessThan(initialWIPBalance.value);
    // expect(finalIPBalance.value).toBeGreaterThan(initialIPBalance.value);
  }, 60000)
})

describe('Pool Operations', () => {
  const tokenA = ADDRESSES.TOKENS.WIP
  const tokenB = ADDRESSES.TOKENS.USDC
  const fee = 500 // 0.3%
  const desirePrice = 15.5 // 1 WIP = 1 USDC
  let positionId = 1

  test('should create a new pool', async () => {
    const result = await createPoolV3(tokenA.id, tokenB.id, desirePrice, fee)
    if (result instanceof Error) {
      console.log('[Pool/error]', result)
    } else {
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      console.log(' should create a new pool ', result)
    }
  }, 60000)

  test('already has a pool', async () => {
    const error = await createPoolV3(tokenA.id, tokenB.id, desirePrice, fee)
    if (error instanceof Error) {
      expect(error.message).toContain('Pool already exists!')
    }
  }, 60000)

  test('should get allowance for adding liquidity', async () => {
    const amountA = 10 // 10 IP
    const amountB = 10 // 10 USDC

    const amount0Desired = JSBI.BigInt(parseUnits(amountA.toFixed(tokenA.decimals), tokenA.decimals).toString())
    const amount1Desired = JSBI.BigInt(parseUnits(amountB.toFixed(tokenB.decimals), tokenB.decimals).toString())

    // Check allowance
    const allowance0Raw = await getAllowence(
      tokenA.id,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
    )

    const allowance1Raw = await getAllowence(
      tokenB.id,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
    )

    // Convert allowances to BigInt for accurate comparison
    const allowance0 = JSBI.BigInt(allowance0Raw.toString())
    const allowance1 = JSBI.BigInt(allowance1Raw.toString())

    if (JSBI.lessThan(allowance0, amount0Desired)) {
      console.log(`getting allowance for token ${tokenA.symbol}`)
      const tokenAAllowance = await v3PositionManagertokenApproval(tokenA.id)
      expect(typeof tokenAAllowance).toBe('string')
    }

    if (JSBI.lessThan(allowance1, amount1Desired)) {
      console.log(`getting allowance for token ${tokenB.symbol}`)
      const tokenBAllowance = await v3PositionManagertokenApproval(tokenB.id)
      expect(typeof tokenBAllowance).toBe('string')
    }
  }, 60000)

  test('should add initial liquidity to the pool', async () => {
    const amountA = 10 // 10 IP
    const amountB = 10 // 10 USDC

    const result = await addLiquidityV3(
      tokenA.id,
      tokenB.id,
      fee,
      amountA,
      amountB,
      desirePrice * 0.95,
      desirePrice * 1.05,
    )
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  }, 60000)

  test('Wait 30 seconds before retrieving user pools', async () => {
    console.log('Waiting for 30 seconds before the next test...')
    await sleep(30000) // Wait for 30 seconds
  }, 31000)

  test('Retrieve user pools to obtain latest position ID', async () => {
    const userPools = await getUserPoolsV3()

    expect(userPools).toBeDefined()
    expect(userPools instanceof Error).toBe(false)
    expect(Array.isArray(userPools.data?.positions)).toBe(true)
    console.log('positions : ', userPools)
    expect(userPools.data?.positions.length).toBeGreaterThan(0)

    // Assume the latest position is the one we just added
    const latestPosition = userPools.data?.positions[0]
    positionId = latestPosition.id

    console.log('Retrieved position ID:', positionId)
  }, 60000)

  test('should add liquidity to the same position', async () => {
    const additionalAmountA = 10 // 10 IP
    const additionalAmountB = 10 // 10 USDC

    const result = await addPositionLiquidityV3(positionId, additionalAmountA, additionalAmountB)
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  }, 60000)

  test('should collect fees from the position', async () => {
    const result = await collectFeeV3(positionId)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string') // Transaction hash
  }, 60000)

  test('Wait 30 seconds before staking', async () => {
    console.log('Waiting for 30 seconds before staking...')
    await sleep(30000) // Wait for 30 seconds
  }, 31000)

  test('should stake liquidity position', async () => {
    const result = await stakePosition(positionId)
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  }, 60000)

  test('Wait 30 seconds before harvesting', async () => {
    console.log('Waiting for 30 seconds before harvesting...')
    await sleep(30000) // Wait for 30 seconds
  }, 31000)

  test('should harvest rewards from staked liquidity position', async () => {
    const result = await harvestPosition(positionId)
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  }, 60000)

  test('Wait 30 seconds before unstaking', async () => {
    console.log('Waiting for 30 seconds before unstaking...')
    await sleep(30000) // Wait for 30 seconds
  }, 31000)

  test('should unstake liquidity position', async () => {
    const result = await unstakePosition(positionId)
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  }, 60000)

  test('Wait 30 seconds before removing liquidity', async () => {
    console.log('Waiting for 30 seconds before removing liquidity...')
    await sleep(30000) // Wait for 30 seconds
  }, 31000)

  test('should remove liquidity from the position', async () => {
    const liquidityToRemove = 100 // 50% worth of liquidity

    const result = await removeLiquidityV3(positionId, liquidityToRemove)
    console.log(result)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string') // Transaction hash
  }, 60000)
})
