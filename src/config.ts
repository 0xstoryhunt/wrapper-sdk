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
import { defaultChain } from './constants';

let publicClient: PublicClient | undefined;
let walletClient: WalletClient | undefined;
let ethersSigner: Signer | undefined;
let accountAddress: string | undefined;

/**
 * Initialize clients for the SDK.
 *
 * @param options.chain - Chain configuration.
 * @param options.privateKey - Optional private key. If present, viem walletClient is used for writes.
 * @param options.ethersSigner - Optional ethers.js Signer. Used if no privateKey is provided.
 */
export async function initClient(options: {
  privateKey?: string;
  ethersSigner?: Signer;
}): Promise<void> {
  const { privateKey, ethersSigner: signer } = options;
  const chain = defaultChain;

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
 */
export function getAccountAddress(): string | undefined {
  return accountAddress;
}

/**
 * Helper to safely get the account address as a viem-compatible Address type.
 */
export function getAccount(): Account {
  return toAccount(accountAddress as Address);
}
