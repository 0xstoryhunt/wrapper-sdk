import * as STORYHUNT from '@uniswap/sdk-core';
import {
  encodeSqrtRatioX96,
  MintOptions,
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
  priceToClosestTick,
} from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import { ADDRESSES, defaultChain } from '../constants';
import {
  getAllowence,
  getPool,
  getPoolInfo,
  getTokenBalance,
  getTokenInfo,
  universalSendTransaction,
  universalWriteContract,
} from '../utils';

import { getAccountAddress, getWriteClient } from '../config';
import { PositionData } from './types';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from './abi';

export const createPoolV3 = async (
  token0: string,
  token1: string,
  desirePrice: string,
  fee: 500 | 3000 | 10000
) => {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }
    const poolAddress = await getPool(
      token0 as `0x${string}`,
      token1 as `0x${string}`,
      fee
    );
    if (poolAddress !== zeroAddress) {
      throw new Error('Pool already exists!');
    }

    const token0Info = await getTokenInfo(token0 as `0x${string}`);
    const token1Info = await getTokenInfo(token1 as `0x${string}`);

    const sqrtPriceX96 = encodeSqrtRatioX96(
      JSBI.BigInt(+desirePrice * 10 ** token0Info.decimals),
      JSBI.BigInt(1 * 10 ** token1Info.decimals)
    );
    console.log('Initializing with sqrtPriceX96:', sqrtPriceX96.toString());

    // Execute the pool creation and initialization
    const hash = await universalWriteContract(walletClient, {
      address:
        ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'createAndInitializePoolIfNecessary',
      args: [token0, token1, fee, sqrtPriceX96.toString()],
      value: BigInt(0),
      chain: defaultChain,
    });
    return hash;
  } catch (error) {
    console.error('Error in pool creation:', error);
    return error;
  }
};

export const addLiquidityV3 = async (
  token0: string,
  token1: string,
  fee: 500 | 3000 | 10000,
  amount0: number,
  amount1: number,
  highPrice: number,
  lowPrice: number
) => {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }
    const token0Info = await getTokenInfo(token0 as `0x${string}`);
    const token1Info = await getTokenInfo(token1 as `0x${string}`);
    const poolAddress = await getPool(
      token0 as `0x${string}`,
      token1 as `0x${string}`,
      fee
    );
    if (poolAddress === zeroAddress) {
      throw new Error(`Pool doesn't exists!`);
    }
    // const { token0, token1, tickLower, tickUpper, pool } = position;

    // Check balance
    const token0Balance = await getTokenBalance(
      token0Info.address === ADDRESSES.TOKENS.WIP.id
        ? ADDRESSES.TOKENS.IP.id
        : token0Info.address
    );
    const token1Balance = await getTokenBalance(
      token1Info.address === ADDRESSES.TOKENS.WIP.id
        ? ADDRESSES.TOKENS.IP.id
        : token1Info.address
    );
    const formattedBalance0 = JSBI.BigInt(
      formatUnits(token0Balance.value, token0Balance.decimals)
    );
    const formattedBalance1 = JSBI.BigInt(
      formatUnits(token1Balance.value, token1Balance.decimals)
    );

    // Get the amounts needed to maintain the same ratio
    const amount0Desired = JSBI.BigInt(
      parseUnits(
        amount0.toLocaleString('fullwide', { useGrouping: false }),
        token0Info.decimals
      ).toString()
    );
    const amount1Desired = JSBI.BigInt(
      parseUnits(
        amount1.toLocaleString('fullwide', { useGrouping: false }),
        token1Info.decimals
      ).toString()
    );

    if (formattedBalance0 < amount0Desired) {
      throw new Error(`Insufficient balance ${token0Info.symbol}`);
    }
    if (formattedBalance1 < amount1Desired) {
      throw new Error(`Insufficient balance ${token1Info.symbol}`);
    }

    // Check allowance
    const allowance0 = await getAllowence(
      token0Info.address,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`
    );
    if (allowance0 < amount0) {
      throw new Error(`Insufficient allowance for token ${token0Info.symbol}`);
    }
    const allowance1 = await getAllowence(
      token1Info.address,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`
    );
    if (allowance1 < amount0) {
      throw new Error(`Insufficient allowance for token ${token1Info.symbol}`);
    }

    const token0Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token0Info.address,
      token0Info.decimals,
      token0Info.symbol
    );
    const token1Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token1Info.address,
      token1Info.decimals,
      token1Info.symbol
    );

    const { liquidity, tick, sqrtPriceX96 } = await getPoolInfo(poolAddress);

    const poolInstance = new Pool(
      token0Instance,
      token1Instance,
      fee,
      sqrtPriceX96,
      liquidity,
      tick
    );

    const [tickLower, tickUpper] = [
      Math.min(
        nearestUsableTick(
          priceToClosestTick(
            new STORYHUNT.Price(
              token0Instance,
              token1Instance,
              JSBI.BigInt(10 ** token0Info.decimals),
              JSBI.BigInt(Math.floor(lowPrice * 10 ** token1Info.decimals))
            )
          ),
          poolInstance.tickSpacing
        ),
        nearestUsableTick(
          priceToClosestTick(
            new STORYHUNT.Price(
              token0Instance,
              token1Instance,
              JSBI.BigInt(10 ** token0Info.decimals),
              JSBI.BigInt(Math.floor(highPrice * 10 ** token1Info.decimals))
            )
          ),
          poolInstance.tickSpacing
        )
      ),
      Math.max(
        nearestUsableTick(
          priceToClosestTick(
            new STORYHUNT.Price(
              token0Instance,
              token1Instance,
              JSBI.BigInt(10 ** token0Info.decimals),
              JSBI.BigInt(Math.floor(lowPrice * 10 ** token1Info.decimals))
            )
          ),
          poolInstance.tickSpacing
        ),
        nearestUsableTick(
          priceToClosestTick(
            new STORYHUNT.Price(
              token0Instance,
              token1Instance,
              JSBI.BigInt(10 ** token0Info.decimals),
              JSBI.BigInt(Math.floor(highPrice * 10 ** token1Info.decimals))
            )
          ),
          poolInstance.tickSpacing
        )
      ),
    ];

    const position = Position.fromAmounts({
      pool: poolInstance,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0: amount0Desired,
      amount1: amount1Desired,
      useFullPrecision: true,
    });

    const mintLiquidityOptions: MintOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new STORYHUNT.Percent(50, 10_000), // 0.5%
      recipient: address,
      // createPool: true,
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
      mintLiquidityOptions
    );

    const transaction = {
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    };
    const hash = await universalSendTransaction(walletClient, transaction);
    return hash;
  } catch (error) {
    console.error('Error in minting liquidity:', error);
    return error;
  }
};

