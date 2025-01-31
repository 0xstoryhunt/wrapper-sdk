import DEFAULT_ADDRESS_LIST from '@storyhunt/default-list/build/storyhunt-default.constantlist.json' assert { type: 'json' }
import { defineChain } from 'viem'
import { Fraction, ChainId } from '@storyhunt/sdk-core'
import JSBI from 'jsbi'

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
}

/**
 * The default blockchain network configuration.
 *
 * @constant
 * @type {Object}
 */
export const defaultChain = chains['ODYSSEY']

/**
 * The ID of the default blockchain network.
 *
 * @constant
 * @type {number}
 */
export const defaultChainId = defaultChain.id

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
    V2_POOL_FACTORY_CONTRACT_ADDRESS: '0x...',
    V2_SWAP_ROUTER_CONTRACT_ADDRESS: '0x...',
    //V3
    V3_POOL_FACTORY_CONTRACT_ADDRESS: DEFAULT_ADDRESS_LIST.constants[ChainId.ODYSSEY].V3_FACTORY_CONTRACT.address,
    V3_SWAP_ROUTER_CONTRACT_ADDRESS: DEFAULT_ADDRESS_LIST.constants[ChainId.ODYSSEY].SWAP_ROUTER_ADDRESS.address,
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS:
      DEFAULT_ADDRESS_LIST.constants[ChainId.ODYSSEY].NFT_POSITION_MANAGER_ADDRESS.address,
    V3_ALPHAHUNTER_ADDRESS: DEFAULT_ADDRESS_LIST.constants[ChainId.ODYSSEY].ALPHA_HUNTER_ADDRESS.address,
  },
  STORY: {
    CHAIN_ID: 1514,
    WIP: '0x1516000000000000000000000000000000000000',
  },
  // TESTNET: {},
  // MAINNET: {},
}

/**
 * The addresses configuration for the default network.
 *
 * @constant
 * @type {Object}
 */
export const ADDRESSES = ADDRESSES_CONFIG['ODYSSEY']

/**
 * Allowed price impact for warning states.
 *
 * @constant
 * @type {Fraction}
 */
export const ALLOWED_PRICE_IMPACT_LOW = new Fraction(JSBI.BigInt(100), JSBI.BigInt(10000))
export const ALLOWED_PRICE_IMPACT_MEDIUM = new Fraction(JSBI.BigInt(300), JSBI.BigInt(10000))
export const ALLOWED_PRICE_IMPACT_HIGH = new Fraction(JSBI.BigInt(500), JSBI.BigInt(10000))

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
  ODYSSEY: DEFAULT_ADDRESS_LIST.constants[ChainId.ODYSSEY].SUBGRAPH_URL.url,
}

/**
 * The subgraph URL for the default network.
 *
 * @constant
 * @type {string}
 */
export const SUBGRAPH_URL = SUBGRAPH_URLS['ODYSSEY']
