/**
 * List of all the chains/networks supported
 */
export enum Chain {
  ETH = 'ETH',
  AVAX = 'AVAX',
  ARB = 'ARB',
  POLYGON = 'POLYGON',
  OPTIMISM = 'OPTIMISM',
  BASE = 'BASE',
}

/**
 * List of all the chain/network IDs supported
 */
export enum SupportedChainId {
  ETH_MAINNET = 1,
  AVAX_MAINNET = 43114,
  ARB_MAINNET = 42161,
  POLYGON_MAINNET = 137,
  OPTIMISM_MAINNET = 10,
  BASE_MAINNET = 8453,
}

/**
 * List of all the chain/network IDs supported in hexadecimals
 * TODO: Infer from SupportedChainId
 */
export const SupportedChainIdHex = {
  ETH_MAINNET: '0x1',
  AVAX_MAINNET: '0xa86a',
  ARB_MAINNET: '0xa4b1',
  POLYGON_MAINNET: '0x89',
  OPTIMISM_MAINNET: '0xa',
  BASE_MAINNET: '0x2105',
}

interface ChainToChainIdMap {
  [key: string]: number
}

/**
 * Maps a chain to it's chain ID
 */

export const CHAIN_TO_CHAIN_ID: ChainToChainIdMap = {
  [Chain.ETH]: SupportedChainId.ETH_MAINNET,
  [Chain.AVAX]: SupportedChainId.AVAX_MAINNET,
  [Chain.ARB]: SupportedChainId.ARB_MAINNET,
  [Chain.POLYGON]: SupportedChainId.POLYGON_MAINNET,
  [Chain.OPTIMISM]: SupportedChainId.OPTIMISM_MAINNET,
  [Chain.BASE]: SupportedChainId.BASE_MAINNET,
}

interface ChainToChainNameMap {
  [key: string]: string
}

/**
 * Maps a chain to it's readable name
 */
export const CHAIN_TO_CHAIN_NAME: ChainToChainNameMap = {
  ETH: 'Ethereum',
  AVAX: 'Avalanche',
  ARB: 'Arbitrum',
  POLYGON: 'Polygon',
  OPTIMISM: 'Optimism',
  BASE: 'Base',
}

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === 'number') as SupportedChainId[]

/**
 * List of Circle-defined IDs referring to specific domains
 */
export enum DestinationDomain {
  ETH = 0,
  AVAX = 1,
  OPTIMISM = 2,
  ARB = 3,
  BASE = 6,
  POLYGON = 7,
}

// https://eips.ethereum.org/EIPS/eip-3085
interface AddEthereumChainParameter {
  chainId: string
  blockExplorerUrls?: string[]
  chainName?: string
  iconUrls?: string[]
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls?: string[]
}

const ETH_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.ETH_MAINNET,
  blockExplorerUrls: ['https://etherscan.io'],
  chainName: 'Ethereum Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://eth-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

const AVAX_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.AVAX_MAINNET,
  blockExplorerUrls: ['https://snowtrace.io'],
  chainName: 'Avalanche C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: [
    'https://avax-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

const ARB_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.ARB_MAINNET,
  blockExplorerUrls: ['https://arbiscan.io'],
  chainName: 'Arbitrum One',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://arb-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

const OPTIMISM_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.OPTIMISM_MAINNET,
  blockExplorerUrls: ['https://optimistic.etherscan.io'],
  chainName: 'OP Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://opt-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

const BASE_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.BASE_MAINNET,
  blockExplorerUrls: ['https://basescan.org'],
  chainName: 'Base Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://base-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

const POLYGON_MAINNET: AddEthereumChainParameter = {
  chainId: SupportedChainIdHex.POLYGON_MAINNET,
  blockExplorerUrls: ['https://polygonscan.com'],
  chainName: 'Polygon PoS Mainnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-mainnet.g.alchemy.com/v2/-fydhMX-MTYdL17T0UbbPYMfoz3mydMa',
  ],
}

interface ChainIdToChainParameters {
  [key: string]: AddEthereumChainParameter
}

export const CHAIN_ID_HEXES_TO_PARAMETERS: ChainIdToChainParameters = {
  [SupportedChainIdHex.ETH_MAINNET]: ETH_MAINNET,
  [SupportedChainIdHex.AVAX_MAINNET]: AVAX_MAINNET,
  [SupportedChainIdHex.ARB_MAINNET]: ARB_MAINNET,
  [SupportedChainIdHex.POLYGON_MAINNET]: POLYGON_MAINNET,
  [SupportedChainIdHex.OPTIMISM_MAINNET]: OPTIMISM_MAINNET,
  [SupportedChainIdHex.BASE_MAINNET]: BASE_MAINNET,
}
