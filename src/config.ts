import { createPublicClient, createWalletClient, http, WalletClient, PublicClient, Address } from 'viem'
import { privateKeyToAccount, toAccount, type Account } from 'viem/accounts'
import { Signer } from 'ethers'
import { ADDRESSES_CONFIG, defaultChain } from './constants'
import { AnyVariables, createClient, DocumentInput, fetchExchange, Client } from 'urql'
import { SwapAlphaRouter } from '@storyhunt/smart-order-router'
import { ChainId } from '@storyhunt/sdk-core'

let publicClient: PublicClient | undefined
let walletClient: WalletClient | undefined
let ethersSigner: Signer | undefined
let accountAddress: string | undefined

let _graph_url: string = ''
let _graph_auth: string = ''
let _json_rpc: string = ''

let graphClient: Client | undefined
let _routerInstance: SwapAlphaRouter | undefined
let _chainId: ChainId | undefined

/**
 * Initialize clients for the SDK.
 *
 * @param options - Initialization options.
 * @param options.privateKey - Optional private key. If present, viem walletClient is used for writes.
 * @param options.ethersSigner - Optional ethers.js Signer. Used if no privateKey is provided.
 * @param options.graph_url - The subgraph URL.
 * @param options.graph_auth - The subgraph auth token.
 * @returns A promise that resolves when the clients are initialized.
 */
export async function initClient(options: {
  privateKey?: string
  ethersSigner?: Signer
  graph_url: string
  graph_auth: string
  chainId: ChainId
  jsonRPC: string
}): Promise<void> {
  const { privateKey, ethersSigner: signer, graph_url, graph_auth, chainId, jsonRPC } = options
  const chain = defaultChain

  // Set the graph parameters
  _graph_url = graph_url
  _graph_auth = graph_auth
  _chainId = chainId
  _json_rpc = jsonRPC

  // Initialize the public client
  publicClient = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  })

  // Initialize the write client (either via private key or ethers signer)
  if (privateKey) {
    const account: Account = privateKeyToAccount(privateKey as `0x${string}`)
    walletClient = createWalletClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
      account,
    })
    accountAddress = account.address.toLowerCase()
  } else if (signer) {
    ethersSigner = signer
    const address = await signer.getAddress()
    accountAddress = address.toLowerCase()
  } else {
    // Read-only: no write client available
    accountAddress = undefined
  }

  // Initialize the GraphQL client now that _graph_url is set
  graphClient = createClient({
    url: _graph_url,
    exchanges: [fetchExchange],
  })

  // Initialize the router instance with the updated graph parameters.
  // Use the environment variable if provided, or fall back to the default rpcUrl.
  _routerInstance = SwapAlphaRouter.getInstance(_json_rpc, { url: _graph_url, auth: _graph_auth }, _chainId)
}

/**
 * Returns the initialized public client for read operations.
 *
 * @returns The initialized PublicClient.
 * @throws If the public client is not initialized.
 */
export function getPublicClient(): PublicClient {
  if (!publicClient) {
    throw new Error('Public client not initialized. Call initClient first.')
  }
  return publicClient
}

/**
 * Returns a write-capable client.
 * If privateKey was given, returns viem walletClient.
 * If ethersSigner was provided (and no privateKey), returns the ethers Signer.
 *
 * @returns The write-capable client (WalletClient or Signer).
 * @throws If no write client is available.
 */
export function getWriteClient(): WalletClient | Signer {
  if (walletClient) return walletClient
  if (ethersSigner) return ethersSigner
  throw new Error('No write client available. Provide privateKey or ethersSigner in initClient.')
}

/**
 * Returns the address associated with the write client or undefined if none.
 *
 * @returns The account address or undefined.
 */
export function getAccountAddress(): string | undefined {
  return accountAddress
}

/**
 * Helper to safely get the account address as a viem-compatible Address type.
 *
 * @returns The account address as an Account type.
 */
export function getAccount(): Account {
  return toAccount(accountAddress as Address)
}

/**
 * Lazy getter for the GraphQL client.
 *
 * @returns The initialized GraphQL client.
 * @throws If the graph client is not initialized.
 */
export function getGraphClient(): Client {
  if (!graphClient) {
    if (!_graph_url) {
      throw new Error('Subgraph URL is not initialized. Call initClient first.')
    }
    graphClient = createClient({
      url: _graph_url,
      exchanges: [fetchExchange],
    })
  }
  return graphClient
}

/**
 * Execute a GraphQL query using the graph client.
 *
 * @param query - The GraphQL query to execute.
 * @param variables - Optional variables for the query.
 * @returns A promise that resolves with the query result.
 */
export async function executeGraphQuery<T>(query: DocumentInput<T, AnyVariables>, variables: Record<string, any> = {}) {
  return await getGraphClient().query<T>(query, variables, { requestPolicy: 'network-only' }).toPromise()
}

/**
 * Fetch multiple queries in batches.
 *
 * @param queries - List of query parameters (query and variables).
 * @param batchSize - Number of queries to fetch in each batch.
 * @param delayMs - Delay in milliseconds between batches.
 * @returns A promise that resolves with an array of results.
 */
export async function fetchInBatches(
  queries: {
    query: any
    variables: { [key: string]: any }
  }[],
  batchSize: number = 50,
  delayMs: number = 10000,
): Promise<{ query: any; variables: any; result: any }[]> {
  const results: { query: any; variables: any; result: any }[] = []

  for (let i = 0; i < Math.ceil(queries.length / batchSize); i += batchSize) {
    const batch = queries.slice(i, i + batchSize)

    // Fetch all queries in the current batch
    const batchResults = await Promise.all(
      batch.map(({ query, variables }) =>
        executeGraphQuery(query, variables).then((result) => ({ query, variables, result })),
      ),
    )

    results.push(...batchResults)

    // Delay before the next batch, if applicable
    if (i + batchSize < queries.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Lazy getter for the router instance.
 *
 * @returns The initialized SwapAlphaRouter instance.
 * @throws If the subgraph parameters are not initialized.
 */
export function getRouterInstance(): SwapAlphaRouter {
  if (!_routerInstance) {
    throw new Error('Router instance is not initialized. Call initClient first.')
  }
  return _routerInstance
}

/**
 * The addresses configuration for the default network.
 *
 * @constant
 * @type {Object}
 */
export function getAddressConfig() {
  if (!_chainId) {
    throw new Error('Chain ID is not initialized. Call initClient first.')
  }
  return ADDRESSES_CONFIG[_chainId]
}
