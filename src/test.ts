import { ChainId } from '@storyhunt/sdk-core'
import { initClient, getAddressConfig } from './config'
import { swapRouterV3 } from './v3/router'

const privateKey = '0x49abe57bd6711a7f0769c54b46ec3f767863369afd88b85fff2430f4ffca3997' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_url =
  'https://api.goldsky.com/api/private/project_cm3zj9u61wxu901wog58adpjp/subgraphs/mainnet/1.0.0-test/gn' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_auth = 'cm71jl4tfgatz01s0hcxdf1ib' //process.env.TEST_PRIVATE_KEY as `0x${string}`

async function run() {
  await initClient({ privateKey, graph_url: subgraph_url, graph_auth: subgraph_auth, chainId: ChainId.STORY })
  const tokenIn = getAddressConfig().TOKENS.WIP.id // WIP token
  const tokenOut = '0xF1815bd50389c46847f0Bda824eC8da914045D14' // USDC token
  const amount = '1' // 1 WIP

  const routes = await swapRouterV3(tokenIn, tokenOut, amount, false)
  console.log(routes)
}

run()
