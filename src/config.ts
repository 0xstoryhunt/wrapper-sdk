import {
  createPublicClient,
  createWalletClient,
  http,
  WalletClient,
  PublicClient,
  Address,
} from 'viem';
import { privateKeyToAccount, toAccount, type Account } from 'viem/accounts';
import { Signer } from 'ethers';
import { defaultChain, SUBGRAPH_URL } from './constants';
import { createClient, fetchExchange } from 'urql';

let publicClient: PublicClient | undefined;
let walletClient: WalletClient | undefined;
let ethersSigner: Signer | undefined;
let accountAddress: string | undefined;
let _graph_url: string | undefined;

/**
 * Initialize clients for the SDK.
 *
 * @param options - Initialization options.
 * @param options.privateKey - Optional private key. If present, viem walletClient is used for writes.
 * @param options.ethersSigner - Optional ethers.js Signer. Used if no privateKey is provided.
 * @returns A promise that resolves when the clients are initialized.
 */
export async function initClient(options: {
  privateKey?: string;
  ethersSigner?: Signer;
  graph_url: string;
}): Promise<void> {
  const { privateKey, ethersSigner: signer, graph_url } = options;
  const chain = defaultChain;
  _graph_url = graph_url ?? undefined;

  publicClient = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  if (privateKey) {
    const account: Account = privateKeyToAccount(privateKey as `0x${string}`);
    walletClient = createWalletClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
      account,
    });
    accountAddress = account.address.toLowerCase();
  } else if (signer) {
    ethersSigner = signer;
    const address = await signer.getAddress();
    accountAddress = address.toLowerCase();
  } else {
    // No privateKey or ethersSigner means read-only
    accountAddress = undefined;
  }
}

/**
 * Returns the initialized public client for read operations.
 *
 * @returns The initialized PublicClient.
 * @throws If the public client is not initialized.
 */
export function getPublicClient(): PublicClient {
  if (!publicClient) {
    throw new Error('Public client not initialized. Call initClients first.');
  }
  return publicClient;
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
  if (walletClient) return walletClient;
  if (ethersSigner) return ethersSigner;
  throw new Error(
    'No write client available. Provide privateKey or ethersSigner in initClients.'
  );
}

/**
 * Returns the address associated with the write client or undefined if none.
 *
 * @returns The account address or undefined.
 */
export function getAccountAddress(): string | undefined {
  return accountAddress;
}

/**
 * Helper to safely get the account address as a viem-compatible Address type.
 *
 * @returns The account address as an Account type.
 */
export function getAccount(): Account {
  return toAccount(accountAddress as Address);
}

/**
 * GraphQL client for interacting with the subgraph.
 */
export const graphClient = createClient({
  url: _graph_url || SUBGRAPH_URL,
  exchanges: [fetchExchange],
});

/**
 * Execute a GraphQL query using the graph client.
 *
 * @param query - The GraphQL query to execute.
 * @param variables - Optional variables for the query.
 * @returns A promise that resolves with the query result.
 */
export async function executeGraphQuery<T>(
  query: unknown,
  variables: Record<string, any> = {}
) {
  return await graphClient
    .query<T>(query, variables, { requestPolicy: 'network-only' })
    .toPromise();
}
