/**
 * GraphQL query to fetch the top 1000 pools ordered by liquidity in descending order.
 *
 * The query returns the following fields for each pool:
 * - id
 * - totalValueLockedToken0
 * - totalValueLockedToken1
 * - volumeToken0
 * - volumeToken1
 * - token0Price
 * - token1Price
 * - token0 (with id, symbol, decimals, name)
 * - token1 (with id, symbol, decimals, name)
 * - feeTier
 * - liquidity
 * - sqrtPrice
 * - createdAtTimestamp
 * - volumeUSD
 * - tick
 * - ticks (first 1000 with poolAddress, liquidityGross, liquidityNet, tickIdx)
 * - observationIndex
 * - feesUSD
 */
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
`

/**
 * GraphQL query to fetch pools using token IDs.
 *
 * @param token0 - The ID of the first token.
 * @param token1 - The ID of the second token.
 *
 * The query returns the following fields for each pool:
 * - id
 * - totalValueLockedToken0
 * - totalValueLockedToken1
 * - volumeToken0
 * - volumeToken1
 * - token0Price
 * - token1Price
 * - token0 (with id, symbol, decimals, name)
 * - token1 (with id, symbol, decimals, name)
 * - feeTier
 * - liquidity
 * - sqrtPrice
 * - createdAtTimestamp
 * - volumeUSD
 * - tick
 * - ticks (first 1000 with poolAddress, liquidityGross, liquidityNet, tickIdx)
 * - observationIndex
 * - feesUSD
 */
export const POOLWTOKEN_QUERY = `
query Pool($condition: [Pool_filter!]!) {
  pools(
    orderBy: liquidity
    orderDirection: desc
    where: {
        or: $condition
    }
    first: 1000
  ) {
    id
    totalValueLockedToken0
    totalValueLockedToken1
    volumeToken0
    volumeToken1
    token0Price
    token1Price
    token0 {
      id
      symbol
      decimals
      name
    }
    token1 {
      id
      symbol
      decimals
      name
    }
    feeTier
    liquidity
    sqrtPrice
    createdAtTimestamp
    volumeUSD
    tick
    ticks(first: 1000) {
      poolAddress
      liquidityGross
      liquidityNet
      tickIdx
    }
    observationIndex
    feesUSD
  }
}
`

/**
 * GraphQL query to fetch user positions based on user ID.
 *
 * @param userId - The ID of the user.
 *
 * The query returns the following fields for each position:
 * - id
 * - owner
 * - collectedFeesToken0
 * - collectedFeesToken1
 * - withdrawnToken0
 * - withdrawnToken1
 * - depositedToken0
 * - depositedToken1
 * - feeGrowthInside1LastX128
 * - feeGrowthInside0LastX128
 * - liquidity
 * - token0 (with various fields including decimals, feesUSD, name, id, poolCount, totalValueLocked, symbol, totalSupply, totalValueLockedUSD, totalValueLockedUSDUntracked, txCount, untrackedVolumeUSD, volumeUSD, volume, tokenDayData with high and low)
 * - token1 (with similar fields as token0)
 * - pool (with id, feeTier, liquidity, token0Price, token1Price, totalValueLockedToken0, totalValueLockedToken1, volumeToken0, volumeToken1, sqrtPrice, token0Price, token1Price, tick, ticks)
 * - tickLower (with id, liquidityNet, liquidityGross, poolAddress, price0, price1, tickIdx)
 * - tickUpper (with similar fields as tickLower)
 */
export const USER_POSITIONS_QUERY = `
  query MyQuery($userId: Bytes!) {
    positions(where: { owner: $userId }, orderBy: id, orderDirection: desc) {
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
`

/**
 * GraphQL query to fetch position data based on position ID and owner.
 *
 * @param positionId - The ID of the position.
 * @param owner - The owner of the position.
 *
 * The query returns the following fields for each position:
 * - id
 * - owner
 * - collectedFeesToken0
 * - collectedFeesToken1
 * - withdrawnToken0
 * - withdrawnToken1
 * - depositedToken0
 * - depositedToken1
 * - feeGrowthInside1LastX128
 * - feeGrowthInside0LastX128
 * - liquidity
 * - token0 (with various fields including decimals, feesUSD, name, id, poolCount, totalValueLocked, symbol, totalSupply, totalValueLockedUSD, totalValueLockedUSDUntracked, txCount, untrackedVolumeUSD, volumeUSD, volume, tokenDayData with high and low)
 * - token1 (with similar fields as token0)
 * - pool (with id, feeTier, liquidity, token0Price, token1Price, totalValueLockedToken0, totalValueLockedToken1, volumeToken0, volumeToken1, sqrtPrice, token0Price, token1Price, tick, ticks)
 * - tickLower (with id, liquidityNet, liquidityGross, poolAddress, price0, price1, tickIdx)
 * - tickUpper (with similar fields as tickLower)
 */
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
`

/**
 * GraphQL query to fetch a token and its neighbours.
 *
 * This query retrieves a token by its ID and fetches up to 1000 neighbouring tokens.
 * For each neighbouring token, it retrieves the ID and the total value locked.
 *
 * @constant
 * @type {string}
 * @param {ID!} tokenId - The unique identifier of the token.
 * @returns {Object} token - The token object.
 * @returns {ID} token.id - The unique identifier of the token.
 * @returns {Array} token.neighbour - The list of neighbouring tokens.
 * @returns {ID} token.neighbour.id - The unique identifier of the neighbouring token.
 * @returns {number} token.neighbour.totalValueLocked - The total value locked in the neighbouring token.
 */
export const TOKEN_NEIGHBOUR_QUERY = `
query Token($tokenId: ID!) {
  token(id: $tokenId) {
    id
    neighbour(first: 1000) {
      id
      totalValueLocked
    }
  }
}
`
