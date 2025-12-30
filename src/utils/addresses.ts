import * as testnet from 'constants/addresses'

import type { SupportedChainId } from 'constants/chains'

export const getUSDCContractAddress = (chainId?: SupportedChainId): string => {
  if (chainId == null) {
    return ''
  }
  return testnet.CHAIN_IDS_TO_USDC_ADDRESSES[chainId]
}

export const getTokenMessengerContractAddress = (
  chainId?: SupportedChainId
): string => {
  if (chainId == null) {
    return ''
  }
  return testnet.CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES[chainId]
}

export const getMessageTransmitterContractAddress = (
  chainId?: SupportedChainId
): string => {
  if (chainId == null) {
    return ''
  }
  return testnet.CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[chainId]
}

/**
 * Get CCTP v2 MessageTransmitter address (same on all EVM chains)
 * Used for redeeming messages from Starknet which uses CCTP v2
 */
export const getMessageTransmitterV2ContractAddress = (): string => {
  return testnet.MESSAGE_TRANSMITTER_V2_ADDRESS
}

/**
 * Get CCTP v2 TokenMessenger address (same on all EVM chains)
 * Used for sending to Starknet which only supports CCTP v2
 */
export const getTokenMessengerV2ContractAddress = (): string => {
  return testnet.TOKEN_MESSENGER_V2_ADDRESS
}
