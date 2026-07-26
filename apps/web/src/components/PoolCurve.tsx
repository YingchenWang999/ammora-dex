import { useState } from 'react'
import { isDeploymentConfigured } from '@ammora/contract-config'
import { useI18n } from '../i18n'

type PoolCurveProps = {
  progress: number
  invariant: string
  reserves: string
  rate: string
}

export function PoolCurve({ progress, invariant, reserves, rate }: PoolCurveProps) {
  const { t } = useI18n()
  const [view, setView] = useState<'depth' | 'data'>('depth')
  const clamped = Math.min(Math.max(progress, 0), 1)
  const markerX = 94 + clamped * 168
  const markerY = 174 - Math.sqrt(clamped) * 104

  return (
    <section className="curve-panel" aria-labelledby="curve-title">
      <div className="curve-panel__header">
        <div>
          <span className="eyebrow">{t('poolView.eyebrow')}</span>
          <h2 id="curve-title">aETH / aUSD</h2>
          <p>{t('poolView.subtitle')}</p>
        </div>
        <div className="curve-panel__rate">
          <span>{t('poolView.spotRate')}</span>
          <strong>{rate}</strong>
        </div>
      </div>

      <div className="curve-tabs" role="tablist" aria-label={t('poolView.tabs')}>
        <button className={view === 'depth' ? 'is-active' : ''} type="button" onClick={() => setView('depth')}>
          {t('poolView.depth')}
        </button>
        <button className={view === 'data' ? 'is-active' : ''} type="button" onClick={() => setView('data')}>
          {t('poolView.data')}
        </button>
      </div>

      {view === 'depth' ? <div className="curve-plot" aria-label={t('curve.aria')}>
        <svg viewBox="0 0 360 220" role="img" aria-labelledby="curve-description">
          <title id="curve-description">
            {t('curve.description')}
          </title>
          <defs>
            <linearGradient id="curveStroke" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#2c57ff" />
              <stop offset="100%" stopColor="#53d8c9" />
            </linearGradient>
            <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="curve-grid" d="M42 24V188H324M42 147H324M42 106H324M42 65H324" />
          <path
            className="curve-line"
            d="M62 178C74 124 92 93 119 75C151 54 204 43 305 35"
          />
          <path className="curve-guide" d={`M${markerX} ${markerY}V188M42 ${markerY}H${markerX}`} />
          <circle
            className="curve-marker"
            cx={markerX}
            cy={markerY}
            r="7"
            filter="url(#markerGlow)"
          />
          <text className="curve-axis" x="286" y="207">{t('curve.aethReserve')}</text>
          <text className="curve-axis" x="9" y="18">aUSD</text>
        </svg>
        <p className="curve-plot__note">
          {isDeploymentConfigured ? t('poolView.liveCurve') : t('poolView.previewCurve')}
        </p>
      </div> : <div className="pool-data-grid">
        <div><span>{t('curve.reserves')}</span><strong>{reserves}</strong></div>
        <div><span>{t('curve.invariant')}</span><strong>{invariant}</strong></div>
        <div><span>{t('curve.lpFee')}</span><strong>0.30%</strong></div>
        <div><span>{t('poolView.contractState')}</span><strong>{isDeploymentConfigured ? t('common.ready') : t('common.pending')}</strong></div>
      </div>}

      <div className="curve-metrics">
        <div>
          <span>{t('curve.invariant')}</span>
          <strong>{invariant}</strong>
        </div>
        <div>
          <span>{t('curve.lpFee')}</span>
          <strong>0.30%</strong>
        </div>
        <div>
          <span>{t('curve.reserves')}</span>
          <strong>{reserves}</strong>
        </div>
      </div>
    </section>
  )
}
