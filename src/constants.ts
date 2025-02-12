import CONTRACTS from '@storyhunt/default-list/build/storyhunt-default.constantlist.json' assert { type: 'json' }
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

type AddressConfig = {
  [key in ChainId]: {
    CHAIN_ID: ChainId
    WIP: string
    TOKENS: {
      [key: string]: {
        id: string
        name: string
        symbol: string
        decimals: number
        derivedIP?: string | number
      }
    }
    V3_POOL_FACTORY_CONTRACT_ADDRESS: string
    V3_SWAP_ROUTER_CONTRACT_ADDRESS: string
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS: string
    V3_MULTICALL_ADDRESS: string
    V3_ALPHAHUNTER_ADDRESS: string
    FAUCET: string
    TOKEN_FACTORY: string
    STORY_BADGE_NFT_ADDRESS: string
  }
}

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
const ADDRESSES_CONFIG: AddressConfig = {
  [ChainId.ODYSSEY]: {
    CHAIN_ID: ChainId.ODYSSEY,
    WIP: '0x1516000000000000000000000000000000000000',
    TOKENS: {
      IP: {
        id: '0x0000000000000000000000000000000000000000',
        name: 'IP',
        symbol: 'IP',
        decimals: 18,
        derivedIP: 1,
      },
      WIP: {
        id: '0x1516000000000000000000000000000000000000',
        name: 'WIP',
        symbol: 'WIP',
        decimals: 18,
        derivedIP: 1,
      },
      USDC: {
        id: '0xf1815bd50389c46847f0bda824ec8da914045d14',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 18,
      },
    },
    V3_POOL_FACTORY_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.ODYSSEY].V3_FACTORY_CONTRACT.address,
    V3_SWAP_ROUTER_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.ODYSSEY].SWAP_ROUTER_CONTRACT.address,
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS: CONTRACTS.constants[ChainId.ODYSSEY].NFT_POSITION_MANAGER_CONTRACT.address,
    V3_MULTICALL_ADDRESS: CONTRACTS.constants[ChainId.ODYSSEY].MULTICALL2_CONTRACT.address,
    V3_ALPHAHUNTER_ADDRESS: CONTRACTS.constants[ChainId.ODYSSEY].ALPHA_HUNTER_CONTRACT.address,
    FAUCET: '0x9C730ef6016665C19f7290D3109f57D03037A4A7',
    TOKEN_FACTORY: '0x13Ae6e01a6eA736e0C070aeAB312764ded729CdA',
    STORY_BADGE_NFT_ADDRESS: '0x22c3772f45268A68470Db15f4F73EC0310Ecac85',
  },
  [ChainId.AENEID]: {
    CHAIN_ID: ChainId.AENEID,
    WIP: '0x1514000000000000000000000000000000000000',
    TOKENS: {
      IP: {
        id: '0x0000000000000000000000000000000000000000',
        name: 'IP',
        symbol: 'IP',
        decimals: 18,
        derivedIP: 1,
      },
      WIP: {
        id: '0x1514000000000000000000000000000000000000',
        name: 'WIP',
        symbol: 'WIP',
        decimals: 18,
      },
      USDC: {
        id: '0x8c7C52EabB0FCbcAeBCe2556D9A719d539EA02D8',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 18,
      },
    },
    V3_POOL_FACTORY_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.AENEID].V3_FACTORY_CONTRACT.address,
    V3_SWAP_ROUTER_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.AENEID].SWAP_ROUTER_CONTRACT.address,
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS: CONTRACTS.constants[ChainId.AENEID].NFT_POSITION_MANAGER_CONTRACT.address,
    V3_MULTICALL_ADDRESS: CONTRACTS.constants[ChainId.AENEID].MULTICALL2_CONTRACT.address,
    V3_ALPHAHUNTER_ADDRESS: CONTRACTS.constants[ChainId.AENEID].ALPHA_HUNTER_CONTRACT.address,
    FAUCET: '',
    TOKEN_FACTORY: '0x13Ae6e01a6eA736e0C070aeAB312764ded729CdA',
    STORY_BADGE_NFT_ADDRESS: '',
  },
  [ChainId.STORY]: {
    CHAIN_ID: ChainId.STORY,
    WIP: '0x1514000000000000000000000000000000000000',
    TOKENS: {
      IP: {
        id: '0x0000000000000000000000000000000000000000',
        name: 'IP',
        symbol: 'IP',
        decimals: 18,
        derivedIP: 1,
      },
      WIP: {
        id: '0x1514000000000000000000000000000000000000',
        name: 'WIP',
        symbol: 'WIP',
        decimals: 18,
      },
      USDC: {
        id: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 18,
      },
    },
    V3_POOL_FACTORY_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.STORY].V3_FACTORY_CONTRACT.address,
    V3_SWAP_ROUTER_CONTRACT_ADDRESS: CONTRACTS.constants[ChainId.STORY].SWAP_ROUTER_CONTRACT.address,
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS: CONTRACTS.constants[ChainId.STORY].NFT_POSITION_MANAGER_CONTRACT.address,
    V3_MULTICALL_ADDRESS: CONTRACTS.constants[ChainId.STORY].MULTICALL2_CONTRACT.address,
    V3_ALPHAHUNTER_ADDRESS: CONTRACTS.constants[ChainId.STORY].ALPHA_HUNTER_CONTRACT.address,
    FAUCET: '',
    TOKEN_FACTORY: '',
    STORY_BADGE_NFT_ADDRESS: '',
  },
}

/**
 * The addresses configuration for the default network.
 *
 * @constant
 * @type {Object}
 */
export const ADDRESSES = ADDRESSES_CONFIG[ChainId.STORY]

/**
 * Allowed price impact for warning states.
 *
 * @constant
 * @type {Fraction}
 */
export const ALLOWED_PRICE_IMPACT_LOW = new Fraction(JSBI.BigInt(100), JSBI.BigInt(10000))
export const ALLOWED_PRICE_IMPACT_MEDIUM = new Fraction(JSBI.BigInt(300), JSBI.BigInt(10000))
export const ALLOWED_PRICE_IMPACT_HIGH = new Fraction(JSBI.BigInt(500), JSBI.BigInt(10000))
