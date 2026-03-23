import ReactECharts from 'echarts-for-react'
import type { Stats } from '../../types'

export default function SeverityDonut({ stats }: { stats: Stats }) {
  const data = [
    { value: stats.critical_alerts, name: 'Critical', itemStyle: { color: '#ff3b5c' } },
    { value: stats.high_alerts, name: 'High', itemStyle: { color: '#ff8c42' } },
    { value: stats.medium_alerts, name: 'Medium', itemStyle: { color: '#ffd166' } },
    { value: stats.low_alerts, name: 'Low', itemStyle: { color: '#06d6a0' } },
  ].filter(d => d.value > 0)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'var(--c-bg-elevated)',
      borderColor: 'var(--c-border-bright)',
      textStyle: { color: 'var(--c-text-primary)', fontSize: 11, fontFamily: 'Inter' },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<b>${p.name}</b>: ${p.value} (${p.percent}%)`,
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: { color: 'var(--c-text-secondary)', fontSize: 11 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', color: 'var(--c-text-primary)' },
          scale: true,
          scaleSize: 6,
        },
        data,
      },
    ],
  }

  return (
    <div className="h-full">
      <h2 className="text-sm font-semibold text-[var(--c-text-primary)] mb-3">Severity Breakdown</h2>
      <ReactECharts option={option} style={{ height: 'calc(100% - 28px)' }} />
    </div>
  )
}
