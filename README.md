# StoryHunt SDK Documentation

# Overview

The `@storyhunt/wrapper-sdk` provides tools to interact with StoryHunt V3-like functionality on the Story Odyssey Testnet. It enables:

- Finding liquidity routes and executing token swaps on StoryHunt V3 pools.
- Approving tokens for the V3 Swap Router or Non-Fungible Position Manager.
- Adding liquidity to V3 pools with customizable price ranges.
- Managing token balances, allowances, and other utilities.

All functions, types, and constants can be accessed by importing from `@storyhunt/wrapper-sdk`.

This SDK works in Node.js and browser environments, provided the necessary environment variables and credentials are set.

# Getting Started

## Installation

```bash
yarn add @storyhunt/wrapper-sdk
```

or

```bash
npm install @storyhunt/wrapper-sdk
```

# Initialization

Before using any of the routing or swap functions, you must initialize the SDK using `initClient`.

**Requirements**:

- **Private Key or ethers Signer**:
  - you can provide either `privateKey` as `0xstring` or `ethersSigner` as `Signer` to proceed with write operations.
  - If neither is provided, the SDK is read-only (for example, for routing and pool queries).

### Example Initialization

```tsx
import { initClient, defaultChain } from '@storyhunt/wrapper-sdk';

// Option A: Using Private Key (loaded from environment, for example)
await initClient({
  privateKey: process.env.TEST_PRIVATE_KEY,
});

// Option B: Using ethers Signer
const provider = new ethers.JsonRpcProvider(defaultChain);
const signer = new ethers.Wallet('0xYourPrivateKey', provider);
await initClient({ ethersSigner: signer });

console.log('SDK initialized!');
```

Once `initClient` is called, the SDK’s internal clients are ready for use by other functions.

---

# Routing

**Function**: `swapRouterV3(tokenIn: string, tokenOut: string, amount: bigint, exactIn: boolean)`

Finds the best liquidity route between two tokens, returning an array of **`Trade<TInput, TOutput, TTradeType>`** if successful, or an `Error` if no route is found.

- **`tokenIn`/`tokenOut`**: Token addresses. Use `WIP` address if IP (native) is desired.
- **`amount`**: A `bigint` representing the amount of tokens.
- **`exactIn`**: A boolean indicating whether this is an EXACT_INPUT or EXACT_OUTPUT trade.

**Example**:

```tsx
import { swapRouterV3, ADDRESSES } from '@storyhunt/wrapper-sdk';

async function findRoute() {
  const routes = await swapRouterV3(
    ADDRESSES.TOKENS.WIP.id,
    ADDRESSES.TOKENS.USDC.id,
    10n ** 15n,
    true
  );
  if (routes instanceof Error) {
    console.error('Error finding routes:', routes.message);
    return;
  }
  console.log('Available trades:', routes);
}
```

**Returns**:

- **`Trade<TInput, TOutput, TTradeType>**[]` if routes are found, containing details of possible swap paths.
- `Error` if routing fails.

# Swapping

**Function**: `swapV3(trade: **Trade<TInput, TOutput, TTradeType>**)`

Executes a swap transaction given a trade object obtained from `swapRouterV3`.

- **`trade`**: A `Trade` object representing the best route and amounts for the swap.

**Example**:

```tsx
import { swapV3 } from '@storyhunt/wrapper-sdk';

// Assuming you have a Trade object from swapRouterV3
async function executeSwap(
  trade: Trade<STORYHUNT.Token, STORYHUNT.Token, STORYHUNT.TradeType>
) {
  const txHash = await swapV3(trade);
  console.log('Swap executed, txHash:', txHash);
}
```

**Returns**:

- Transaction hash of the swap if successful.
- Throws an error if the swap cannot be executed.

# Adding Liquidity

**Function**: `addLiquidityV3(params: {   token1_address:` 0x${string}`,   token2_address:` 0x${string}`,   amount1: bigint,   amount2: bigint,   amount1Min: bigint,   amount2Min: bigint,   tickLower: number,   tickUpper: number,   expire_time: bigint })`

Allows adding liquidity to a StoryHunt V3 pool with a specified price range:

- **`token1_address`/`token2_address`**: The token addresses for the two assets you’re adding. Use `WIP` for IP (native) deposits.
- **`amount1`/`amount2`**: The amounts of tokens to deposit.
- **`amount1Min`/`amount2Min`**: The minimum amounts to deposit, ensuring slippage tolerance.
- **`tickLower`/`tickUpper`**: Defines the price range. `1.0001^(tickLower)` and `1.0001^(tickUpper)` determine the minimum and maximum price boundaries.
- **`expire_time`**: A timestamp after which the liquidity addition is no longer valid.

**Example**:

```tsx
import { addLiquidityV3, ADDRESSES } from '@storyhunt/wrapper-sdk';

async function provideLiquidity() {
  const txHash = await addLiquidityV3({
    token1_address: ADDRESSES.TOKENS.WIP.id,
    token2_address: ADDRESSES.TOKENS.USDC.id,
    amount1: 10n ** 18n,
    amount2: 500n * 10n ** 6n,
    amount1Min: 9n ** 17n,
    amount2Min: 450n * 10n ** 6n,
    tickLower: -60000,
    tickUpper: 60000,
    expire_time: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  });
  console.log('Liquidity added, txHash:', txHash);
}
```

# Removing Liquidity

**Function**: `removeLiquidityV3( params : {token1_address: string, token2_address: string, tokenId: number, liquidity: bigint, amount1Min: bigint, amount2Min: bigint, expire_time: bigint} )`

