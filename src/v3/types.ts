export interface GraphToken {
  id: string;
  symbol: string;
  decimals: string;
  name: string;
}

export interface GraphTick {
  poolAddress: string;
  liquidityGross: string;
  liquidityNet: string;
  tickIdx: string;
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

export interface TokenInfo {
  decimals: number;
  symbol: string;
  name: string;
}

export interface GasParams {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args: unknown[];
  value: bigint;
}