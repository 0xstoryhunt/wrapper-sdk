import {
  AlphaHunterV3,
  encodeSqrtRatioX96,
  MintOptions,
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
  priceToClosestTick,
} from '@storyhunt/v3-sdk'
import JSBI from 'jsbi'
import { ADDRESSES, defaultChain } from '../constants'
import {
  getAllowence,
  getCurrencyInstance,
  getPool,
  getPoolInfo,
  getTokenBalance,
  getTokenInfo,
  universalSendTransaction,
  universalWriteContract,
} from '../utils'

import { executeGraphQuery, getAccountAddress, getWriteClient } from '../config'
import { GraphPositionResponse } from './types'
import { encodeFunctionData, parseUnits, zeroAddress } from 'viem'
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from './abi'
import { ethers } from 'ethers'
import { POSITIONS_QUERY } from './queries'
import { Price, Percent, CurrencyAmount } from '@storyhunt/sdk-core'

/**
 * Creates a new StoryHunt V3 pool with the specified parameters.
 *
 * @param token0 - The address of the first token in the pool.
 * @param token1 - The address of the second token in the pool.
 * @param desirePrice - The desired price for the pool.
 * @param fee - The fee tier for the pool (500, 3000, or 10000).
 * @returns A promise that resolves to the transaction hash or an error.
 * @throws Will throw an error if no connected address is found or if the pool already exists.
 */
export const createPoolV3 = async (token0: string, token1: string, desirePrice: number, fee: 500 | 3000 | 10000) => {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }
    const poolAddress = await getPool(token0 as `0x${string}`, token1 as `0x${string}`, fee)
    if (poolAddress !== zeroAddress) {
      throw new Error('Pool already exists!')
    }

    const token0Info = await getTokenInfo(token0 as `0x${string}`)
    const token1Info = await getTokenInfo(token1 as `0x${string}`)

    const sqrtPriceX96 = encodeSqrtRatioX96(
      JSBI.BigInt(desirePrice * 10 ** token1Info.decimals),
      JSBI.BigInt(1 * 10 ** token0Info.decimals),
    )
    console.log('Initializing with sqrtPriceX96:', sqrtPriceX96.toString())

    // Execute the pool creation and initialization
    const hash = await universalWriteContract(walletClient, {
      address: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'createAndInitializePoolIfNecessary',
      args: [token0, token1, fee, sqrtPriceX96.toString()],
      value: BigInt(0),
      chain: defaultChain,
    })
    return hash
  } catch (error) {
    console.error('Error in pool creation:', error)
    return error as unknown as Error
  }
}

/**
 * Adds liquidity to an existing StoryHunt V3 pool.
 *
 * @param token0 - The address of the first token in the pool.
 * select 0x00 from ADDRESSES for native IP token
 * @param token1 - The address of the second token in the pool.
 * @param fee - The fee tier for the pool (500, 3000, or 10000).
 * @param amount0 - The amount of the first token to add.
 * @param amount1 - The amount of the second token to add.
 * @param highPrice - The upper price range for the liquidity position.
 * @param lowPrice - The lower price range for the liquidity position.
 * @returns A promise that resolves to the transaction hash, transaction response, or an error.
 * @throws Will throw an error if no connected address is found, if the pool doesn't exist, if there is insufficient balance or allowance.
 */
