import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnomalyFeedback } from '../src/components/anomaly/AnomalyFeedback'
import { test, expect, vi } from 'vitest'

// Mock the feedback API
vi.mock('../src/api/feedback', () => ({
  feedbackApi: {
    submit: vi.fn().mockResolvedValue({ status: 'recorded' })
  }
}))

const mockAnomaly = {
  id: 123, scored_at: '2024-01-15T14:00:00Z',
  host: 'web-01', tenant_id: 't1',
  final_score: 0.85, if_score: 0.7, lstm_score: 0.9,
  is_anomaly: true, anomaly_type: null,
  log_volume: 500, error_rate: 0.15,
  feature_window_start: null, feature_window_end: null
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AnomalyFeedback anomaly={mockAnomaly} />
    </QueryClientProvider>
  )
}

test('renders feedback buttons', () => {
  setup()
  expect(screen.getByText('Real anomaly')).toBeInTheDocument()
  expect(screen.getByText('False alarm')).toBeInTheDocument()
})

test('shows confirmation after feedback', async () => {
  setup()
  fireEvent.click(screen.getByText('False alarm'))
  await waitFor(() => {
    expect(screen.getByText(/Marked false positive/i)).toBeInTheDocument()
  })
})