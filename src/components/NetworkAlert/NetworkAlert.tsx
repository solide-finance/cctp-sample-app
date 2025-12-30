import { Alert, Button } from '@mui/material'
import { useWeb3React } from '@web3-react/core'

import { CHAIN_TO_CHAIN_ID, isStarknetChain } from 'constants/chains'
import useSwitchNetwork from 'hooks/useSwitchNetwork'

import type { Web3Provider } from '@ethersproject/providers'
import type { Chain } from 'constants/chains'

interface Props {
  chain: string
  className?: string
}

const NetworkAlert: React.FC<Props> = ({ chain, className }) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { switchNetwork } = useSwitchNetwork(chain)

  // Skip network check for Starknet chains (no EVM chainId validation needed)
  if (isStarknetChain(chain as Chain)) {
    return null
  }

  if (chainId != null && CHAIN_TO_CHAIN_ID[chain] !== chainId) {
    return (
      <Alert
        className={className}
        severity="error"
        action={
          <Button size="small" onClick={async () => await switchNetwork()}>
            Switch
          </Button>
        }
      >
        Source chain and selected network in wallet must be the same
      </Alert>
    )
  }
  return null
}

export default NetworkAlert