export async function addLiquidityV3(
  token0: string,
  token1: string,
  fee: 500 | 3000 | 10000,
  amount0: number,
  amount1: number,
  highPrice: number,
  lowPrice: number,
): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }
    const token0Info = await getTokenInfo(token0 as `0x${string}`)
    const token1Info = await getTokenInfo(token1 as `0x${string}`)

    const token0Instance = getCurrencyInstance(token0Info)?.currency
    const token1Instance = getCurrencyInstance(token1Info)?.currency

    if (!token0Instance || !token1Instance) {
      throw new Error('Invalid token address')
    }

    const poolAddress = await getPool(
      token0Instance.wrapped.address as `0x${string}`,
      token1Instance.wrapped.address as `0x${string}`,
      fee,
    )
    if (poolAddress === zeroAddress) {
      throw new Error(`Pool doesn't exists!`)
    }
    // const { token0, token1, tickLower, tickUpper, pool } = position;

    // Check balance
    const token0Balance = await getTokenBalance(token0Info.address)
    const token1Balance = await getTokenBalance(token1Info.address)

    // Directly convert raw balance values to BigInt without using formatUnits
    const formattedBalance0 = JSBI.BigInt(token0Balance.value.toString())
    const formattedBalance1 = JSBI.BigInt(token1Balance.value.toString())

    // Get the amounts needed to maintain the same ratio
    const amount0Desired = JSBI.BigInt(parseUnits(amount0.toFixed(token0Info.decimals), token0Info.decimals).toString())
    const amount1Desired = JSBI.BigInt(parseUnits(amount1.toFixed(token1Info.decimals), token1Info.decimals).toString())

    if (JSBI.lessThan(formattedBalance0, amount0Desired)) {
      throw new Error(`Insufficient balance ${token0Info.symbol}`)
    }
    if (JSBI.lessThan(formattedBalance1, amount1Desired)) {
      throw new Error(`Insufficient balance ${token1Info.symbol}`)
    }

    // Check allowance
    const allowance0Raw = await getAllowence(
      token0Info.address,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
    )
    const allowance1Raw = await getAllowence(
      token1Info.address,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
    )

    // Convert allowances to BigInt for accurate comparison
    const allowance0 = JSBI.BigInt(allowance0Raw.toString())
    const allowance1 = JSBI.BigInt(allowance1Raw.toString())

    if (JSBI.lessThan(allowance0, amount0Desired)) {
      throw new Error(`Insufficient allowance for token ${token0Info.symbol}`)
    }
    if (JSBI.lessThan(allowance1, amount1Desired)) {
      throw new Error(`Insufficient allowance for token ${token1Info.symbol}`)
    }

    const { liquidity, tick, sqrtPriceX96 } = await getPoolInfo(poolAddress)

    const poolInstance = new Pool(token0Instance.wrapped, token1Instance.wrapped, fee, sqrtPriceX96, liquidity, tick)

    const LowPrice = new Price(
      token0Instance.wrapped,
      token1Instance.wrapped,
      JSBI.BigInt(10 ** token0Instance?.decimals),
      JSBI.BigInt(Math.floor(Math.min(lowPrice, highPrice) * 10 ** token1Instance?.decimals)),
    )
    const HighPrice = new Price(
      token0Instance.wrapped,
      token1Instance.wrapped,
      JSBI.BigInt(10 ** token0Instance?.decimals),
      JSBI.BigInt(Math.floor(Math.max(lowPrice, highPrice) * 10 ** token1Instance?.decimals)),
    )

    const [tickLower, tickUpper] = [
      nearestUsableTick(priceToClosestTick(LowPrice), poolInstance.tickSpacing),
      nearestUsableTick(priceToClosestTick(HighPrice), poolInstance.tickSpacing),
    ]

    const position = Position.fromAmounts({
      pool: poolInstance,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0: amount0Desired,
      amount1: amount1Desired,
      useFullPrecision: true,
    })

    const mintLiquidityOptions: MintOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new Percent(50, 10_000), // 0.5%
      useNative: token0Instance.isNative ? token0Instance : token1Instance.isNative ? token1Instance : undefined,
      recipient: address as string,
    }

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintLiquidityOptions)

    console.log('adding liquidity value : ', value)

    /** REFUND CALLDATA */
    const refundIPCalldata = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'refundIP',
      args: [],
    })

    const finalEncoding = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'multicall',
      args: [[calldata, refundIPCalldata]],
    })

    // Ensure 'value' is an integer
    const integerValue = BigInt(Math.floor(Number(value)))

    const transaction = {
      chainId: ADDRESSES.CHAIN_ID,
      from: address,
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: finalEncoding,
      value: integerValue,
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }
    const hash = await universalSendTransaction(walletClient, transaction)
    return hash
  } catch (error) {
    console.error('Error in minting liquidity:', error)
    return error as unknown as Error
  }
}

/**
 * Adds liquidity to an existing StoryHunt V3 position.
 *
 * @param positionId - The ID of the position to add liquidity to.
 * @param amount0 - The amount of the first token to add.
 * @param amount1 - The amount of the second token to add.
 * @returns A promise that resolves to the transaction hash, transaction response, or an error.
 * @throws Will throw an error if no connected address is found, if the position is not found, if there is insufficient balance or allowance.
 */
