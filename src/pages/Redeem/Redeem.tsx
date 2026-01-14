import { useEffect, useState } from 'react'
import { createSearchParams, Link, useNavigate } from 'react-router-dom'

import { Button, Divider } from '@mui/material'

import RedeemComplete from 'components/Redeem/RedeemComplete'
import RedeemConfirmationDialog from 'components/Redeem/RedeemConfirmationDialog'
import RedeemForm from 'components/Redeem/RedeemForm'
import TransactionDialog from 'components/TransactionDialog/TransactionDialog'
import { TX_HASH_KEY } from 'constants/index'
import {
  TransactionStatus,
  TransactionType,
  useTransactionContext,
} from 'contexts/AppContext'
import { useQueryParam } from 'hooks/useQueryParam'
import { useTransactionPolling } from 'hooks/useTransactionPolling'

import type { Transaction } from 'contexts/AppContext'

function Redeem() {
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [activeTransaction, setActiveTransaction] = useState<
    Transaction | undefined
  >(undefined)
  const { txHash, transaction, setSearchParams } = useQueryParam()
  const { getTransaction } = useTransactionContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (transaction) {
      if (transaction.type === TransactionType.SEND) {
        if (
          transaction.status !== TransactionStatus.COMPLETE ||
          transaction.signature == null
        ) {
          navigate(
            {
              pathname: '/',
              search: createSearchParams({
                [TX_HASH_KEY]: txHash,
              }).toString(),
            },
            {
              replace: true,
            }
          )
        } else if (
          transaction.status === TransactionStatus.COMPLETE &&
          transaction.signature != null
        ) {
          if (transaction.nextHash == null) {
            setIsConfirmationDialogOpen(true)
          } else {
            setSearchParams(
              { [TX_HASH_KEY]: transaction.nextHash },
              { replace: true }
            )
          }
        }
      } else if (
        transaction.type === TransactionType.REDEEM &&
        transaction.status !== TransactionStatus.COMPLETE
      ) {
        setIsTransactionDialogOpen(true)
      }
    }
  }, [navigate, setSearchParams, transaction, txHash])

  const handleNext = (inputTxHash: string) => {
    setSearchParams({ [TX_HASH_KEY]: inputTxHash }, { replace: true })

    const tx = getTransaction(inputTxHash)

    if (tx) {
      setActiveTransaction(tx)

      if (tx.type === TransactionType.SEND) {
        if (
          tx.status === TransactionStatus.COMPLETE &&
          tx.signature != null &&
          tx.nextHash == null
        ) {
          setIsConfirmationDialogOpen(true)
        } else if (tx.nextHash != null) {
          setSearchParams({ [TX_HASH_KEY]: tx.nextHash }, { replace: true })
        }
      } else if (
        tx.type === TransactionType.REDEEM &&
        tx.status !== TransactionStatus.COMPLETE
      ) {
        setIsTransactionDialogOpen(true)
      }
    }
  }

  const handleConfirmation = (txHash: string) => {
    setSearchParams({ [TX_HASH_KEY]: txHash }, { replace: true })
    setIsConfirmationDialogOpen(false)
    setIsTransactionDialogOpen(true)
  }

  const handleComplete = () => {
    setIsTransactionDialogOpen(false)
  }

  const handleReturn = () => {
    navigate({
      pathname: '/',
    })
  }

  const { handleRedeemTransactionPolling } =
    useTransactionPolling(handleComplete)

  // Transaction to use for modals (prefer activeTransaction set by handleNext)
  const modalTransaction = activeTransaction ?? transaction

  return (
    <>
      <div className="item-center mx-auto flex max-w-4xl flex-col justify-center">
        {transaction &&
          transaction.type === TransactionType.REDEEM &&
          transaction.status === TransactionStatus.COMPLETE && (
            <RedeemComplete
              handleReturn={handleReturn}
              transaction={transaction}
            />
          )}

        {(transaction == null || transaction.type === TransactionType.SEND) && (
          <>
            <h1>Receive</h1>
            <p className="mt-8 text-center text-xl">
              Already sent? Type in the transaction hash below to continue.
            </p>
            <div className="m-24 flex flex-col">
              <RedeemForm handleNext={handleNext} transaction={transaction} />

              <Divider className="mt-12">OR</Divider>

              <Link to="/">
                <Button
                  className="mt-12"
                  color="secondary"
                  size="large"
                  fullWidth={true}
                >
                  RETURN TO TRANSFER
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {modalTransaction && isConfirmationDialogOpen && (
        <RedeemConfirmationDialog
          handleClose={() => {
            setIsConfirmationDialogOpen(false)
            setActiveTransaction(undefined)
          }}
          handleNext={handleConfirmation}
          open={isConfirmationDialogOpen}
          transaction={modalTransaction}
        />
      )}

      {modalTransaction && isTransactionDialogOpen && (
        <TransactionDialog
          handleTransactionPolling={handleRedeemTransactionPolling}
          open={isTransactionDialogOpen}
          transaction={modalTransaction}
        />
      )}
    </>
  )
}

export default Redeem
