import { renderHook } from '@testing-library/react';
import { useBeforeUnload } from '../../../src/hooks/useBeforeUnload';

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockConfirm = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('useBeforeUnload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add event listener when enabled is true', () => {
    renderHook(() => useBeforeUnload({ enabled: true }));

    expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should not add event listener when enabled is false', () => {
    renderHook(() => useBeforeUnload({ enabled: false }));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  it('should remove event listener on cleanup when enabled', () => {
    const { unmount } = renderHook(() => useBeforeUnload({ enabled: true }));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should not remove event listener on cleanup when not enabled', () => {
    const { unmount } = renderHook(() => useBeforeUnload({ enabled: false }));

    unmount();

    expect(mockRemoveEventListener).not.toHaveBeenCalled();
  });

  it('should update event listener when enabled state changes', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useBeforeUnload({ enabled }),
      { initialProps: { enabled: false } }
    );

    expect(mockAddEventListener).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should return triggerWarning function that shows confirm dialog when enabled', () => {
    mockConfirm.mockReturnValue(true);
    
    const { result } = renderHook(() => useBeforeUnload({ 
      enabled: true, 
      message: 'Test message' 
    }));

    const confirmed = result.current.triggerWarning();

    expect(mockConfirm).toHaveBeenCalledWith('Test message');
    expect(confirmed).toBe(true);
  });

  it('should return triggerWarning function that returns true when disabled', () => {
    const { result } = renderHook(() => useBeforeUnload({ enabled: false }));

    const confirmed = result.current.triggerWarning();

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(confirmed).toBe(true);
  });

  it('should use default message when no custom message provided', () => {
    mockConfirm.mockReturnValue(false);
    
    const { result } = renderHook(() => useBeforeUnload({ enabled: true }));

    result.current.triggerWarning();

    expect(mockConfirm).toHaveBeenCalledWith('Czy na pewno chcesz opuścić stronę? Utracisz połączenie z sesją Planning Poker.');
  });

  it('should handle beforeunload event correctly', () => {
    let beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | undefined;
    
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'beforeunload') {
        beforeUnloadHandler = handler;
      }
    });

    renderHook(() => useBeforeUnload({ 
      enabled: true, 
      message: 'Custom message' 
    }));

    expect(beforeUnloadHandler).toBeDefined();

    // Simulate beforeunload event
    const mockEvent = {
      preventDefault: jest.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    const result = beforeUnloadHandler!(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toBe('Custom message');
    expect(result).toBe('Custom message');
  });

  it('should not prevent default when disabled', () => {
    let beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | undefined;
    
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'beforeunload') {
        beforeUnloadHandler = handler;
      }
    });

    const { rerender } = renderHook(
      ({ enabled }) => useBeforeUnload({ enabled }),
      { initialProps: { enabled: true } }
    );

    // Change to disabled
    rerender({ enabled: false });

    expect(beforeUnloadHandler).toBeDefined();

    // Simulate beforeunload event when disabled
    const mockEvent = {
      preventDefault: jest.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    const result = beforeUnloadHandler!(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});