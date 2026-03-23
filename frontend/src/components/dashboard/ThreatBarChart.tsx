import ReactECharts from 'echarts-for-react'
import type { Stats } from '../../types'

export default function ThreatBarChart({ stats }: { stats: Stats }) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--c-bg-elevated)',
      borderColor: 'var(--c-border-bright)',
      textStyle: { color: 'var(--c-text-primary)', fontSize: 11, fontFamily: 'Inter' },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(94,129,244,0.05)' } },
    },
    grid: { top: 8, right: 8, bottom: 32, left: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: stats.alerts_by_hour.map(h => h.hour),
      axisLabel: {
        color: 'var(--c-text-muted)',
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        interval: 3,
      },
      axisLine: { lineStyle: { color: 'var(--c-border)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'var(--c-text-muted)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'var(--c-border)', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: stats.alerts_by_hour.map(h => h.count),
        barMaxWidth: 16,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#5e81f4' },
              { offset: 1, color: '#5e81f420' },
            ],
          },
          borderRadius: [3, 3, 0, 0],
        },
        emphasis: {
          itemStyle: { color: '#7b9bf8' },
        },
      },
    ],
  }

  return (
    <div className="h-full">
      <h2 className="text-sm font-semibold text-[var(--c-text-primary)] mb-3">Alerts by Hour</h2>
      <ReactECharts option={option} style={{ height: 'calc(100% - 28px)' }} />
    </div>
  )
}
