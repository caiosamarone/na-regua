import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SlotGrid } from '@/components/booking/slot-grid';

const slot = (local: string, utc: string) => ({ startTimeLocal: local, startTimeUtc: utc, endTimeUtc: utc });
const slots = [
  slot('09:00', '2026-09-24T12:00:00Z'),
  slot('09:30', '2026-09-24T12:30:00Z'),
  slot('10:00', '2026-09-24T13:00:00Z'),
  slot('10:30', '2026-09-24T13:30:00Z'),
  slot('11:00', '2026-09-24T14:00:00Z'),
];

describe('SlotGrid', () => {
  it('renders the local times and reports the picked slot', async () => {
    const onSelect = jest.fn();
    await render(<SlotGrid slots={slots} selected="2026-09-24T12:30:00Z" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: '09:30', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: '11:00', selected: false })).toBeTruthy();

    fireEvent.press(screen.getByText('11:00'));
    expect(onSelect).toHaveBeenCalledWith(slots[4]);
  });
});