export const addPositionLiquidityV3 = async (
  position: PositionData,
  amount0: number,
  amount1: number
) => {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }

    const { token0, token1, tickLower, tickUpper, pool } = position;

    // Check balance
    const token0Balance = await getTokenBalance(
      token0.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token0.id
    );
    const token1Balance = await getTokenBalance(
      token1.id === ADDRESSES.TOKENS.WIP.id ? ADDRESSES.TOKENS.IP.id : token1.id
    );
    const formattedBalance0 = JSBI.BigInt(
      formatUnits(token0Balance.value, token0Balance.decimals)
    );
    const formattedBalance1 = JSBI.BigInt(
      formatUnits(token1Balance.value, token1Balance.decimals)
    );

    // Get the amounts needed to maintain the same ratio
    const amount0Desired = JSBI.BigInt(
      parseUnits(
        amount0.toLocaleString('fullwide', { useGrouping: false }),
        parseInt(token0.decimals)
      ).toString()
    );
    const amount1Desired = JSBI.BigInt(
      parseUnits(
        amount1.toLocaleString('fullwide', { useGrouping: false }),
        parseInt(token1.decimals)
      ).toString()
    );

    if (formattedBalance0 < amount0Desired) {
      throw new Error(`Insufficient balance ${token0.symbol}`);
    }
    if (formattedBalance1 < amount1Desired) {
      throw new Error(`Insufficient balance ${token1.symbol}`);
    }

    // Check allowance
    const allowance0 = await getAllowence(
      token0.id,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`
    );
    if (allowance0 < amount0) {
      throw new Error(`Insufficient allowance for token ${token0.symbol}`);
    }
    const allowance1 = await getAllowence(
      token0.id,
      ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`
    );
    if (allowance1 < amount0) {
      throw new Error(`Insufficient allowance for token ${token1.symbol}`);
    }

    const token0Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token0.id,
      parseInt(token0.decimals),
      token0.symbol
    );
    const token1Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token1.id,
      parseInt(token1.decimals),
      token1.symbol
    );

    const poolInstance = new Pool(
      token0Instance,
      token1Instance,
      parseInt(pool.feeTier),
      pool.sqrtPrice.toString(),
      JSBI.BigInt(pool.liquidity.toString()),
      parseInt(pool.tick)
    );

    const positionToIncreaseBy = Position.fromAmounts({
      pool: poolInstance,
      tickLower: parseInt(tickLower.tickIdx),
      tickUpper: parseInt(tickUpper.tickIdx),
      amount0: amount0Desired,
      amount1: amount1Desired,
      useFullPrecision: true,
    });

    const addLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new STORYHUNT.Percent(50, 10_000), // 0.5%
      tokenId: position.id,
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      positionToIncreaseBy,
      addLiquidityOptions
    );

    const transaction = {
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    };
    const hash = await universalSendTransaction(walletClient, transaction);
    return hash;
  } catch (error) {
    console.error('Error in adding liquidity:', error);
    return error;
  }
};

