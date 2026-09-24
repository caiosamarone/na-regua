import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Toggle } from '@/components/ui/toggle';

describe('Toggle', () => {
  it('exposes switch semantics and flips its value', async () => {
    const onChange = jest.fn();
    await render(<Toggle label="Segunda aberto" value={false} onChange={onChange} />);

    const toggle = screen.getByRole('switch', { name: 'Segunda aberto' });
    expect(toggle.props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
