import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('should display title and value', () => {
    render(<StatCard title="Total" value={42} variant="default" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('success variant should have green border class', () => {
    const { container } = render(
      <StatCard title="Passed" value={10} variant="success" />
    );
    expect(container.firstChild).toHaveClass('border-green-200');
  });

  it('error variant should have red border class', () => {
    const { container } = render(
      <StatCard title="Failed" value={0} variant="error" />
    );
    expect(container.firstChild).toHaveClass('border-red-200');
  });

  it('should display string value', () => {
    render(<StatCard title="Rate" value="98.5%" variant="success" />);
    expect(screen.getByText('98.5%')).toBeInTheDocument();
  });
});
