import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useImportViewState } from './useImportViewState';

it('keeps theme distribution valid when themes are added and removed', () => {
  const { result } = renderHook(() => useImportViewState({
    isImportingCsv: false, isImportingLichess: false, onAnalyzeCsv: vi.fn(),
    onBackToTraining: vi.fn(), onImportCsv: vi.fn(), onImportLichess: vi.fn(),
    onSelectCsvFile: vi.fn(), puzzleListIsLocked: false, selectedTraining: null,
  }));
  act(() => { result.current.addTheme('fork'); result.current.addTheme('pin'); });
  act(() => result.current.setDistribution('custom'));
  expect(result.current.distribution).toBe('custom');
  expect(Object.values(result.current.themeDistribution).reduce((sum, value) => sum + value, 0)).toBe(100);
  act(() => result.current.removeTheme('pin'));
  expect(result.current.distribution).toBe('random');
  expect(result.current.themeDistribution).toEqual({ fork: 100 });
  act(() => result.current.removeTheme('fork'));
  expect(result.current.themeDistribution).toEqual({});
});
