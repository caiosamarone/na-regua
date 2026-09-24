import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/themed-text';

describe('ThemedText', () => {
  it('renders its children', async () => {
    await render(<ThemedText>Na Régua</ThemedText>);

    expect(screen.getByText('Na Régua')).toBeTruthy();
  });
});
