import { defineChain } from 'viem';
import { createConfig, http } from '@wagmi/core';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { Fraction } from '@uniswap/sdk-core';
import JSBI from 'jsbi';

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

export const defaultChain = chains['ODYSSEY'];
export const defaultChainId = defaultChain.id;
export const config = createConfig({
  chains: [defaultChain],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'StoryHunt',
        url: 'https://app.storyhunt.xyz',
        iconUrl: 'https://app.storyhunt.xyz/icons/storyhunt-logo.svg',
        base64Icon:
          'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MyIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQzIDQ4IiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMzYuOTcwOCAxNi42OTc3QzMwLjMwNDIgMTIuODQ4NSAzNS4wODQyIDQuODIzNzUgMzkuNzQ4NCAwTDE1LjAwMjkgMjUuNTkyM0MxMy45MzM0IDI2LjY5ODQgMTIuMjQ4NCAyNi45MzQ3IDEwLjkxNTkgMjYuMTY1NEM3LjkzNzggMjQuNDQ2IDYuOTE3NDQgMjAuNjM3OSA4LjYzNjg0IDE3LjY1OThMOS40ODU5MSAxNi4xODkxQzExLjA0NiAxMy40ODcgMTQuMzI1NyAxMi4zOTY2IDE3LjE0NDcgMTMuNTAyMUwyNi4zMjA0IDQuMDEyNEMyNC45Njg1IDUuNDEwNiAyMS43NzQ0IDcuOTIzOTMgMTkuODEzNiA2Ljc5MTg0QzE0LjM5ODggMy42NjU2NCA3LjQ3NTA2IDUuNTIwODYgNC4zNDg4NiAxMC45MzU2TDEuNTE4NjEgMTUuODM3N0MtMS42MDc1OSAyMS4yNTI1IDAuMjQ3NjQgMjguMTc2MiA1LjY2MjM3IDMxLjMwMjRDMTIuMzI5MyAzNS4xNTE2IDcuNTQ5MDcgNDMuMTc2NCAyLjg4NDkyIDQ4TDI3LjYzMDQgMjIuNDA3OEMyOC43IDIxLjMwMTcgMzAuMzg0OSAyMS4wNjU0IDMxLjcxNzQgMjEuODM0OEMzNC42OTU2IDIzLjU1NDIgMzUuNzE1OSAyNy4zNjIyIDMzLjk5NjUgMzAuMzQwNEwzMy4xNDc1IDMxLjgxMUMzMS41ODc0IDM0LjUxMzEgMjguMzA3OCAzNS42MDM2IDI1LjQ4ODYgMzQuNDk4MUwxNi4zMTMgNDMuOTg3NkMxNy42NjQ5IDQyLjU4OTQgMjAuODU4OSA0MC4wNzYyIDIyLjgxOTggNDEuMjA4M0MyOC4yMzQ1IDQ0LjMzNDYgMzUuMTU4NCA0Mi40NzkzIDM4LjI4NDQgMzcuMDY0NUw0MS4xMTQ2IDMyLjE2MjNDNDQuMjQwOSAyNi43NDc3IDQyLjM4NTcgMTkuODIzOSAzNi45NzA4IDE2LjY5NzdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      },
    }),
    coinbaseWallet({
      chainId: defaultChain.id,
      appName: 'StoryHunt Dex',
    }),
  ],
  //@ts-ignore
  transports: {
    [defaultChainId]: http(defaultChain.rpcUrls.default.http[0]),
  },
  ssr: false,
});

// Story network addresses
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
      '0x5a1EA26393723DCE9cdC56F6D8863f3F2c14103B',
    V3_SWAP_ROUTER_CONTRACT_ADDRESS:
      '0x00f5CA33A50bDd487C15485Ab175f881efE90964',
    V3_NONFUNGIBLE_POSITION_MANAGER_ADDRESS:
      '0x2f2Cb39bdB6701d4BA0a72b759eDB0E229d46b2c',
    V3_MULTICALL_ADDRESS: '0xeB87a968ccEE611B5cB6C393bCAF0233904F89Da',
    FAUCET: '0x9C730ef6016665C19f7290D3109f57D03037A4A7',
    TOKEN_FACTORY: '0x13Ae6e01a6eA736e0C070aeAB312764ded729CdA',
    STORY_BADGE_NFT_ADDRESS: '0x22c3772f45268A68470Db15f4F73EC0310Ecac85',
    V3_STAKER_ADDRESS: '0x1DDF0a3CA6226834f7087F99df16231ADA9e1C67',
  },
  // TESTNET: {},
  // MAINNET: {},
};

export const ADDRESSES = ADDRESSES_CONFIG['ODYSSEY'];

// Used for warning states
export const ALLOWED_PRICE_IMPACT_LOW = new Fraction(
  JSBI.BigInt(100),
  JSBI.BigInt(10000)
); //1%
//3%
export const ALLOWED_PRICE_IMPACT_MEDIUM = new Fraction(
  JSBI.BigInt(300),
  JSBI.BigInt(10000)
);
//5%
export const ALLOWED_PRICE_IMPACT_HIGH = new Fraction(
  JSBI.BigInt(500),
  JSBI.BigInt(10000)
);

// Subgraph URLs
const SUBGRAPH_URLS = {
  TESTNET: '',
  ODYSSEY:
    'https://api.goldsky.com/api/public/project_cm3zj9u61wxu901wog58adpjp/subgraphs/storyhunt-odyssey-testnet/1.0.0/gn',
};

export const SUBGRAPH_URL = SUBGRAPH_URLS['ODYSSEY'];
