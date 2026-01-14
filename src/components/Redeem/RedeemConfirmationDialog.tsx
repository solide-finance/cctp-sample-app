import { useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import { LoadingButton } from '@mui/lab'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material'
import { useProvider } from '@starknet-react/core'
import { useWeb3React } from '@web3-react/core'
import { hexlify } from 'ethers/lib/utils'

import NetworkAlert from 'components/NetworkAlert/NetworkAlert'
import TransactionDetails from 'components/TransactionDetails/TransactionDetails'
import { CHAIN_TO_CHAIN_ID, isStarknetChain } from 'constants/chains'
import {
  TransactionStatus,
  TransactionType,
  useTransactionContext,
} from 'contexts/AppContext'
import useMessageTransmitter from 'hooks/useMessageTransmitter'
import useStarknetMessageTransmitter from 'hooks/useStarknetMessageTransmitter'
import { getMessageTransmitterV2ContractAddress } from 'utils/addresses'

import type { Web3Provider } from '@ethersproject/providers'
import type { SxProps } from '@mui/material'
import type { Chain } from 'constants/chains'
import type { Transaction } from 'contexts/AppContext'

interface Props {
  handleClose: () => void
  handleNext: (hash: string) => void
  open: boolean
  transaction: Transaction
  sx?: SxProps
}

const RedeemConfirmation: React.FC<Props> = ({
  handleClose,
  handleNext,
  open,
  transaction,
  sx = {},
}) => {
  // EVM hooks
  const { chainId } = useWeb3React<Web3Provider>()

  // Always use v2 MessageTransmitter since we use v2 contracts and v2 attestation API for all transfers
  const messageTransmitterAddress = getMessageTransmitterV2ContractAddress()
  const { receiveMessage } = useMessageTransmitter(
    chainId,
    messageTransmitterAddress
  )

  // Starknet hooks
  const { provider: starknetProvider } = useProvider()
  const { receiveMessage: starknetReceiveMessage } =
    useStarknetMessageTransmitter()

  const [isRedeeming, setIsRedeeming] = useState(false)
  const { addTransaction, setTransaction } = useTransactionContext()

  /**
   * Handle EVM mint/redeem
   */
  const handleEVMRedeem = async () => {
    const { messageBytes, signature } = transaction
    if (messageBytes == null || signature == null) {
      alert('Missing messageBytes and signature from transaction')
      return
    }

    // messageBytes can be either Bytes (from EVM source) or string (from Starknet v2 API)
    // Both are accepted by ethers.js contract methods
    const response = await receiveMessage(messageBytes, signature)
    if (!response) return

    const { hash } = response

    // Link redeem txHash to correlated send transaction
    const sendTx = {
      ...transaction,
      nextHash: hash,
    }
    setTransaction(transaction.hash, sendTx)

    // Add redeem transaction to store
    const redeemTx = {
      source: transaction.source,
      target: transaction.target,
      address: transaction.address,
      amount: transaction.amount,
      hash,
      type: TransactionType.REDEEM,
      status: TransactionStatus.PENDING,
    }
    addTransaction(hash, redeemTx)

    handleNext(hash)
  }

  /**
   * Handle Starknet mint/redeem
   */
  const handleStarknetRedeem = async () => {
    if (starknetProvider === undefined) {
      throw new Error('Starknet provider not available')
    }

    const { messageBytes, signature } = transaction
    if (messageBytes == null || signature == null) {
      alert('Missing messageBytes and signature from transaction')
      return
    }

    // Convert Bytes to hex string for Starknet
    const messageString =
      typeof messageBytes === 'string' ? messageBytes : hexlify(messageBytes)

    const response = await starknetReceiveMessage(messageString, signature)
    await starknetProvider.waitForTransaction(response.transaction_hash)

    // Link redeem txHash to send transaction
    const sendTx = { ...transaction, nextHash: response.transaction_hash }
    setTransaction(transaction.hash, sendTx)

    // Add redeem transaction
    const redeemTx = {
      source: transaction.source,
      target: transaction.target,
      address: transaction.address,
      amount: transaction.amount,
      hash: response.transaction_hash,
      type: TransactionType.REDEEM,
      status: TransactionStatus.PENDING,
    }
    addTransaction(response.transaction_hash, redeemTx)

    handleNext(response.transaction_hash)
  }

  /**
   * Main redeem handler - routes to EVM or Starknet
   */
  const handleRedeem = async () => {
    setIsRedeeming(true)
    try {
      // Route based on destination chain
      if (isStarknetChain(transaction.target as Chain)) {
        await handleStarknetRedeem()
      } else {
        await handleEVMRedeem()
      }
      setIsRedeeming(false)
    } catch (err) {
      console.error(err)
      setIsRedeeming(false)
    }
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth={true}
      onClose={handleClose}
      open={open}
      sx={sx}
    >
      <DialogTitle>Receive</DialogTitle>
      <DialogContentText className="mx-12">
        Confirm that you want to receive the following amount of USDC to the
        destination address shown below.
      </DialogContentText>
      <DialogContent>
        <TransactionDetails transaction={transaction} />

        <NetworkAlert className="mt-8" chain={transaction.target} />
      </DialogContent>

      <DialogActions className="mt-8">
        <Button size="large" color="secondary" onClick={handleClose}>
          BACK
        </Button>
        <LoadingButton
          size="large"
          loading={isRedeeming}
          disabled={
            isRedeeming ||
            (!isStarknetChain(transaction.target as Chain) &&
              CHAIN_TO_CHAIN_ID[transaction.target] !== chainId)
          }
          onClick={async () => await handleRedeem()}
        >
          RECEIVE
        </LoadingButton>
      </DialogActions>

      <IconButton className="absolute right-3 top-3" onClick={handleClose}>
        <CloseIcon />
      </IconButton>
    </Dialog>
  )
}

export default RedeemConfirmation