export const removeLiquidityV3 = async (
  position: PositionData,
  percentageToRemove: number
) => {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }
    const { token0, token1, liquidity, tickLower, tickUpper, pool } = position;

    const token0Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token0.id,
      parseInt(token0.decimals),
      token0.symbol
    );
    const token1Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token1.id,
      parseInt(token1.decimals),
      token1.symbol
    );

    const poolInstance = new Pool(
      token0Instance,
      token1Instance,
      parseInt(pool.feeTier),
      pool.sqrtPrice.toString(),
      pool.liquidity.toString(),
      parseInt(pool.tick)
    );

    const positionSDK = new Position({
      pool: poolInstance,
      liquidity: JSBI.BigInt(liquidity.toString()),
      tickLower: parseInt(tickLower.tickIdx),
      tickUpper: parseInt(tickUpper.tickIdx),
    });

    const removeLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      slippageTolerance: new STORYHUNT.Percent(50, 10_000), // 0.5%
      tokenId: position.id,
      liquidityPercentage: new STORYHUNT.Percent(percentageToRemove, 100),
      collectOptions: {
        expectedCurrencyOwed0: STORYHUNT.CurrencyAmount.fromRawAmount(
          token0Instance,
          0
        ),
        expectedCurrencyOwed1: STORYHUNT.CurrencyAmount.fromRawAmount(
          token1Instance,
          0
        ),
        recipient: address,
      },
    };

    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
      positionSDK,
      removeLiquidityOptions
    );

    const transaction = {
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    };
    const hash = await universalSendTransaction(walletClient, transaction);
    return hash;
  } catch (error) {
    console.error('Error in removing liquidity:', error);
    return error;
  }
};

export const collectFeeV3 = async (position: PositionData) => {
  const walletClient = getWriteClient();
  const address = getAccountAddress();

  try {
    if (!address) {
      throw new Error('No connected address found');
    }
    const { token0, token1 } = position;

    const token0Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token0.id,
      parseInt(token0.decimals),
      token0.symbol
    );
    const token1Instance = new STORYHUNT.Token(
      ADDRESSES.CHAIN_ID,
      token1.id,
      parseInt(token1.decimals),
      token1.symbol
    );

    // Convert tokensOwed to raw amounts
    const amount0Raw = parseUnits(
      token0.feesUSD,
      parseInt(token0.decimals)
    ).toString();

    const amount1Raw = parseUnits(
      token1.feesUSD,
      parseInt(token1.decimals)
    ).toString();

    const collectOptions = {
      tokenId: position.id,
      expectedCurrencyOwed0: STORYHUNT.CurrencyAmount.fromRawAmount(
        token0Instance,
        JSBI.BigInt(amount0Raw)
      ),
      expectedCurrencyOwed1: STORYHUNT.CurrencyAmount.fromRawAmount(
        token1Instance,
        JSBI.BigInt(amount1Raw)
      ),
      recipient: address,
    };

    const { calldata, value } =
      NonfungiblePositionManager.collectCallParameters(collectOptions);

    const transaction = {
      to: ADDRESSES.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS as `0x${string}`,
      data: calldata as `0x${string}`,
      value: BigInt(value),
      gasLimit: BigInt(4000000),
      chain: defaultChain,
    };
    const hash = await universalSendTransaction(walletClient, transaction);
    return hash;
  } catch (error) {
    console.error('Error in removing liquidity:', error);
    return error;
  }
};
