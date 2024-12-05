import { SupportedChainId } from 'constants/chains'

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
 * Map of supported chains to Message Transmitter contract addresses
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
