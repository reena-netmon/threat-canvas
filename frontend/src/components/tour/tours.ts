import type { TourStep } from './TourContext'

export const TOURS: Record<string, TourStep[]> = {
  dashboard: [
    {
      target: '[data-tour="topbar"]',
      title: 'Welcome to ThreatCanvas 👋',
      content: 'This is your SOC Command Center. The top bar shows your current page, a live clock, and lets you spawn simulated threat alerts for testing. Your profile and logout live here too.',
      position: 'bottom',
    },
    {
      target: '[data-tour="kpi-cards"]',
      title: 'KPI Cards — Your Pulse Check',
      content: 'Six real-time metrics: total alerts, open threats, critical severity count, high severity, resolved today, and average risk score. Pulsing dots indicate active open threats.',
      position: 'bottom',
    },
    {
      target: '[data-tour="critical-banner"]',
      title: 'Critical Alert Banner',
      content: 'When critical threats are active, this banner pulses red at the top of the dashboard — impossible to miss. It shows the most urgent unresolved threat title.',
      position: 'bottom',
    },
    {
      target: '[data-tour="bar-chart"]',
      title: 'Alerts by Hour',
      content: 'A 24-hour bar chart showing alert volume patterns. Spikes indicate attack windows. Hover over any bar for the exact count. Great for spotting off-hours activity.',
      position: 'top',
    },
    {
      target: '[data-tour="donut-chart"]',
      title: 'Severity Breakdown',
      content: 'A donut chart distributing all alerts across Critical, High, Medium, and Low severity. Hover segments for exact counts. Use this to assess overall threat posture at a glance.',
      position: 'top',
    },
    {
      target: '[data-tour="live-feed"]',
      title: 'Live Alert Feed',
      content: 'Real-time stream of the latest 30 alerts sorted by time. Each row shows severity dot, alert title, source IP, target host, risk score, and relative time. Auto-refreshes every 8 seconds.',
      position: 'top',
    },
    {
      target: '[data-tour="top-threats"]',
      title: 'Top Threat Types',
      content: 'A ranked breakdown of the most frequent attack categories with relative bar charts. Use this to identify recurring attack patterns and prioritise detection rule tuning.',
      position: 'top',
    },
    {
      target: '[data-tour="sidebar"]',
      title: 'Navigation Sidebar',
      content: 'Five modules: Dashboard, Triage Board, Attack Timeline, Threat Intelligence, and Log Search. The green pulse at the bottom confirms you\'re connected and receiving live data. Hover icons for labels.',
      position: 'right',
    },
  ],

  triage: [
    {
      target: '[data-tour="triage-header"]',
      title: 'Triage Board — Kanban Workflow',
      content: 'This is your primary alert management workspace. Alerts flow left to right as analysts investigate and resolve them. The counts at the top update live as statuses change.',
      position: 'bottom',
    },
    {
      target: '[data-tour="triage-open"]',
      title: 'Open Column',
      content: 'All new unacknowledged alerts land here, sorted by risk score (highest first). Red badge count tells you how many need attention right now.',
      position: 'right',
    },
    {
      target: '[data-tour="triage-acknowledged"]',
      title: 'Acknowledged Column',
      content: 'Alerts an analyst has seen and claimed. Moving an alert here signals to the team "someone is on this" — reducing duplicate investigation effort.',
      position: 'bottom',
    },
    {
      target: '[data-tour="triage-investigating"]',
      title: 'Investigating Column',
      content: 'Active investigations. Alerts here have an analyst actively working a response. In a real SOC, this would link to case management and evidence collection.',
      position: 'bottom',
    },
    {
      target: '[data-tour="triage-resolved"]',
      title: 'Resolved Column',
      content: 'Confirmed true positives that have been contained and remediated. Resolved alerts are counted in the dashboard\'s "Resolved Today" KPI.',
      position: 'left',
    },
    {
      target: '[data-tour="triage-card"]',
      title: 'Alert Cards — Click to Expand',
      content: 'Click any card to expand it. You\'ll see the full description, affected user and host, MITRE ATT&CK technique ID, and action buttons to move the alert to any other status — including marking as a false positive.',
      position: 'right',
    },
  ],

  timeline: [
    {
      target: '[data-tour="timeline-incidents"]',
      title: 'Incident Selector',
      content: 'A list of all open incidents on the left. Each shows severity, risk score, title, and time. Click any incident to filter the timeline to that specific attack chain.',
      position: 'right',
    },
    {
      target: '[data-tour="timeline-main"]',
      title: 'Attack Chain Timeline',
      content: 'A chronological forensic reconstruction of each incident — from initial reconnaissance through to the triggered alert. Every event is timestamped and linked to an actor and target.',
      position: 'left',
    },
    {
      target: '[data-tour="timeline-event"]',
      title: 'Timeline Events',
      content: 'Each node represents a discrete security event: network scan, auth attempt, process spawn, file access, C2 beacon. The icon type and colour identify the event category at a glance.',
      position: 'left',
    },
    {
      target: '[data-tour="timeline-mitre"]',
      title: 'MITRE ATT&CK Tags',
      content: 'Every event is mapped to a MITRE ATT&CK technique ID (e.g. T1110 Brute Force, T1486 Data Encrypted for Impact). Use these to query your detection rules for coverage gaps.',
      position: 'left',
    },
  ],

  intel: [
    {
      target: '[data-tour="intel-treemap"]',
      title: 'Attack Origin Treemap',
      content: 'Visual breakdown of attack source countries. Larger blocks = more alerts from that origin. Colour-coded by threat level. Hover for exact counts. Use this to tune geolocation-based firewall rules.',
      position: 'bottom',
    },
    {
      target: '[data-tour="intel-mitre"]',
      title: 'MITRE ATT&CK Coverage',
      content: 'A horizontal bar chart showing how many alerts have been observed for each ATT&CK tactic. Empty bars = blind spots in your detection coverage. Longer bars = well-covered tactics.',
      position: 'bottom',
    },
    {
      target: '[data-tour="intel-ioc"]',
      title: 'Threat Indicators (IoC Grid)',
      content: 'Deduplicated list of unique attacker IPs seen across all alerts, showing the highest-risk event associated with each IP, its geo-origin, and risk score. Click any card to pivot into log search.',
      position: 'top',
    },
  ],

  'alert-details': [
    {
      target: '[data-tour="alert-header"]',
      title: 'Alert Details — Full Incident View',
      content: 'This is your deep-dive investigation workspace for a single alert. The header shows the full title, severity, current status, and a real-time risk score bar. Use the Back button to return to your previous view.',
      position: 'bottom',
    },
    {
      target: '[data-tour="alert-actions"]',
      title: 'Status Actions',
      content: 'Move this alert through the investigation workflow with one click — Acknowledge, Investigate, Resolve, or mark as False Positive. Status changes propagate instantly across the Triage Board and Dashboard.',
      position: 'bottom',
    },
    {
      target: '[data-tour="alert-meta"]',
      title: 'Network & Identity',
      content: 'Every forensic detail in one place: source and destination IPs, affected host, compromised user account, and geographic origin. Click a source IP to pivot into Log Search pre-filtered for that IP.',
      position: 'right',
    },
    {
      target: '[data-tour="alert-mitre"]',
      title: 'MITRE ATT&CK Mapping',
      content: 'Each alert is tagged to one or more MITRE ATT&CK techniques and tactics. Use the technique IDs to query your SIEM for coverage, cross-reference with detection rules, and identify gaps.',
      position: 'right',
    },
    {
      target: '[data-tour="alert-timeline"]',
      title: 'Per-Alert Attack Chain',
      content: 'The full forensic event chain for this specific incident — ordered chronologically from initial contact to final trigger. Each node is colour-coded by event type and mapped to a MITRE technique ID.',
      position: 'left',
    },
  ],

  logs: [
    {
      target: '[data-tour="log-search-bar"]',
      title: 'Full-Text Log Search',
      content: 'Search across all 500+ ingested log entries in real time. Matches on message content, source IP, hostname, username, and event type. Results update as you type with a 300ms debounce — no need to press Enter.',
      position: 'bottom',
    },
    {
      target: '[data-tour="log-filters"]',
      title: 'Filter Controls',
      content: 'Narrow results by data stream, severity level, source type, or event type — all at once. Combine as many filters as you need for precision threat hunting. Hit "Clear" to reset everything instantly.',
      position: 'bottom',
    },
    {
      target: '[data-tour="log-stream-pills"]',
      title: 'Stream Quick-Filter Pills',
      content: 'One click to isolate any of the 15 ingested data streams — Crowdstrike Falcon, Okta SSO, AWS CloudTrail, K8s Audit, Palo Alto, and more. The active pill fills with the stream\'s colour. Click again to deselect.',
      position: 'bottom',
    },
    {
      target: '[data-tour="log-viz-panel"]',
      title: 'Log Visualizations',
      content: 'Four live charts that reflect your active filters: 24-hour activity bar chart, severity breakdown, top data streams, and top event types. Each chart card is individually collapsible. Collapse all to give the results table more room.',
      position: 'bottom',
    },
    {
      target: '[data-tour="log-table"]',
      title: 'Log Results Table',
      content: 'Up to 50 results per page, sorted by time descending. Columns: timestamp, severity, data stream (colour-coded badge), event type, source IP, host, user, and message with search term highlighting. The table auto-expands when charts are collapsed.',
      position: 'top',
    },
  ],
}
