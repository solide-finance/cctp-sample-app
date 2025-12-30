import { Chain, SupportedChainId } from 'constants/chains'

/**
 * Map of supported chains to USDC contract addresses
 */
export const CHAIN_IDS_TO_USDC_ADDRESSES = {
  [SupportedChainId.ETH_MAINNET]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [SupportedChainId.AVAX_MAINNET]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  [SupportedChainId.ARB_MAINNET]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [SupportedChainId.POLYGON_MAINNET]:
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [SupportedChainId.OPTIMISM_MAINNET]:
    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  [SupportedChainId.BASE_MAINNET]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

/**
 * Map of supported chains to Token Messenger contract addresses
 */
export const CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES = {
  [SupportedChainId.ETH_MAINNET]: '0xbd3fa81b58ba92a82136038b25adec7066af3155',
  [SupportedChainId.AVAX_MAINNET]: '0x6b25532e1060ce10cc3b0a99e5683b91bfde6982',
  [SupportedChainId.ARB_MAINNET]: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
  [SupportedChainId.POLYGON_MAINNET]:
    '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
  [SupportedChainId.OPTIMISM_MAINNET]:
    '0x2B4069517957735bE00ceE0fadAE88a26365528f',
  [SupportedChainId.BASE_MAINNET]: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
}

/**
 * Map of supported chains to Message Transmitter contract addresses (CCTP v1)
 */
export const CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES = {
  [SupportedChainId.ETH_MAINNET]: '0x0a992d191deec32afe36203ad87d7d289a738f81',
  [SupportedChainId.AVAX_MAINNET]: '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
  [SupportedChainId.ARB_MAINNET]: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
  [SupportedChainId.POLYGON_MAINNET]:
    '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
  [SupportedChainId.OPTIMISM_MAINNET]:
    '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
  [SupportedChainId.BASE_MAINNET]: '0xAD09780d193884d503182aD4588450C416D6F9D4',
}

/**
 * CCTP v2 contract addresses (same across all EVM chains via CREATE2)
 * Required for transfers to/from Starknet (which uses CCTP v2)
 */
export const MESSAGE_TRANSMITTER_V2_ADDRESS =
  '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64'

export const TOKEN_MESSENGER_V2_ADDRESS =
  '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d'

/**
 * Starknet Contract Addresses
 */
export const STARKNET_USDC_ADDRESS =
  '0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb'

export const STARKNET_TOKEN_MESSENGER_ADDRESS =
  '0x07d421B9cA8aA32DF259965cDA8ACb93F7599F69209A41872AE84638B2A20F2a'

export const STARKNET_MESSAGE_TRANSMITTER_ADDRESS =
  '0x02EBB5777B6dD8B26ea11D68Fdf1D2c85cD2099335328Be845a28c77A8AEf183'

/**
 * Get USDC address for a chain
 */
export const getUSDCAddress = (chain: Chain): string | undefined => {
  if (chain === Chain.STARKNET) {
    return STARKNET_USDC_ADDRESS
  }
  const chainId = getChainIdForChain(chain)
  return chainId ? CHAIN_IDS_TO_USDC_ADDRESSES[chainId] : undefined
}

/**
 * Get TokenMessenger address for a chain
 */
export const getTokenMessengerAddress = (chain: Chain): string | undefined => {
  if (chain === Chain.STARKNET) {
    return STARKNET_TOKEN_MESSENGER_ADDRESS
  }
  const chainId = getChainIdForChain(chain)
  return chainId ? CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES[chainId] : undefined
}

/**
 * Get MessageTransmitter address for a chain
 */
export const getMessageTransmitterAddress = (
  chain: Chain
): string | undefined => {
  if (chain === Chain.STARKNET) {
    return STARKNET_MESSAGE_TRANSMITTER_ADDRESS
  }
  const chainId = getChainIdForChain(chain)
  return chainId
    ? CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[chainId]
    : undefined
}

/**
 * Helper to get chain ID for a Chain enum (EVM only)
 */
const getChainIdForChain = (chain: Chain): SupportedChainId | undefined => {
  switch (chain) {
    case Chain.ETH:
      return SupportedChainId.ETH_MAINNET
    case Chain.AVAX:
      return SupportedChainId.AVAX_MAINNET
    case Chain.ARB:
      return SupportedChainId.ARB_MAINNET
    case Chain.POLYGON:
      return SupportedChainId.POLYGON_MAINNET
    case Chain.OPTIMISM:
      return SupportedChainId.OPTIMISM_MAINNET
    case Chain.BASE:
      return SupportedChainId.BASE_MAINNET
    default:
      return undefined
  }
}
