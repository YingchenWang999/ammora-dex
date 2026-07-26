import { useCallback, useState } from 'react'
import { baseSepoliaDeployment, demoTokens } from '@ammora/contract-config'
import { baseSepolia } from '@reown/appkit/networks'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import type { Address, Hash } from 'viem'
import { ammoraPairAbi, ammoraRouterAbi, demoTokenAbi } from '../contracts/abis'
import { useI18n, type TranslationKey } from '../i18n'
import type { AmmoraPoolState } from './useAmmoraPool'

export type TransactionStatus = {
  tone: 'idle' | 'pending' | 'success' | 'error'
  message: string
  hash?: Hash
}

export type ActivityItem = {
  id: string
  kind: 'claim' | 'swap' | 'add' | 'remove'
  symbol?: string
  hash: Hash
  timestamp: number
}

const initialStatus: TransactionStatus = { tone: 'idle', message: '' }

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string

function readableError(error: unknown, t: Translate): string {
  if (!(error instanceof Error)) return t('action.errorGeneric')
  const match = error.message.match(/reason:\s*([^\n]+)/i)
  if (match?.[1]) return match[1].replace(/["']/g, '').trim()
  if (/user rejected|user denied/i.test(error.message)) return t('action.errorRejected')
  if (/insufficient funds/i.test(error.message)) return t('action.errorGas')
  return error.message.split('\n')[0].slice(0, 180)
}

export function useAmmoraActions(pool: AmmoraPoolState) {
  const { t } = useI18n()
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient({ chainId: baseSepolia.id })
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<TransactionStatus>(initialStatus)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<ActivityItem[]>([])

  const recordActivity = useCallback((item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    setHistory((current) => [
      { ...item, id: item.hash, timestamp: Date.now() },
      ...current,
    ].slice(0, 12))
  }, [])

  const prepare = useCallback(async () => {
    if (!address) throw new Error(t('action.connectFirst'))
    if (!publicClient) throw new Error(t('action.rpcUnavailable'))
    if (chainId !== baseSepolia.id) {
      setStatus({ tone: 'pending', message: t('action.switching') })
      await switchChainAsync({ chainId: baseSepolia.id })
    }
    return address
  }, [address, chainId, publicClient, switchChainAsync, t])

  const waitFor = useCallback(async (hash: Hash, message: string) => {
    if (!publicClient) throw new Error(t('action.rpcUnavailable'))
    setStatus({ tone: 'pending', message, hash })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error(t('action.reverted'))
  }, [publicClient, t])

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
      await pool.refetch()
      setStatus((current) => ({ ...current, tone: 'success' }))
    } catch (error) {
      setStatus({ tone: 'error', message: readableError(error, t) })
    } finally {
      setBusy(false)
    }
  }, [pool, t])

  const claim = useCallback((tokenIndex: 0 | 1) => run(async () => {
    await prepare()
    const token = demoTokens[tokenIndex]
    setStatus({ tone: 'pending', message: t('action.claimConfirm', { symbol: token.symbol }) })
    const hash = await writeContractAsync({
      address: token.address,
      abi: demoTokenAbi,
      functionName: 'claim',
      args: [],
      chainId: baseSepolia.id,
    })
    await waitFor(hash, t('action.minting', { symbol: token.symbol }))
    setStatus({ tone: 'success', message: t('action.claimSuccess', { symbol: token.symbol }), hash })
    recordActivity({ kind: 'claim', symbol: token.symbol, hash })
  }), [prepare, recordActivity, run, t, waitFor, writeContractAsync])

  const swap = useCallback((tokenInIndex: 0 | 1, amountIn: bigint, amountOutMin: bigint) => run(async () => {
    const recipient = await prepare()
    const tokenIn = demoTokens[tokenInIndex]
    const tokenOut = demoTokens[tokenInIndex === 0 ? 1 : 0]
    const allowance = tokenInIndex === 0 ? pool.aEthAllowance : pool.aUsdAllowance

    if (allowance < amountIn) {
      setStatus({ tone: 'pending', message: t('action.approveToken', { symbol: tokenIn.symbol }) })
      const approvalHash = await writeContractAsync({
        address: tokenIn.address,
        abi: demoTokenAbi,
        functionName: 'approve',
        args: [baseSepoliaDeployment.router, amountIn],
        chainId: baseSepolia.id,
      })
      await waitFor(approvalHash, t('action.approvingToken', { symbol: tokenIn.symbol }))
    }

    setStatus({ tone: 'pending', message: t('action.swapConfirm') })
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
    await waitFor(hash, t('action.swapping'))
    setStatus({ tone: 'success', message: t('action.swapSuccess'), hash })
    recordActivity({ kind: 'swap', symbol: `${tokenIn.symbol} → ${tokenOut.symbol}`, hash })
  }), [pool.aEthAllowance, pool.aUsdAllowance, prepare, recordActivity, run, t, waitFor, writeContractAsync])

  const addLiquidity = useCallback((amountAEth: bigint, amountAUsd: bigint, minAEth: bigint, minAUsd: bigint) => run(async () => {
    const recipient = await prepare()
    const amounts = [amountAEth, amountAUsd] as const
    const allowances = [pool.aEthAllowance, pool.aUsdAllowance] as const

    for (const index of [0, 1] as const) {
      if (allowances[index] < amounts[index]) {
        const token = demoTokens[index]
        setStatus({ tone: 'pending', message: t('action.approveToken', { symbol: token.symbol }) })
        const approvalHash = await writeContractAsync({
          address: token.address,
          abi: demoTokenAbi,
          functionName: 'approve',
          args: [baseSepoliaDeployment.router, amounts[index]],
          chainId: baseSepolia.id,
        })
        await waitFor(approvalHash, t('action.approvingToken', { symbol: token.symbol }))
      }
    }

    setStatus({ tone: 'pending', message: t('action.addConfirm') })
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
    await waitFor(hash, t('action.adding'))
    setStatus({ tone: 'success', message: t('action.addSuccess'), hash })
    recordActivity({ kind: 'add', symbol: 'aETH + aUSD', hash })
  }), [pool.aEthAllowance, pool.aUsdAllowance, prepare, recordActivity, run, t, waitFor, writeContractAsync])

  const removeLiquidity = useCallback((liquidity: bigint, minAEth: bigint, minAUsd: bigint) => run(async () => {
    const recipient = await prepare()
    if (pool.lpAllowance < liquidity) {
      setStatus({ tone: 'pending', message: t('action.approveLp') })
      const approvalHash = await writeContractAsync({
        address: baseSepoliaDeployment.pair,
        abi: ammoraPairAbi,
        functionName: 'approve',
        args: [baseSepoliaDeployment.router, liquidity],
        chainId: baseSepolia.id,
      })
      await waitFor(approvalHash, t('action.approvingLp'))
    }

    setStatus({ tone: 'pending', message: t('action.removeConfirm') })
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
    await waitFor(hash, t('action.removing'))
    setStatus({ tone: 'success', message: t('action.removeSuccess'), hash })
    recordActivity({ kind: 'remove', symbol: 'aETH + aUSD', hash })
  }), [pool.lpAllowance, prepare, recordActivity, run, t, waitFor, writeContractAsync])

  return {
    busy,
    status,
    history,
    clearStatus: () => setStatus(initialStatus),
    claim,
    swap,
    addLiquidity,
    removeLiquidity,
  }
}

export type AmmoraActions = ReturnType<typeof useAmmoraActions>