Removes liquidity from a position in a V3 pool.

- `token1_address`/`token2_address`: The tokens of the position. Use WIP if IP is involved.
- `tokenId`: The ID of the liquidity position (NFT) you want to remove liquidity from.
- `liquidity`: The amount of liquidity to remove, as a `bigint`.
- `amount1Min`/`amount2Min`: Minimum token amounts to ensure you get enough tokens back.
- `expire_time`: A timestamp after which the liquidity removal is invalid.

**Example**:

```tsx
import { removeLiquidityV3, ADDRESSES } from '@storyhunt/wrapper-sdk';

async function withdrawLiquidity() {
  const txHash = await removeLiquidityV3(
    ADDRESSES.TOKENS.WIP.id,
    ADDRESSES.TOKENS.USDC.id,
    12345,        // tokenId
    1000000n,     // liquidity amount
    900000n,      // minimum amount of token1 returned
    450000*(10n**6n), // minimum amount of token2 returned
    BigInt(Math.floor(Date.now() / 1000) + 3600) // expiry
  );
  console.log('Liquidity removed, txHash:', txHash);

```

# Approvals

To conduct swaps or add liquidity, you may need to approve tokens for specific contracts.

### V3 Swap Router Approval

**Function**: `v3RoutertokenApproval(token: string, amount?: bigint)`

Approves the V3 Swap Router to spend your tokens. Defaults to `MaxUint256` for unlimited approval if `amount` is not provided.

**Example**:

```tsx
import { v3RoutertokenApproval, ADDRESSES } from '@storyhunt/wrapper-sdk';

await v3RoutertokenApproval(ADDRESSES.TOKENS.USDC.id);
console.log('USDC approved for V3 Router!');
```

### V3 Non-Fungible Position Manager Approval

**Function**: `v3PositionManagertokenApproval(token: string, amount?: bigint)`

Approves the Non-Fungible Position Manager to spend your tokens. Defaults to `MaxUint256` if `amount` is not provided.

**Example**:

```tsx
import { v3PositionManagertokenApproval, ADDRESSES } from '@storyhunt/wrapper-sdk';

await v3PositionManagertokenApproval(ADDRESSES.TOKENS.WIP.id);
console.log('WIP approved for Non-Fungible Position Manager!');
```

# Utilities

The SDK provides various utility functions for token balances, allowances, gas estimation, and token info. All utilities adapt to the configured clients and work seamlessly with viem or ethers signers.

- **`estimateGasCost(gasParams, gasPercentage?)`**: Estimates the gas required for a transaction and can optionally pad it by a percentage.
- **`getAllowence(token, spender)`**: Retrieves the allowance granted to `spender` for the specified `token`.
- **`getTokenBalance(token?)`**: Fetches the balance of a token for the connected account. If `token` is omitted, returns the native IP (via WIP) balance.
- **`getTokenInfo(address)`**: Fetches the decimals, symbol, and name of an ERC-20 token.

**Example**:

```tsx
import {
  getTokenBalance,
  getTokenInfo,
  estimateGasCost,
  getAllowence,
} from '@storyhunt/wrapper-sdk';

const balance = await getTokenBalance();
console.log('Native token balance:', balance.value.toString());

const info = await getTokenInfo(ADDRESSES.TOKENS.FATE.id);
console.log(`FATE: ${info.symbol} (${info.name}), decimals: ${info.decimals}`);

const allowance = await getAllowence(
  ADDRESSES.TOKENS.USDC.id,
  ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS
);
console.log('USDC allowance for V3 Router:', allowance.toString());

const gas = await estimateGasCost({
  address: ADDRESSES.V3_SWAP_ROUTER_CONTRACT_ADDRESS,
  abi: [], // Provide ABI for the function you’re calling
  functionName: 'someFunction',
  args: [],
});
console.log('Estimated gas:', gas?.toString());
```

## Constants and Addresses

`ADDRESSES` and `defaultChain` are available from `constants.ts`. `ADDRESSES` provides contract addresses for Odyssey Testnet, including token addresses and essential StoryHunt V3 contracts:

- `ADDRESSES.TOKENS.IP` and `ADDRESSES.TOKENS.WIP` represent the native IP token and its wrapped version (WIP).
- Additional tokens: `JUTSU`, `vIP`, `USDC`, `FATE`.

You can use these addresses directly when calling functions that require token or contract addresses.

## Types

The SDK leverages types from the StoryHunt [V3 SDK](https://www.npmjs.com/package/@storyhunt/v3-sdk) and [CORE SDK](https://www.npmjs.com/package/@storyhunt/core). Commonly used types include:

- **`Trade<TInput, TOutput, TTradeType>`**: Represents a trade route between two tokens.
  - `TInput` and `TOutput` are token types, typically `STORYHUNT.Token` (aliased from `@StoryHunt/sdk-core`) representing ERC-20 tokens or wrapped native tokens.
  - `TTradeType` can be `TradeType.EXACT_INPUT` or `TradeType.EXACT_OUTPUT`, indicating whether you know the exact input or output token amount.
- **`Token`**: Represents a token with properties like `address`, `decimals`, `symbol`, and `name`.
- **`Route`**: Represents a path of pools and tokens through which a swap can be executed.
- **`Pool`**: Represents a StoryHunt V3 pool with its state, including `token0`, `token1`, fee tier, and liquidity data.

All these types ensure type-safe interactions with pools, routes, and trades.
