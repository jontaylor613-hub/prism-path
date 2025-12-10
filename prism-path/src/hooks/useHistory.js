import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Version Control Hook for Text Areas
 * Manages undo/redo functionality with a state stack
 * 
 * @param {string} initialState - Initial text value
 * @returns {Object} { value, setValue, undo, redo, canUndo, canRedo }
 */
export function useHistory(initialState = '') {
  const [value, setValueState] = useState(initialState);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isInternalUpdate = useRef(false);
  const previousInitialState = useRef(initialState);

  // Update value and push to history
  const setValue = useCallback((newValue) => {
    // If this is an internal update (from undo/redo), don't push to history
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      setValueState(newValue);
      return;
    }

    // Only push to history if value actually changed
    if (newValue !== value) {
      // Push current value to past
      setPast((prevPast) => [...prevPast, value]);
      
      // Clear future when making a new change
      setFuture([]);
      
      // Update current value
      setValueState(newValue);
    }
  }, [value]);

  // Undo: move current to future, restore from past
  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    isInternalUpdate.current = true;
    setPast(newPast);
    setFuture((prevFuture) => [value, ...prevFuture]);
    setValueState(previous);
  }, [past, value]);

  // Redo: move current to past, restore from future
  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    isInternalUpdate.current = true;
    setPast((prevPast) => [...prevPast, value]);
    setFuture(newFuture);
    setValueState(next);
  }, [future, value]);

  // Reset history when initialState changes externally (not from internal updates)
  useEffect(() => {
    if (initialState !== previousInitialState.current) {
      previousInitialState.current = initialState;
      // Only reset if this is an external change (not from undo/redo)
      if (!isInternalUpdate.current) {
        setValueState(initialState);
        setPast([]);
        setFuture([]);
      }
    }
  }, [initialState]);

  return {
    value,
    setValue,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

