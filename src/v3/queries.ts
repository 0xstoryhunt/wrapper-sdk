// query top pools
export const POOL_QUERY = `
query Pools {
  pools(
     first: 1000
     orderBy: liquidity
     orderDirection: desc
   ) {
   id
   totalValueLockedToken0
   totalValueLockedToken1
   volumeToken0
   volumeToken1
   token0Price
   token1Price
   token0{id symbol decimals name}
   token1{id symbol decimals name}
   feeTier
   liquidity
   sqrtPrice
   createdAtTimestamp
   volumeUSD
   tick
   ticks(first: 1000) {poolAddress liquidityGross liquidityNet tickIdx }
   observationIndex
   feesUSD
 }
}
`;

//2. query using tokens
export const POOLWTOKEN_QUERY = `
query Pool($token0: ID!, $token1: ID!) {
  pools(where: {token0_: {id_in: [$token0, $token1]} token1_: {id_in: [$token0, $token1]}}) {
    id
    totalValueLockedToken0
    totalValueLockedToken1
    volumeToken0
    volumeToken1
    token0Price
    token1Price
    token0{id symbol decimals name}
    token1{id symbol decimals name}
    feeTier
    liquidity
    sqrtPrice
    createdAtTimestamp
    volumeUSD
    tick
    ticks(first: 1000) {poolAddress liquidityGross liquidityNet tickIdx }
    observationIndex
    feesUSD
  }
}
`;

// query users position
export const USER_POSITIONS_QUERY = `
  query MyQuery($userId: Bytes!) {
    positions(where: { owner: $userId }, orderBy: liquidity, orderDirection: desc) {
      id
      owner
      collectedFeesToken0
      collectedFeesToken1
      withdrawnToken0
      withdrawnToken1
      depositedToken0
      depositedToken1
      feeGrowthInside1LastX128
      feeGrowthInside0LastX128
      liquidity
      token0 {
        decimals
        feesUSD
        derivedETH
        name
        id
        poolCount
        totalValueLocked
        symbol
        totalSupply
        totalValueLockedUSD
        totalValueLockedUSDUntracked
        txCount
        untrackedVolumeUSD
        volumeUSD
        volume
        tokenDayData {
          high
          low
        }
      }
      token1 {
        decimals
        feesUSD
        derivedETH
        name
        id
        poolCount
        totalValueLocked
        symbol
        totalSupply
        totalValueLockedUSD
        totalValueLockedUSDUntracked
        txCount
        untrackedVolumeUSD
        volumeUSD
        volume
      }
     
       pool {
        id
        feeTier
        liquidity
        token0Price
        token1Price
        totalValueLockedToken0
        totalValueLockedToken1
        volumeToken0
        volumeToken1
        sqrtPrice
        token0Price
        token1Price
        tick
        ticks
      }
      tickLower {
        id
        liquidityNet
        liquidityGross
        poolAddress
        price0
        price1
        tickIdx
      }
      tickUpper {
        id
        liquidityNet
        liquidityGross
        poolAddress
        price0
        price1
        tickIdx
      }
    }
  }
`;

// query position data
export const POSITIONS_QUERY = `
query MyQuery($positionId: ID!, $owner: Bytes!) {
  positions(where: {id: $positionId, owner: $owner}){
    id
      owner
      collectedFeesToken0
      collectedFeesToken1
      withdrawnToken0
      withdrawnToken1
      depositedToken0
      depositedToken1
      feeGrowthInside1LastX128
      feeGrowthInside0LastX128
      liquidity
      token0 {
        decimals
        feesUSD
        derivedETH
        name
        id
        poolCount
        totalValueLocked
        symbol
        totalSupply
        totalValueLockedUSD
        totalValueLockedUSDUntracked
        txCount
        untrackedVolumeUSD
        volumeUSD
        volume
        tokenDayData {
          high
          low
        }
      }
      token1 {
        decimals
        feesUSD
        derivedETH
        name
        id
        poolCount
        totalValueLocked
        symbol
        totalSupply
        totalValueLockedUSD
        totalValueLockedUSDUntracked
        txCount
        untrackedVolumeUSD
        volumeUSD
        volume
      }
     
       pool {
        id
        feeTier
        liquidity
        token0Price
        token1Price
        totalValueLockedToken0
        totalValueLockedToken1
        volumeToken0
        volumeToken1
        sqrtPrice
        token0Price
        token1Price
        tick
        ticks {
          id
        }
      }
      tickLower {
        id
        liquidityNet
        liquidityGross
        poolAddress
        price0
        price1
        tickIdx
      }
      tickUpper {
        id
        liquidityNet
        liquidityGross
        poolAddress
        price0
        price1
        tickIdx
      }
}
}
`;
