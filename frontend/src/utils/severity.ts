import type { Severity, AlertStatus } from '../types'

export const severityColor: Record<Severity, string> = {
  critical: 'text-[#ff3b5c]',
  high: 'text-[#ff8c42]',
  medium: 'text-[#ffd166]',
  low: 'text-[#06d6a0]',
}

export const severityBg: Record<Severity, string> = {
  critical: 'bg-[#ff3b5c]/10 border border-[#ff3b5c]/30',
  high: 'bg-[#ff8c42]/10 border border-[#ff8c42]/30',
  medium: 'bg-[#ffd166]/10 border border-[#ffd166]/30',
  low: 'bg-[#06d6a0]/10 border border-[#06d6a0]/30',
}

export const severityDot: Record<Severity, string> = {
  critical: 'bg-[#ff3b5c]',
  high: 'bg-[#ff8c42]',
  medium: 'bg-[#ffd166]',
  low: 'bg-[#06d6a0]',
}

export const statusColor: Record<AlertStatus, string> = {
  open: 'text-[#ff3b5c] bg-[#ff3b5c]/10 border border-[#ff3b5c]/30',
  acknowledged: 'text-[#ffd166] bg-[#ffd166]/10 border border-[#ffd166]/30',
  investigating: 'text-[#4cc9f0] bg-[#4cc9f0]/10 border border-[#4cc9f0]/30',
  resolved: 'text-[#06d6a0] bg-[#06d6a0]/10 border border-[#06d6a0]/30',
  false_positive: 'text-[#8892b0] bg-[#8892b0]/10 border border-[#8892b0]/30',
}

export const statusLabel: Record<AlertStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  investigating: 'Investigating',
  resolved: 'Resolved',
  false_positive: 'False Positive',
}

export function riskBarColor(score: number): string {
  if (score >= 90) return '#ff3b5c'
  if (score >= 70) return '#ff8c42'
  if (score >= 40) return '#ffd166'
  return '#06d6a0'
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