export async function addPositionLiquidityV3(
  positionId: number,
  amount0: number,
  amount1: number,
): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }

    //get positin data
    const positionData = await executeGraphQuery<GraphPositionResponse>(POSITIONS_QUERY, {
      positionId,
      owner: address.toLowerCase(),
    })
    console.log('Position data : ', positionData.data?.positions[0])

    if (!positionData.data?.positions) throw new Error('Position not found')
    const { token0, token1, tickLower, tickUpper, pool } = positionData.data?.positions[0]

    const token0Info = await getTokenInfo(
      (token0.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token0.id) as `0x${string}`,
    )
    const token1Info = await getTokenInfo(
      (token1.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token1.id) as `0x${string}`,
    )

    // Check balance
    const token0Balance = await getTokenBalance(token0Info.address)
    const token1Balance = await getTokenBalance(token1Info.address)

    // Directly convert raw balance values to BigInt without using formatUnits
    const formattedBalance0 = JSBI.BigInt(token0Balance.value.toString())
    const formattedBalance1 = JSBI.BigInt(token1Balance.value.toString())

    // Get the amounts needed to maintain the same ratio
    const amount0Desired = JSBI.BigInt(
      parseUnits(amount0.toFixed(Number(token0.decimals)), Number(token0.decimals)).toString(),
    )
    const amount1Desired = JSBI.BigInt(
      parseUnits(amount1.toFixed(Number(token1.decimals)), Number(token1.decimals)).toString(),
    )

    if (JSBI.lessThan(formattedBalance0, amount0Desired)) {
      throw new Error(`Insufficient balance ${token0.symbol}`)
    }
    if (JSBI.lessThan(formattedBalance1, amount1Desired)) {
      throw new Error(`Insufficient balance ${token1.symbol}`)
    }

    const isStaked = positionData.data?.positions[0].isStaked

    // Check allowance
    const allowance0Raw = await getAllowence(
      token0.id,
      isStaked
        ? (ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`)
        : (ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`),
    )
    const allowance1Raw = await getAllowence(
      token1.id,
      isStaked
        ? (ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`)
        : (ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`),
    )

    // Convert allowances to BigInt for accurate comparison
    const allowance0 = JSBI.BigInt(allowance0Raw.toString())
    const allowance1 = JSBI.BigInt(allowance1Raw.toString())

    if (JSBI.lessThan(allowance0, amount0Desired)) {
      throw new Error(
        `Insufficient allowance from ${isStaked ? `AlphaHunterV3` : `NFTPositionManager`} for token ${token0.symbol}`,
      )
    }
    if (JSBI.lessThan(allowance1, amount1Desired)) {
      throw new Error(
        `Insufficient allowance from ${isStaked ? `AlphaHunterV3` : `NFTPositionManager`} for token ${token1.symbol}`,
      )
    }

    //token instances
    const token0Instance = getCurrencyInstance(token0Info)?.currency
    const token1Instance = getCurrencyInstance(token1Info)?.currency
    if (!token0Instance || !token1Instance) {
      throw new Error('Invalid token address')
    }

    const poolInstance = new Pool(
      token0Instance?.wrapped,
      token1Instance?.wrapped,
      parseInt(pool.feeTier),
      pool.sqrtPrice.toString(),
      JSBI.BigInt(pool.liquidity.toString()),
      parseInt(pool.tick),
    )

    const positionToIncreaseBy = Position.fromAmounts({
      pool: poolInstance,
      tickLower: parseInt(tickLower.tickIdx),
      tickUpper: parseInt(tickUpper.tickIdx),
      amount0: amount0Desired,
      amount1: amount1Desired,
      useFullPrecision: true,
    })

    const addLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new Percent(50, 10_000), // 0.5%
      tokenId: positionId,
      useNative: token0Instance.isNative ? token0Instance : token1Instance.isNative ? token1Instance : undefined,
    }

    const { calldata, value } = (isStaked ? AlphaHunterV3 : NonfungiblePositionManager).addCallParameters(
      positionToIncreaseBy,
      addLiquidityOptions,
    )

    console.log(`adding liquidity to ${isStaked ? `staked` : ``} position value`)

    /** REFUND CALLDATA */
    const refundIPCalldata = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'refundIP',
      args: [],
    })

    const finalEncoding = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'multicall',
      args: [[calldata, refundIPCalldata]],
    })

    const integerValue = BigInt(Math.floor(Number(value)))

    const transaction = {
      chainId: ADDRESSES.CHAIN_ID,
      from: address,
      to: isStaked
        ? (ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`)
        : (ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`),
      data: isStaked ? (calldata as `0x${string}`) : finalEncoding,
      value: integerValue,
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }
    const hash = await universalSendTransaction(walletClient, transaction)
    return hash
  } catch (error) {
    console.error('Error in adding liquidity:', error)
    return error as unknown as Error
  }
}

/**
 * Removes liquidity from an existing StoryHunt V3 position.
 *
 * @param positionId - The ID of the position to remove liquidity from.
 * @param percentageToRemove - The percentage of liquidity to remove (must be in integera from 1 to 100)
 * @returns A promise that resolves to the transaction hash, transaction response, or an error.
 * @throws Will throw an error if no connected address is found, if the position is not found.
 */
