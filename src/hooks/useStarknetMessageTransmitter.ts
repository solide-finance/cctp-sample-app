import { useCallback } from 'react'

import { useAccount } from '@starknet-react/core'
import { CallData } from 'starknet'

import { STARKNET_MESSAGE_TRANSMITTER_ADDRESS } from 'constants/addresses'
import { hexToByteArray } from 'utils/starknetAddressConversion'

/**
 * Returns methods to call the Starknet Message Transmitter contract
 * Following StarkGate pattern with starknet.js v5
 */
const useStarknetMessageTransmitter = () => {
  const { account } = useAccount()

  /**
   * Receive a cross-chain message on Starknet to mint USDC
   * @param message the message bytes from the burn transaction (hex string)
   * @param attestation the attestation from Circle's API (hex string)
   */
  const receiveMessage = useCallback(
    async (message: string, attestation: string) => {
      if (!account) {
        throw new Error('Starknet wallet not connected')
      }

      // Convert hex strings to Starknet ByteArray format
      // ByteArray = { data: Array<bytes31>, pending_word: felt252, pending_word_len: u32 }
      const messageByteArray = hexToByteArray(message)
      const attestationByteArray = hexToByteArray(attestation)

      // Compile calldata with ByteArray structures
      const calldata = CallData.compile({
        message: messageByteArray,
        attestation: attestationByteArray,
      })

      const transaction = {
        contractAddress: STARKNET_MESSAGE_TRANSMITTER_ADDRESS,
        entrypoint: 'receive_message',
        calldata,
      }

      try {
        return await account.execute([transaction])
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Starknet receiveMessage failed: ${error.message}`)
        }
        throw new Error('Starknet receiveMessage failed')
      }
    },
    [account]
  )

  return {
    receiveMessage,
  }
}

export default useStarknetMessageTransmitter
