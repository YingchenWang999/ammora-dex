import type { TransactionStatus as Status } from '../hooks/useAmmoraActions'

type TransactionStatusProps = {
  status: Status
}

export function TransactionStatus({ status }: TransactionStatusProps) {
  if (status.tone === 'idle') return null

  return (
    <div className={`transaction-status transaction-status--${status.tone}`} role="status">
      <span className="transaction-status__signal" aria-hidden="true" />
      <span>{status.message}</span>
      {status.hash && (
        <a
          href={`https://sepolia.basescan.org/tx/${status.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction ↗
        </a>
      )}
    </div>
  )
}
