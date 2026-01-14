import { useState } from 'react'

import { useProvider } from '@starknet-react/core'

import { DestinationDomain, isStarknetChain } from 'constants/chains'
import { DEFAULT_API_DELAY, DEFAULT_BLOCKCHAIN_DELAY } from 'constants/index'
import { TransactionStatus, useTransactionContext } from 'contexts/AppContext'
import { useQueryParam } from 'hooks/useQueryParam'
import useTransaction from 'hooks/useTransaction'
import {
  AttestationStatus,
  getAttestationV2,
} from 'services/attestationService'
import { getMessageBytesFromEventLogs, getMessageHashFromBytes } from 'utils'

import type { Chain } from 'constants/chains'
import type { Transaction } from 'contexts/AppContext'
import type { Bytes } from 'ethers'

interface HandleTransactionReceiptPollingParams {
  messageBytes: Bytes
  messageHash: string
}

export function useTransactionPolling(handleComplete: () => void) {
  const { getTransactionReceipt } = useTransaction()
  const { provider: starknetProvider } = useProvider()
  const { setTransaction } = useTransactionContext()
  const { txHash, transaction } = useQueryParam()
  const [signature, setSignature] = useState(transaction?.signature)

  const handleTransactionReceiptPolling = (
    handleSuccess: (params?: HandleTransactionReceiptPollingParams) => void,
    hash: string,
    messageType?: string
  ) => {
    // Polling transaction receipt until status = 1
    const interval = setInterval(async () => {
      const transactionReceipt = await getTransactionReceipt(hash)
      if (transactionReceipt != null) {
        const { status, logs } = transactionReceipt

        // Success
        if (status === 1) {
          clearInterval(interval)

          if (messageType) {
            // decode log to get messageBytes
            const messageBytes = getMessageBytesFromEventLogs(logs, messageType)
            // hash the message bytes
            const messageHash = getMessageHashFromBytes(messageBytes)

            return handleSuccess({ messageBytes, messageHash })
          } else {
            return handleSuccess()
          }
        }
      }
    }, DEFAULT_BLOCKCHAIN_DELAY)

    return () => clearInterval(interval)
  }

  const handleApproveAllowanceTransactionReceiptPolling = (hash: string) => {
    if (hash) {
      const handleSuccess = () => {
        return handleComplete()
      }
      return handleTransactionReceiptPolling(handleSuccess, hash)
    }
  }

  const handleSendTransactionReceiptPolling = () => {
    if (transaction) {
      const handleSuccess = (
        params?: HandleTransactionReceiptPollingParams
      ) => {
        if (params) {
          const { messageBytes, messageHash } = params
          const newTransaction: Transaction = {
            ...transaction,
            status: TransactionStatus.COMPLETE,
            messageBytes,
            messageHash,
          }
          setTransaction(txHash, newTransaction)

          return handleAttestationPolling()
        }
      }
      return handleTransactionReceiptPolling(
        handleSuccess,
        txHash,
        'MessageSent(bytes)'
      )
    }
  }

  const handleRedeemTransactionReceiptPolling = () => {
    if (transaction) {
      const handleSuccess = () => {
        const newTransaction: Transaction = {
          ...transaction,
          status: TransactionStatus.COMPLETE,
        }
        setTransaction(txHash, newTransaction)

        return handleComplete()
      }
      return handleTransactionReceiptPolling(handleSuccess, txHash)
    }
  }

  /**
   * Poll Starknet transaction receipt for redeem completion
   */
  const handleStarknetRedeemTransactionReceiptPolling = () => {
    if (transaction == null || starknetProvider == null) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const receipt = await starknetProvider.getTransactionReceipt(txHash)
        // Starknet receipt status can be: 'PENDING', 'ACCEPTED_ON_L2', 'ACCEPTED_ON_L1', 'REJECTED'
        const status = receipt.status
        const finalityStatus = (receipt as { finality_status?: string })
          .finality_status
        if (
          status === 'ACCEPTED_ON_L2' ||
          status === 'ACCEPTED_ON_L1' ||
          finalityStatus === 'ACCEPTED_ON_L2' ||
          finalityStatus === 'ACCEPTED_ON_L1'
        ) {
          clearInterval(interval)

          const newTransaction: Transaction = {
            ...transaction,
            status: TransactionStatus.COMPLETE,
          }
          setTransaction(txHash, newTransaction)

          return handleComplete()
        }
      } catch (error) {
        // Transaction might not be indexed yet, continue polling
      }
    }, DEFAULT_BLOCKCHAIN_DELAY)

    return () => clearInterval(interval)
  }

  const handleAttestationPolling = () => {
    if (txHash && transaction) {
      // Always use CCTP v2 API since we use v2 contracts for all transfers
      // v2 API is transaction hash-based and works with all chains
      const sourceDomain = DestinationDomain[transaction.source as Chain]

      const interval = setInterval(async () => {
        const attestation = await getAttestationV2(txHash, sourceDomain)
        if (attestation != null) {
          const { status, message, messageBytes } = attestation

          // Success
          if (status === AttestationStatus.complete && message !== null) {
            const newTransaction: Transaction = {
              ...transaction,
              signature: message,
              messageBytes: messageBytes ?? transaction.messageBytes,
            }
            setTransaction(txHash, newTransaction)
            setSignature(message)

            handleComplete()
            clearInterval(interval)
          }
        }
      }, DEFAULT_API_DELAY)

      return () => clearInterval(interval)
    }
  }

  const handleApproveAllowanceTransactionPolling = (hash: string) => {
    return handleApproveAllowanceTransactionReceiptPolling(hash)
  }

  const handleSendTransactionPolling = () => {
    if (txHash && transaction?.status !== TransactionStatus.COMPLETE) {
      // Poll send transaction receipt for messageBytes and messageHash
      return handleSendTransactionReceiptPolling()
    } else if (
      txHash &&
      transaction?.status === TransactionStatus.COMPLETE &&
      !signature
    ) {
      // Poll attestation service for signature
      return handleAttestationPolling()
    }
  }

  const handleRedeemTransactionPolling = () => {
    // Poll redeem transaction receipt for completion
    if (
      txHash &&
      transaction &&
      transaction.status !== TransactionStatus.COMPLETE
    ) {
      // Use Starknet-specific polling when destination is Starknet
      if (isStarknetChain(transaction.target as Chain)) {
        return handleStarknetRedeemTransactionReceiptPolling()
      }
      return handleRedeemTransactionReceiptPolling()
    }
  }

  return {
    handleApproveAllowanceTransactionPolling,
    handleSendTransactionPolling,
    handleRedeemTransactionPolling,
  }
}
