import { useCallback, useState } from 'react'
import { baseSepoliaDeployment, demoTokens } from '@ammora/contract-config'
import { baseSepolia } from '@reown/appkit/networks'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import type { Address, Hash } from 'viem'
import { ammoraPairAbi, ammoraRouterAbi, demoTokenAbi } from '../contracts/abis'
import type { AmmoraPoolState } from './useAmmoraPool'

export type TransactionStatus = {
  tone: 'idle' | 'pending' | 'success' | 'error'
  message: string
  hash?: Hash
}

const initialStatus: TransactionStatus = { tone: 'idle', message: '' }

function readableError(error: unknown): string {
  if (!(error instanceof Error)) return 'The wallet could not complete this request.'
  const match = error.message.match(/reason:\s*([^\n]+)/i)
  if (match?.[1]) return match[1].replace(/["']/g, '').trim()
  if (/user rejected|user denied/i.test(error.message)) return 'The request was rejected in the wallet.'
  if (/insufficient funds/i.test(error.message)) return 'Not enough Base Sepolia ETH to pay gas.'
  return error.message.split('\n')[0].slice(0, 180)
}

export function useAmmoraActions(pool: AmmoraPoolState) {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient({ chainId: baseSepolia.id })
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<TransactionStatus>(initialStatus)
  const [busy, setBusy] = useState(false)

  const prepare = useCallback(async () => {
    if (!address) throw new Error('Connect a wallet before continuing.')
    if (!publicClient) throw new Error('Base Sepolia RPC is not available.')
    if (chainId !== baseSepolia.id) {
      setStatus({ tone: 'pending', message: 'Switching wallet to Base Sepolia…' })
      await switchChainAsync({ chainId: baseSepolia.id })
    }
    return address
  }, [address, chainId, publicClient, switchChainAsync])

  const waitFor = useCallback(async (hash: Hash, message: string) => {
    if (!publicClient) throw new Error('Base Sepolia RPC is not available.')
    setStatus({ tone: 'pending', message, hash })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Base Sepolia.')
  }, [publicClient])

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
      await pool.refetch()
      setStatus((current) => ({ ...current, tone: 'success' }))
    } catch (error) {
      setStatus({ tone: 'error', message: readableError(error) })
    } finally {
      setBusy(false)
    }
  }, [pool])

  const claim = useCallback((tokenIndex: 0 | 1) => run(async () => {
    await prepare()
    const token = demoTokens[tokenIndex]
    setStatus({ tone: 'pending', message: `Confirm ${token.symbol} faucet request in your wallet…` })
    const hash = await writeContractAsync({
      address: token.address,
      abi: demoTokenAbi,
      functionName: 'claim',
      args: [],
      chainId: baseSepolia.id,
    })
    await waitFor(hash, `Minting ${token.symbol} on Base Sepolia…`)
    setStatus({ tone: 'success', message: `${token.symbol} test tokens received.`, hash })
  }), [prepare, run, waitFor, writeContractAsync])

  const swap = useCallback((tokenInIndex: 0 | 1, amountIn: bigint, amountOutMin: bigint) => run(async () => {
    const recipient = await prepare()
    const tokenIn = demoTokens[tokenInIndex]
    const tokenOut = demoTokens[tokenInIndex === 0 ? 1 : 0]
    const allowance = tokenInIndex === 0 ? pool.aEthAllowance : pool.aUsdAllowance

    if (allowance < amountIn) {
      setStatus({ tone: 'pending', message: `Approve ${tokenIn.symbol} in your wallet…` })
      const approvalHash = await writeContractAsync({
        address: tokenIn.address,
        abi: demoTokenAbi,
        functionName: 'approve',
        args: [baseSepoliaDeployment.router, amountIn],
        chainId: baseSepolia.id,
      })
      await waitFor(approvalHash, `Approving ${tokenIn.symbol}…`)
    }

    setStatus({ tone: 'pending', message: 'Confirm the swap in your wallet…' })
    const hash = await writeContractAsync({
      address: baseSepoliaDeployment.router,
      abi: ammoraRouterAbi,
      functionName: 'swapExactTokensForTokens',
      args: [
        amountIn,
        amountOutMin,
        [tokenIn.address, tokenOut.address] as readonly Address[],
        recipient,
        BigInt(Math.floor(Date.now() / 1_000) + 1_200),
      ],
      chainId: baseSepolia.id,
    })
    await waitFor(hash, 'Swapping on Base Sepolia…')
    setStatus({ tone: 'success', message: 'Swap completed.', hash })
  }), [pool.aEthAllowance, pool.aUsdAllowance, prepare, run, waitFor, writeContractAsync])

  const addLiquidity = useCallback((amountAEth: bigint, amountAUsd: bigint, minAEth: bigint, minAUsd: bigint) => run(async () => {
    const recipient = await prepare()
    const amounts = [amountAEth, amountAUsd] as const
    const allowances = [pool.aEthAllowance, pool.aUsdAllowance] as const

    for (const index of [0, 1] as const) {
      if (allowances[index] < amounts[index]) {
        const token = demoTokens[index]
        setStatus({ tone: 'pending', message: `Approve ${token.symbol} in your wallet…` })
        const approvalHash = await writeContractAsync({
          address: token.address,
          abi: demoTokenAbi,
          functionName: 'approve',
          args: [baseSepoliaDeployment.router, amounts[index]],
          chainId: baseSepolia.id,
        })
        await waitFor(approvalHash, `Approving ${token.symbol}…`)
      }
    }

    setStatus({ tone: 'pending', message: 'Confirm liquidity deposit in your wallet…' })
    const hash = await writeContractAsync({
      address: baseSepoliaDeployment.router,
      abi: ammoraRouterAbi,
      functionName: 'addLiquidity',
      args: [
        demoTokens[0].address,
        demoTokens[1].address,
        amountAEth,
        amountAUsd,
        minAEth,
        minAUsd,
        recipient,
        BigInt(Math.floor(Date.now() / 1_000) + 1_200),
      ],
      chainId: baseSepolia.id,
    })
    await waitFor(hash, 'Adding liquidity to Ammora…')
    setStatus({ tone: 'success', message: 'Liquidity added and LP tokens received.', hash })
  }), [pool.aEthAllowance, pool.aUsdAllowance, prepare, run, waitFor, writeContractAsync])

  const removeLiquidity = useCallback((liquidity: bigint, minAEth: bigint, minAUsd: bigint) => run(async () => {
    const recipient = await prepare()
    if (pool.lpAllowance < liquidity) {
      setStatus({ tone: 'pending', message: 'Approve AMM-LP tokens in your wallet…' })
      const approvalHash = await writeContractAsync({
        address: baseSepoliaDeployment.pair,
        abi: ammoraPairAbi,
        functionName: 'approve',
        args: [baseSepoliaDeployment.router, liquidity],
        chainId: baseSepolia.id,
      })
      await waitFor(approvalHash, 'Approving AMM-LP tokens…')
    }

    setStatus({ tone: 'pending', message: 'Confirm liquidity withdrawal in your wallet…' })
    const hash = await writeContractAsync({
      address: baseSepoliaDeployment.router,
      abi: ammoraRouterAbi,
      functionName: 'removeLiquidity',
      args: [
        demoTokens[0].address,
        demoTokens[1].address,
        liquidity,
        minAEth,
        minAUsd,
        recipient,
        BigInt(Math.floor(Date.now() / 1_000) + 1_200),
      ],
      chainId: baseSepolia.id,
    })
    await waitFor(hash, 'Removing liquidity from Ammora…')
    setStatus({ tone: 'success', message: 'Liquidity removed.', hash })
  }), [pool.lpAllowance, prepare, run, waitFor, writeContractAsync])

  return {
    busy,
    status,
    clearStatus: () => setStatus(initialStatus),
    claim,
    swap,
    addLiquidity,
    removeLiquidity,
  }
}

export type AmmoraActions = ReturnType<typeof useAmmoraActions>
