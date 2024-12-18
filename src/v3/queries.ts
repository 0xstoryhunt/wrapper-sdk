
// query top pools
export const POOL_QUERY = `
query Pools {
   pools(
      orderBy: liquidity
      orderDirection: desc
      where: {id_in: ["0x608258e86ddd9033e069a9711f34a062692f1fcb", "0x6ac5c6b3986639099a196731aaa2bd8e5e349482", "0xf46c615481b5b90a0f977447f977afba5597e384", "0xd9e66e963aba63b390ef69259b4c147c0a2ec189"]}
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

// query users pools
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
`


export const TOP_POOLS_QUERY = `
  query TopPools {
    pools(
      where: {id_in: ["0xd9e66e963aba63b390ef69259b4c147c0a2ec189", "0x6ac5c6b3986639099a196731aaa2bd8e5e349482", "0x608258e86ddd9033e069a9711f34a062692f1fcb", "0xf46c615481b5b90a0f977447f977afba5597e384"]}
    ) {
      id
      feeTier
      liquidity
      volumeToken0
      volumeToken1
      totalValueLockedToken0
      totalValueLockedToken1
      token0Price
      token1Price
      volumeUSD
      token0 {
        symbol
        id
      }
      token1 {
        symbol
        id
      }
    }
  }
`;