export async function removeLiquidityV3(
  positionId: number,
  percentageToRemove: number,
): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }

    //get positin data
    const positionData = await executeGraphQuery<GraphPositionResponse>(POSITIONS_QUERY, {
      positionId,
      owner: address.toLowerCase(),
    })
    if (!positionData.data?.positions) throw new Error('Position not found')
    const { token0, token1, liquidity, tickLower, tickUpper, pool } = positionData.data?.positions[0]

    const token0Info = await getTokenInfo(
      (token0.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token0.id) as `0x${string}`,
    )
    const token1Info = await getTokenInfo(
      (token1.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token1.id) as `0x${string}`,
    )

    const isStaked = positionData.data?.positions[0].isStaked

    console.log(' position to remove ', positionData.data?.positions[0])

    //token instances
    const token0Instance = getCurrencyInstance(token0Info)?.currency
    const token1Instance = getCurrencyInstance(token1Info)?.currency
    if (!token0Instance || !token1Instance) {
      throw new Error('Invalid token address')
    }

    const poolInstance = new Pool(
      token0Instance?.wrapped,
      token1Instance?.wrapped,
      parseInt(pool.feeTier),
      pool.sqrtPrice.toString(),
      pool.liquidity.toString(),
      parseInt(pool.tick),
    )

    const positionSDK = new Position({
      pool: poolInstance,
      liquidity: JSBI.BigInt(liquidity.toString()),
      tickLower: parseInt(tickLower.tickIdx),
      tickUpper: parseInt(tickUpper.tickIdx),
    })

    const removeLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new Percent(50, 10_000), // 0.5%
      tokenId: positionId,
      liquidityPercentage: new Percent(percentageToRemove, 100),
      collectOptions: {
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0Instance, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1Instance, 0),
        recipient: address,
      },
    }

    const { calldata, value } = (isStaked ? AlphaHunterV3 : NonfungiblePositionManager).removeCallParameters(
      positionSDK,
      removeLiquidityOptions,
    )

    const transaction = {
      to: isStaked
        ? (ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`)
        : (ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`),
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }
    const hash = await universalSendTransaction(walletClient, transaction)
    return hash
  } catch (error) {
    console.error('Error in removing liquidity:', error)
    return error as unknown as Error
  }
}

/**
 * Collects fees from an existing StoryHunt V3 position.
 *
 * @param positionId - The ID of the position to collect fees from.
 * @returns A promise that resolves to the transaction hash, transaction response, or an error.
 * @throws Will throw an error if no connected address is found, if the position is not found.
 */
export async function collectFeeV3(positionId: number): Promise<string | ethers.TransactionResponse | Error> {
  const walletClient = getWriteClient()
  const address = getAccountAddress()

  try {
    if (!address) {
      throw new Error('No connected address found')
    }
    //get positin data
    const positionData = await executeGraphQuery<GraphPositionResponse>(POSITIONS_QUERY, {
      positionId,
      owner: address.toLowerCase(),
    })
    if (!positionData.data?.positions) throw new Error('Position not found')
    const { token0, token1 } = positionData.data?.positions[0]

    const isStaked = positionData.data?.positions[0].isStaked

    const token0Info = await getTokenInfo(
      (token0.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token0.id) as `0x${string}`,
    )
    const token1Info = await getTokenInfo(
      (token1.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token1.id) as `0x${string}`,
    )

    //token instances
    const token0Instance = getCurrencyInstance(token0Info)?.currency
    const token1Instance = getCurrencyInstance(token1Info)?.currency
    if (!token0Instance || !token1Instance) {
      throw new Error('Invalid token address')
    }

    // Convert tokensOwed to raw amounts
    const amount0Raw = parseUnits(token0.feesUSD, token0Instance.decimals).toString()
    const amount1Raw = parseUnits(token1.feesUSD, token1Instance.decimals).toString()

    const collectOptions = {
      tokenId: positionId,
      expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0Instance, JSBI.BigInt(amount0Raw)),
      expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1Instance, JSBI.BigInt(amount1Raw)),
      recipient: address,
    }

    const { calldata, value } = (isStaked ? AlphaHunterV3 : NonfungiblePositionManager).collectCallParameters(
      collectOptions,
    )

    const transaction = {
      to: isStaked
        ? (ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`)
        : (ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`),
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }
    const hash = await universalSendTransaction(walletClient, transaction)
    return hash
  } catch (error) {
    console.error('Error in removing liquidity:', error)
    return error as unknown as Error
  }
}
