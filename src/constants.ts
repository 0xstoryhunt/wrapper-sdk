import { defineChain } from 'viem';
import { Fraction } from '@storyhunt/core';
import JSBI from 'jsbi';

/**
 * Defines the available blockchain networks and their configurations.
 *
 * @constant
 * @type {Object}
 * @property {Object} TESTNET - Configuration for the Story Iliad Testnet.
 * @property {Object} ODYSSEY - Configuration for the Story Odyssey Testnet.
 */
const chains = {
  TESTNET: defineChain({
    id: 1513,
    name: 'Story Iliad Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://testnet.storyrpc.io'],
      },
      public: {
        http: ['https://testnet.storyrpc.io'],
      },
    },
    blockExplorers: {
      default: {
        name: 'blockscout',
        url: 'https://testnet.storyscan.xyz',
      },
    },
    testnet: true,
  }),
  ODYSSEY: defineChain({
    id: 1516,
    name: 'Story Odyssey Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://odyssey.storyrpc.io'],
      },
      public: {
        http: ['https://odyssey.storyrpc.io'],
      },
    },
    blockExplorers: {
      default: {
        name: 'blockscout',
        url: 'https://odyssey-testnet-explorer.storyscan.xyz/',
      },
    },
    testnet: true,
  }),
};

/**
 * The default blockchain network configuration.
 *
 * @constant
 * @type {Object}
 */
export const defaultChain = chains['ODYSSEY'];

/**
 * The ID of the default blockchain network.
 *
 * @constant
 * @type {number}
 */
export const defaultChainId = defaultChain.id;

/**
 * Configuration for Story network addresses.
 *
 * @constant
 * @type {Object}
 * @property {Object} ODYSSEY - Configuration for the Story Odyssey Testnet.
 * @property {number} ODYSSEY.CHAIN_ID - Chain ID for the Odyssey Testnet.
 * @property {string} ODYSSEY.WIP - Address for the WIP token.
 * @property {Object} ODYSSEY.TOKENS - Token configurations.
 * @property {string} ODYSSEY.V2_POOL_FACTORY_CONTRACT_ADDRESS - Address for the V2 pool factory contract.
 * @property {string} ODYSSEY.V2_SWAP_ROUTER_CONTRACT_ADDRESS - Address for the V2 swap router contract.
 * @property {string} ODYSSEY.V3_POOL_FACTORY_CONTRACT_ADDRESS - Address for the V3 pool factory contract.
 * @property {string} ODYSSEY.V3_SWAP_ROUTER_CONTRACT_ADDRESS - Address for the V3 swap router contract.
 * @property {string} ODYSSEY.V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS - Address for the V3 non-fungible position manager.
 * @property {string} ODYSSEY.V3_MULTICALL_ADDRESS - Address for the V3 multicall contract.
 */
const ADDRESSES_CONFIG = {
  ODYSSEY: {
    CHAIN_ID: 1516,
    WIP: '0x1516000000000000000000000000000000000000',
    TOKENS: {
      IP: {
        id: '0x0000000000000000000000000000000000000000',
        name: 'IP',
        symbol: 'IP',
        decimals: 18,
      },
      WIP: {
        id: '0x1516000000000000000000000000000000000000',
        name: 'WIP',
        symbol: 'WIP',
        decimals: 18,
      },
      JUTSU: {
        id: '0x368525E90dfB4e6CF11d6E2037a2551A7212a4c0',
        name: 'Jutsu',
        symbol: 'JUTSU',
        decimals: 18,
      },
      vIP: {
        id: '0xCADC3EA1c18c40159c8A4163E6892bF04B9D6f0a',
        name: 'VerioIP',
        symbol: 'vIP',
        decimals: 18,
      },
      USDC: {
        id: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
      FATE: {
        id: '0x181c610790F508F281b48Ca29ddc1DFfff9B0D80',
        name: 'Farmer Are The Enemy',
        symbol: 'FATE',
        decimals: 18,
      },
    },
    //V2
    V2_POOL_FACTORY_CONTRACT_ADDRESS:
      '0x4773d28a8488eaB17907324455C8F8D9ea48A921',
    V2_SWAP_ROUTER_CONTRACT_ADDRESS:
      '0x144C047f7Be22EAB4BF78c77C1038b86923693CD',
    //V3
    V3_POOL_FACTORY_CONTRACT_ADDRESS:
      '0x2344C1448E528dD0e4094c92966A7f68f45aa4e4',
    V3_SWAP_ROUTER_CONTRACT_ADDRESS:
      '0x86f7b21076439629C1344d041f6ea08337b6a214',
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS:
      '0x858463Aa07756946c0E0B8e632BE4281f8E53cA4',
    V3_MULTICALL_ADDRESS: '0x532FB9e7bf3030194Fcd72d42184e51281D59DeB',
  },
  // TESTNET: {},
  // MAINNET: {},
};

/**
 * The addresses configuration for the default network.
 *
 * @constant
 * @type {Object}
 */
export const ADDRESSES = ADDRESSES_CONFIG['ODYSSEY'];

/**
 * Allowed price impact for warning states.
 *
 * @constant
 * @type {Fraction}
 */
export const ALLOWED_PRICE_IMPACT_LOW = new Fraction(
  JSBI.BigInt(100),
  JSBI.BigInt(10000)
);
export const ALLOWED_PRICE_IMPACT_MEDIUM = new Fraction(
  JSBI.BigInt(300),
  JSBI.BigInt(10000)
);
export const ALLOWED_PRICE_IMPACT_HIGH = new Fraction(
  JSBI.BigInt(500),
  JSBI.BigInt(10000)
);

/**
 * Subgraph URLs for different networks.
 *
 * @constant
 * @type {Object}
 * @property {string} TESTNET - Subgraph URL for the testnet.
 * @property {string} ODYSSEY - Subgraph URL for the Odyssey testnet.
 */
const SUBGRAPH_URLS = {
  TESTNET: '',
  ODYSSEY:
    'https://api.goldsky.com/api/public/project_cm3zj9u61wxu901wog58adpjp/subgraphs/storyhunt-odyssey-testnet/1.0.0/gn',
};

/**
 * The subgraph URL for the default network.
 *
 * @constant
 * @type {string}
 */
export const SUBGRAPH_URL = SUBGRAPH_URLS['ODYSSEY'];
