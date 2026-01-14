import { useCallback } from 'react'

import { useAccount } from '@starknet-react/core'
import { CallData, uint256 } from 'starknet'

/**
 * Returns method to approve USDC spending on Starknet
 * Following StarkGate pattern with starknet.js v5
 */
const useStarknetTokenApproval = (
  tokenAddress: string,
  spenderAddress: string
) => {
  const { account } = useAccount()

  /**
   * Approve a spender to spend USDC tokens
   * @param amount the amount to approve (as string in smallest units)
   */
  const approve = useCallback(
    async (amount: string) => {
      if (!account) {
        throw new Error('Starknet wallet not connected')
      }

      const approveAmount = uint256.bnToUint256(amount)

      const calldata = CallData.compile({
        spender: spenderAddress,
        amount: approveAmount,
      })

      const transaction = {
        contractAddress: tokenAddress,
        entrypoint: 'approve',
        calldata,
      }

      try {
        const response = await account.execute([transaction])

        return {
          response,
          hash: response.transaction_hash,
        }
      } catch (error: unknown) {
        throw new Error(
          `Starknet approve failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    },
    [account, tokenAddress, spenderAddress]
  )

  return {
    approve,
  }
}

export default useStarknetTokenApproval
