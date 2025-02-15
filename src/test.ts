import { ChainId } from '@storyhunt/sdk-core'
import { initClient } from './config'
import { swapRouterV3 } from './v3/router'
import { zeroAddress } from 'viem'
import { routeAmountsToString } from '@storyhunt/smart-order-router'
import { swapV3 } from './v3/swap'

const privateKey = '' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_url = '' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_auth = '' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const jsonRPC = 'https://mainnet.storyrpc.io/'

async function run() {
  await initClient({
    jsonRPC,
    privateKey,
    graph_url: subgraph_url,
    graph_auth: subgraph_auth,
    chainId: ChainId.STORY,
  })
  const tokenIn = zeroAddress // WIP token
  const tokenOut = '0xF1815bd50389c46847f0Bda824eC8da914045D14' // USDC token
  const amount = '0.0001' // 1 WIP

  const data = await swapRouterV3(tokenIn, tokenOut, amount, true, 50, Date.now() + 1000 * 60 * 10) // 0.05% slippage, 10 minutes deadline

  if (data instanceof Error) {
    console.error(`Error in swap:`, data.message)
    return
  }
  const {
    blockNumber,
    estimatedGasUsed,
    estimatedGasUsedQuoteToken,
    estimatedGasUsedUSD,
    gasPriceWei,
    methodParameters,
    quote,
    quoteGasAdjusted,
    route: routeAmounts,
  } = data
  console.log(`Best Route:`)
  console.log(`${routeAmountsToString(routeAmounts)}`)

  console.log(`\tRaw Quote`)
  console.log(`\t\t${quote.toFixed(2)}`)
  console.log(`\tGas Adjusted Quote:`)
  console.log(`\t\t${quoteGasAdjusted.toFixed(2)}`)
  console.log(``)
  console.log(`Gas Used Quote Token: ${estimatedGasUsedQuoteToken.toFixed(6)}`)
  console.log(`Gas Used USD: ${estimatedGasUsedUSD.toFixed(6)}`)
  console.log(`Calldata: ${methodParameters?.calldata}`)
  console.log(`Value: ${methodParameters?.value}`)
  console.log({
    blockNumber: blockNumber.toString(),
    estimatedGasUsed: estimatedGasUsed.toString(),
    gasPriceWei: gasPriceWei.toString(),
  })

  const hash = await swapV3(data)
  console.log(`Transaction Hash: ${hash}`)
}

run()
