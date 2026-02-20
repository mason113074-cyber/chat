import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('should show success icon and label', () => {
    render(<StatusBadge status="success" />);
    const el = screen.getByTitle('Success');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-label', 'Success');
  });

  it('should show error icon and label', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByTitle('Error')).toHaveAttribute('aria-label', 'Error');
  });

  it('should show running icon and label', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByTitle('Running')).toBeInTheDocument();
  });

  it('should show warning icon and label', () => {
    render(<StatusBadge status="warning" />);
    expect(screen.getByTitle('Warning')).toBeInTheDocument();
  });

  it('should show pending icon and label', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByTitle('Pending')).toBeInTheDocument();
  });
});
