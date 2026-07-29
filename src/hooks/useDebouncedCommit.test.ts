import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedCommit } from './useDebouncedCommit'

describe('useDebouncedCommit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('commits the new value after the delay pauses', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedCommit<string>('initial', onCommit, 500))

    act(() => {
      result.current[1]('updated')
    })

    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('updated')
  })

  it('collapses several rapid changes before the delay into a single final commit', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedCommit<string>('initial', onCommit, 500))

    act(() => {
      result.current[1]('a')
    })
    act(() => {
      vi.advanceTimersByTime(200)
      result.current[1]('ab')
    })
    act(() => {
      vi.advanceTimersByTime(200)
      result.current[1]('abc')
    })

    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('abc')
  })

  it('displays the local value immediately while a commit is pending', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedCommit<string>('initial', onCommit, 500))

    act(() => {
      result.current[1]('typed')
    })

    expect(result.current[0]).toBe('typed')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('re-syncs the local value when the externally-committed value changes for another reason', () => {
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedCommit<string>(value, onCommit, 500),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'external-update' })

    expect(result.current[0]).toBe('external-update')
    // No pending commit should be scheduled from an external sync.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('does not fire a commit or leave a dangling timer after unmount', () => {
    const onCommit = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCommit<string>('initial', onCommit, 500))

    act(() => {
      result.current[1]('updated')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onCommit).not.toHaveBeenCalled()
  })
})
