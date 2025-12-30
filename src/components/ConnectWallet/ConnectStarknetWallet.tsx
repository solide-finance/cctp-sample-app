import { useCallback, useState } from 'react'

import { Button, Fade, Menu, MenuItem } from '@mui/material'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'

import { getAddressAbbreviation } from 'utils'

const ConnectStarknetWallet = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleCopy = useCallback(async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
    }
    handleMenuClose()
  }, [address, handleMenuClose])

  const handleConnect = () => {
    // Try to connect with ArgentX first, fallback to first available
    const argentX = connectors.find((c) => c.id === 'argentX')
    const connector = argentX ?? connectors[0]

    if (connector !== undefined) {
      connect({ connector })
    }
  }

  const handleDisconnect = useCallback(() => {
    disconnect()
    handleMenuClose()
  }, [disconnect, handleMenuClose])

  return (
    <>
      {address && isConnected ? (
        <Button
          id="starknet-wallet-button"
          aria-controls={open ? 'starknet-wallet-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleMenuClick}
          variant="outlined"
        >
          {getAddressAbbreviation(address)}
        </Button>
      ) : (
        <Button onClick={handleConnect} variant="outlined">
          Connect Starknet
        </Button>
      )}
      <Menu
        id="starknet-wallet-menu"
        MenuListProps={{
          'aria-labelledby': 'starknet-wallet-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleCopy}>Copy Address</MenuItem>
        <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
      </Menu>
    </>
  )
}

export default ConnectStarknetWallet
