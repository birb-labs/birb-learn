import { afterEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { createRetryableLazy } from '@/lib/retryable-lazy';
import { LazyIslandBoundary } from './lazy-island-boundary';

function Island({ label }: { label: string }) {
  return <p>{label}</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

function renderBoundary(Lazy: ReturnType<typeof createRetryableLazy<typeof Island>>) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <p>Outside the boundary</p>
      <LazyIslandBoundary onRetry={Lazy.reset} context={<p>The prompt</p>}>
        <Suspense fallback={<p>Loading</p>}>
          <Lazy label="Loaded island" />
        </Suspense>
      </LazyIslandBoundary>
    </NextIntlClientProvider>,
  );
}

describe('LazyIslandBoundary', () => {
  it('shows the message and a retry instead of crashing, and Retry loads the island', async () => {
    // React reports a caught render error to the console.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<() => Promise<{ default: typeof Island }>>();
    load.mockRejectedValueOnce(new Error('Loading chunk failed'));
    load.mockResolvedValue({ default: Island });
    const Lazy = createRetryableLazy(load);
    renderBoundary(Lazy);

    expect(await screen.findByRole('alert')).toHaveTextContent(ptBR.code.run.unavailable.engine_load);
    // What surrounds the island stays up, and the caller's context (the prompt) is kept.
    expect(screen.getByText('Outside the boundary')).toBeInTheDocument();
    expect(screen.getByText('The prompt')).toBeInTheDocument();
    expect(screen.queryByText('Loaded island')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: ptBR.code.run.retry }));

    expect(await screen.findByText('Loaded island')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    // A second import was made: the failed one is not cached.
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Outside the boundary')).toBeInTheDocument();
  });

  it('keeps showing the message when the retry fails too, and can be retried again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<() => Promise<{ default: typeof Island }>>();
    load.mockRejectedValueOnce(new Error('offline'));
    load.mockRejectedValueOnce(new Error('still offline'));
    load.mockResolvedValue({ default: Island });
    const Lazy = createRetryableLazy(load);
    renderBoundary(Lazy);

    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: ptBR.code.run.retry }));
    // Loading again, then failing again.
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: ptBR.code.run.retry }));
    expect(await screen.findByText('Loaded island')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('renders the island normally when nothing fails', async () => {
    const Lazy = createRetryableLazy(() => Promise.resolve({ default: Island }));
    renderBoundary(Lazy);
    expect(await screen.findByText('Loaded island')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
