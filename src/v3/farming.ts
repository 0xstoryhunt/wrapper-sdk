import { ADDRESSES, defaultChain } from '../constants'
import { getAccountAddress, getWriteClient, executeGraphQuery } from '../config'
import { universalSendTransaction } from '../utils'
import { ALPHA_HUNTER_V3_ABI, NONFUNGIBLE_POSITION_MANAGER_ABI } from './abi'
import { encodeFunctionData } from 'viem'
import { POSITIONS_QUERY } from './queries'
import { ethers } from 'ethers'

/**
 * Stake a liquidity position to the AlphaHunter contract.
 *
 * @param positionId - The ID of the position to stake.
 * @returns A promise that resolves to the transaction hash or an error.
 * @throws Will throw an error if the connected wallet address is not found or if the position ID is invalid.
 */
export async function stakePosition(positionId: number): Promise<string | ethers.TransactionResponse | Error> {
  // Validate input parameters
  if (!positionId || positionId <= 0) {
    throw new Error('Invalid position ID. Position ID must be a positive number.')
  }

  const walletClient = getWriteClient()
  const address = getAccountAddress()

  if (!address) {
    throw new Error('No connected wallet address found.')
  }

  try {
    // Fetch position details
    const positionData = await fetchPositionData(positionId, address)
    if (!positionData) {
      throw new Error(`Position with ID ${positionId} not found.`)
    }

    if (positionData.isStaked) {
      throw new Error(`Position with ID ${positionId} is already staked.`)
    }

    // Encode calldata for staking
    const stakeCalldata = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'safeTransferFrom',
      args: [address, ADDRESSES.V3_ALPHAHUNTER_ADDRESS, positionId],
    })

    // Build the transaction
    const transaction = {
      chainId: ADDRESSES.CHAIN_ID,
      from: address,
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: stakeCalldata,
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }

    // Send the transaction
    const txHash = await universalSendTransaction(walletClient, transaction)
    console.log(`Stake transaction submitted: ${txHash}`)
    return txHash
  } catch (error) {
    console.error('Error staking position:', error)
    return error as unknown as Error
  }
}

/**
 * Unstake a liquidity position from the AlphaHunter contract.
 *
 * @param positionId - The ID of the position to unstake.
 * @returns A promise that resolves to the transaction hash or an error.
 * @throws Will throw an error if the connected wallet address is not found or if the position ID is invalid.
 */
export async function unstakePosition(positionId: number): Promise<string | ethers.TransactionResponse | Error> {
  // Validate input parameters
  if (!positionId || positionId <= 0) {
    throw new Error('Invalid position ID. Position ID must be a positive number.')
  }

  const walletClient = getWriteClient()
  const address = getAccountAddress()

  if (!address) {
    throw new Error('No connected wallet address found.')
  }

  try {
    // Fetch position details
    const positionData = await fetchPositionData(positionId, address)
    if (!positionData) {
      throw new Error(`Position with ID ${positionId} not found.`)
    }

    if (!positionData.isStaked) {
      throw new Error(`Position with ID ${positionId} is not currently staked.`)
    }

    // Encode calldata for unstaking
    const unstakeCalldata = encodeFunctionData({
      abi: ALPHA_HUNTER_V3_ABI,
      functionName: 'withdraw',
      args: [positionId, address],
    })

    // Build the transaction
    const transaction = {
      chainId: ADDRESSES.CHAIN_ID,
      from: address,
      to: ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`,
      data: unstakeCalldata,
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }

    // Send the transaction
    const txHash = await universalSendTransaction(walletClient, transaction)
    console.log(`Unstake transaction submitted: ${txHash}`)
    return txHash
  } catch (error) {
    console.error('Error unstaking position:', error)
    return error as unknown as Error
  }
}

/**
 * Harvest rewards for a liquidity position from the AlphaHunter contract.
 *
 * @param positionId - The ID of the position to harvest rewards from.
 * @returns A promise that resolves to the transaction hash or an error.
 * @throws Will throw an error if the connected wallet address is not found, the position is invalid, or reward tokens are unavailable.
 */
export async function harvestPosition(positionId: number): Promise<string | ethers.TransactionResponse | Error> {
  // Validate input parameters
  if (!positionId || positionId <= 0) {
    throw new Error('Invalid position ID. Position ID must be a positive number.')
  }

  const walletClient = getWriteClient()
  const address = getAccountAddress()

  if (!address) {
    throw new Error('No connected wallet address found.')
  }

  try {
    // Fetch position details
    const positionData = await fetchPositionData(positionId, address)
    if (!positionData) {
      throw new Error(`Position with ID ${positionId} not found.`)
    }

    const rewardTokens = positionData.pool?.lmPool?.alphaHunter?.rewardPeriods[0]?.rewardTokens
    if (!rewardTokens || rewardTokens.length === 0) {
      throw new Error('No reward tokens available for this position.')
    }

    // Prepare calldata for harvesting rewards for each token
    const harvestCalldataArray = rewardTokens.map((rewardToken: any) =>
      encodeFunctionData({
        abi: ALPHA_HUNTER_V3_ABI,
        functionName: 'harvest',
        args: [rewardToken.token.id, positionId, address],
      }),
    )

    const multicallCalldata = encodeFunctionData({
      abi: ALPHA_HUNTER_V3_ABI,
      functionName: 'multicall',
      args: [harvestCalldataArray],
    })

    // Build the transaction
    const transaction = {
      chainId: ADDRESSES.CHAIN_ID,
      from: address,
      to: ADDRESSES.V3_ALPHAHUNTER_ADDRESS as `0x${string}`,
      data: multicallCalldata,
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    }

    // Send the transaction
    const txHash = await universalSendTransaction(walletClient, transaction)
    console.log(`Harvest transaction submitted: ${txHash}`)
    return txHash
  } catch (error) {
    console.error('Error harvesting position:', error)
    return error as unknown as Error
  }
}

/**
 * Fetch position details from the subgraph.
 *
 * @param positionId - The ID of the position to fetch.
 * @param address - The owner's address.
 * @returns The position data or null if not found.
 */
export async function fetchPositionData(positionId: number, address: string): Promise<any | null> {
  const response = await executeGraphQuery<{ positions: any[] }>(POSITIONS_QUERY, {
    positionId,
    owner: address.toLowerCase(),
  })

  return response.data?.positions?.[0] || null
}
