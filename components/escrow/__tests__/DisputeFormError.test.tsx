import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DisputeFormError } from '../DisputeFormError';

const MESSAGE = 'HTTP 500: Internal Server Error';

// DisputeFormError is presentational: its only inputs are the failure message
// and the retry callback, so no providers or network calls need mocking here.
function renderError(onRetry = vi.fn()) {
  render(<DisputeFormError message={MESSAGE} onRetry={onRetry} />);
  return onRetry;
}

describe('DisputeFormError', () => {
  it('renders the failure headline and the message from the failed submission', () => {
    renderError();

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
  });

  it('renders the retry control', () => {
    renderError();

    expect(screen.getByTestId('try-again-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('announces itself as an assertive alert for assistive technology', () => {
    renderError();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByTestId('error-state')).toBe(alert);
  });

  it('calls onRetry when "Try Again" is clicked', () => {
    const onRetry = renderError();

    fireEvent.click(screen.getByTestId('try-again-button'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when Enter is pressed on the retry control', () => {
    const onRetry = renderError();

    fireEvent.keyDown(screen.getByTestId('try-again-button'), { key: 'Enter' });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when Space is pressed on the retry control', () => {
    const onRetry = renderError();

    fireEvent.keyDown(screen.getByTestId('try-again-button'), { key: ' ' });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Enter and Space', () => {
    const onRetry = renderError();

    fireEvent.keyDown(screen.getByTestId('try-again-button'), { key: 'a' });

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('does not call onRetry before the user interacts', () => {
    const onRetry = renderError();

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('renders an empty message without crashing', () => {
    render(<DisputeFormError message="" onRetry={vi.fn()} />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
  });

  it('stays mounted when the message changes on a later failure', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <DisputeFormError message={MESSAGE} onRetry={onRetry} />
    );

    rerender(<DisputeFormError message="Network error" onRetry={onRetry} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });
});
