import { useCallback } from 'react'

import { useAccount } from '@starknet-react/core'
import { CallData, uint256 } from 'starknet'

import { STARKNET_TOKEN_MESSENGER_ADDRESS } from 'constants/addresses'
import { convertEvmAddressToU256 } from 'utils/starknetAddressConversion'

import type { DestinationDomain } from 'constants/chains'

/**
 * Returns methods to call the Starknet Token Messenger contract
 * Following StarkGate pattern with starknet.js v5
 */
const useStarknetTokenMessenger = () => {
  const { account } = useAccount()

  /**
   * Deposit USDC for burn on Starknet to mint on destination chain
   * @param amount the amount to be deposited for burn (as string in smallest units)
   * @param destinationDomain the Circle defined ID of target chain
   * @param mintRecipient the recipient address on target chain (EVM or Starknet)
   * @param burnToken the address of token to burn (USDC on Starknet)
   * @param destinationCaller the address allowed to call receiveMessage (or '0' for unrestricted)
   * @param isDestinationEVM whether the destination is an EVM chain
   * @param maxFee maximum fee for fast transfer (0 for free/standard)
   * @param minFinalityThreshold 1000 for fast, 2000 for standard/free
   */
  const depositForBurn = useCallback(
    async (
      amount: string,
      destinationDomain: DestinationDomain,
      mintRecipient: string,
      burnToken: string,
      destinationCaller: string,
      isDestinationEVM = true,
      maxFee = '0',
      minFinalityThreshold = 2000
    ) => {
      if (!account) {
        throw new Error('Starknet wallet not connected')
      }

      const recipientU256 = isDestinationEVM
        ? convertEvmAddressToU256(mintRecipient)
        : mintRecipient

      const callerU256 = isDestinationEVM
        ? convertEvmAddressToU256(destinationCaller)
        : destinationCaller

      const calldata = CallData.compile({
        amount: uint256.bnToUint256(amount),
        destination_domain: destinationDomain,
        mint_recipient: uint256.bnToUint256(recipientU256),
        burn_token: burnToken,
        destination_caller: uint256.bnToUint256(callerU256),
        max_fee: uint256.bnToUint256(maxFee),
        min_finality_threshold: minFinalityThreshold,
      })

      const transaction = {
        contractAddress: STARKNET_TOKEN_MESSENGER_ADDRESS,
        entrypoint: 'deposit_for_burn',
        calldata,
      }

      try {
        return await account.execute([transaction])
      } catch (error: unknown) {
        throw new Error(
          `Starknet deposit_for_burn failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    },
    [account]
  )

  return {
    depositForBurn,
  }
}

export default useStarknetTokenMessenger
