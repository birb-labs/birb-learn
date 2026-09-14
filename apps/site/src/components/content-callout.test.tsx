import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentCallout } from './content-callout';

describe('ContentCallout', () => {
  it('renders the icon, title, and children', () => {
    render(
      <ContentCallout icon="lightbulb" title="Você sabia?">
        <p>Conteúdo da curiosidade.</p>
      </ContentCallout>,
    );

    expect(screen.getByText('Você sabia?')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo da curiosidade.')).toBeInTheDocument();
  });
});
