import JSBI from 'jsbi';

export interface GraphToken {
  id: string;
  symbol: string;
  decimals: string;
  name: string;
}

export interface GraphTick {
  id: string;
  poolAddress: string;
  liquidityGross: string;
  liquidityNet: string;
  tickIdx: string;
  price0: string;
  price1: string;
}

export interface GraphPool {
  id: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  volumeToken0: string;
  volumeToken1: string;
  token0Price: string;
  token1Price: string;
  token0: GraphToken;
  token1: GraphToken;
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  createdAtTimestamp: string;
  volumeUSD: string;
  tick: string;
  ticks: GraphTick[];
  observationIndex: string;
  feesUSD: string;
}

export interface GraphPoolResponse {
  pools: GraphPool[];
}

interface Token {
  decimals: string;
  feesUSD: string;
  derivedETH: string;
  name: string;
  id: string;
  poolCount: string;
  totalValueLocked: string;
  symbol: string;
  totalSupply: string;
  totalValueLockedUSD: string;
  totalValueLockedUSDUntracked: string;
  txCount: string;
  untrackedVolumeUSD: string;
  volumeUSD: string;
  volume: string;
  tokenDayData: TokenDayData[];
}

interface TokenDayData {
  high: string;
  low: string;
}

export interface PositionData {
  id: string;
  owner: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  depositedToken0: string;
  depositedToken1: string;
  feeGrowthInside1LastX128: string;
  feeGrowthInside0LastX128: string;
  liquidity: string;
  token0: Token;
  token1: Token;
  pool: GraphPool;
  tickLower: GraphTick;
  tickUpper: GraphTick;
}

export interface GraphPositionResponse {
  pools: GraphPool[];
}
export interface TokenInfo {
  decimals: number;
  symbol: string;
  name: string;
  address: string;
}

export interface PoolInfo {
  fee: number;
  state: {
    state: { sqrtPriceX96: number };
    tick: number;
    sqrtPriceX96: number;
  };
  liquidity: JSBI;
  tick: number;
  ticks: unknown;
  sqrtPriceX96: JSBI;
}

export interface GasParams {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args: unknown[];
  value: bigint;
}
