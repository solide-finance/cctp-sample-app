import { useCallback } from 'react'

import { Contract } from '@ethersproject/contracts'
import { useWeb3React } from '@web3-react/core'

import { addressToBytes32 } from 'utils'
import { getTokenMessengerV2ContractAddress } from 'utils/addresses'

import type {
  TransactionResponse,
  Web3Provider,
} from '@ethersproject/providers'
import type { DestinationDomain } from 'constants/chains'
import type { BigNumber } from 'ethers'

// Minimal ABI for TokenMessengerV2 depositForBurn
const TOKEN_MESSENGER_V2_ABI = [
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) external returns (uint64 nonce)',
]

/**
 * Hook for CCTP v2 TokenMessenger contract
 * Required for sending to Starknet (which only supports CCTP v2)
 */
const useTokenMessengerV2 = () => {
  const { library } = useWeb3React<Web3Provider>()

  const TOKEN_MESSENGER_V2_ADDRESS = getTokenMessengerV2ContractAddress()

  /**
   * Deposit for burn using CCTP v2
   * @param amount the amount to burn
   * @param destinationDomain Circle domain ID of target chain
   * @param mintRecipient recipient address on target chain
   * @param burnToken address of token to burn
   * @param destinationCaller optional caller restriction (0 for any)
   * @param maxFee max fee for fast transfer (0 for standard)
   * @param minFinalityThreshold 1000 for fast, 2000 for standard
   */
  const depositForBurnV2 = useCallback(
    async (
      amount: BigNumber,
      destinationDomain: DestinationDomain,
      mintRecipient: string,
      burnToken: string,
      destinationCaller = '0x0000000000000000000000000000000000000000000000000000000000000000',
      maxFee: BigNumber | number = 0,
      minFinalityThreshold = 0 // 0 for standard (free) transfer
    ) => {
      if (!library) return
      const contract = new Contract(
        TOKEN_MESSENGER_V2_ADDRESS,
        TOKEN_MESSENGER_V2_ABI,
        library.getSigner()
      )

      // Convert destinationCaller to bytes32 if it's an address (20 bytes)
      const callerBytes32 =
        destinationCaller.length === 42
          ? addressToBytes32(destinationCaller)
          : destinationCaller

      const response: TransactionResponse = await contract.depositForBurn(
        amount,
        destinationDomain,
        addressToBytes32(mintRecipient),
        burnToken,
        callerBytes32,
        maxFee,
        minFinalityThreshold
      )
      return response
    },
    [TOKEN_MESSENGER_V2_ADDRESS, library]
  )

  return {
    depositForBurnV2,
  }
}

export default useTokenMessengerV2
