import { ChainId } from '@storyhunt/sdk-core'
import { initClient } from './config'
import { swapRouterV3 } from './v3/router'
import { zeroAddress } from 'viem'

const privateKey = '0x49abe57bd6711a7f0769c54b46ec3f767863369afd88b85fff2430f4ffca3997' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_url =
  'https://api.goldsky.com/api/public/project_cm3zj9u61wxu901wog58adpjp/subgraphs/mainnet/1.0.0-test/gn' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const subgraph_auth = 'cm71jl4tfgatz01s0hcxdf1ib' //process.env.TEST_PRIVATE_KEY as `0x${string}`
const jsonRPC = 'https://mainnet.storyrpc.io/'

async function run() {
  await initClient({ jsonRPC, privateKey, graph_url: subgraph_url, graph_auth: subgraph_auth, chainId: ChainId.STORY })
  const tokenIn = zeroAddress // WIP token
  const tokenOut = '0x49fe4cbb645cfe997465ca9f70f03dd9c58d1acf' // USDC token
  const amount = '0.0001' // 1 WIP

  const routes = await swapRouterV3(tokenIn, tokenOut, amount, true)
  console.log(routes)
}

run()
