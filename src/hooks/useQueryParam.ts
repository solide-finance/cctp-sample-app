import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { TX_HASH_KEY } from 'constants/index'
import { useTransactionContext } from 'contexts/AppContext'

import type { Transaction } from 'contexts/AppContext'

export function useQueryParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { getTransaction } = useTransactionContext()

  const txHash: string = useMemo(() => {
    const paramTxHash = searchParams.get(TX_HASH_KEY)
    if (paramTxHash != null) {
      return paramTxHash
    }
    return ''
  }, [searchParams])

  const transaction: Transaction | undefined = useMemo(
    () => getTransaction(txHash),
    [getTransaction, txHash]
  )

  return {
    txHash,
    transaction,
    searchParams,
    setSearchParams,
  }
}
