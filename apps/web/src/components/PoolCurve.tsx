type PoolCurveProps = {
  progress: number
  invariant: string
  reserves: string
}

export function PoolCurve({ progress, invariant, reserves }: PoolCurveProps) {
  const { t } = useI18n()
  const clamped = Math.min(Math.max(progress, 0), 1)
  const markerX = 94 + clamped * 168
  const markerY = 174 - Math.sqrt(clamped) * 104

  return (
    <section className="curve-panel" aria-labelledby="curve-title">
      <div className="curve-panel__header">
        <div>
          <span className="eyebrow">{t('curve.eyebrow')}</span>
          <h2 id="curve-title">{t('curve.title')}</h2>
        </div>
        <span className="curve-panel__formula">x · y = k</span>
      </div>

      <div className="curve-plot" aria-label={t('curve.aria')}>
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
      </div>

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
import { useI18n } from '../i18n'
