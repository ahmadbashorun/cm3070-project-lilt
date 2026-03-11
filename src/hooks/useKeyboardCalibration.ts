"use client";

import { useReducer, useCallback, useRef } from "react";
import type { KeystrokeEvent } from "@/utils/calibrationHelpers";

interface UseKeyboardCalibrationReturn {
  typedText: string;
  currentPosition: number;
  highlightedKeys: Set<string>;
  highlightedChars: Set<number>;
  isComplete: boolean;
  errorCount: number;
  keystrokeEvents: KeystrokeEvent[];
  handleKeyPress: (key: string) => void;
  reset: () => void;
}

const KEY_HIGHLIGHT_DURATION = 300;

interface CalibrationState {
  typedText: string;
  currentPosition: number;
  highlightedKeys: Set<string>;
  highlightedChars: Set<number>;
  errorCount: number;
}

type CalibrationAction =
  | { type: "KEY_PRESS"; key: string; targetChar: string; isCorrect: boolean }
  | { type: "BACKSPACE"; newText: string; newPosition: number }
  | { type: "ADD_HIGHLIGHT_CHAR"; position: number }
  | { type: "REMOVE_HIGHLIGHT_CHAR"; position: number }
  | { type: "ADD_HIGHLIGHT_KEY"; key: string }
  | { type: "REMOVE_HIGHLIGHT_KEY"; key: string }
  | { type: "INCREMENT_ERROR" }
  | { type: "RESET" };

function getDisplayKey(key: string): string {
  if (key === " ") return "Space";
  if (key === "\n" || key === "Enter") return "Enter";
  if (key === "Backspace") return "Backspace";
  if (key === "Tab") return "Tab";
  if (key === "Escape" || key === "Esc") return "Escape";
  if (key.length === 1) {
    if (/[a-zA-Z]/.test(key)) {
      return key.toUpperCase();
    }
    return key;
  }
  return key;
}

function calibrationReducer(
  state: CalibrationState,
  action: CalibrationAction
): CalibrationState {
  switch (action.type) {
    case "KEY_PRESS": {
      const newHighlightedChars = new Set(state.highlightedChars);
      newHighlightedChars.add(state.currentPosition);
      return {
        ...state,
        typedText: state.typedText + action.targetChar,
        currentPosition: state.currentPosition + 1,
        highlightedChars: newHighlightedChars,
      };
    }
    case "BACKSPACE": {
      if (!state.highlightedChars.has(action.newPosition)) {
        return {
          ...state,
          typedText: action.newText,
          currentPosition: action.newPosition,
        };
      }
      const newHighlightedChars = new Set(state.highlightedChars);
      newHighlightedChars.delete(action.newPosition);
      return {
        ...state,
        typedText: action.newText,
        currentPosition: action.newPosition,
        highlightedChars: newHighlightedChars,
      };
    }
    case "ADD_HIGHLIGHT_CHAR": {
      if (state.highlightedChars.has(action.position)) {
        return state;
      }
      const newHighlightedChars = new Set(state.highlightedChars);
      newHighlightedChars.add(action.position);
      return {
        ...state,
        highlightedChars: newHighlightedChars,
      };
    }
    case "REMOVE_HIGHLIGHT_CHAR": {
      if (!state.highlightedChars.has(action.position)) {
        return state;
      }
      const newHighlightedChars = new Set(state.highlightedChars);
      newHighlightedChars.delete(action.position);
      return {
        ...state,
        highlightedChars: newHighlightedChars,
      };
    }
    case "ADD_HIGHLIGHT_KEY": {
      if (state.highlightedKeys.has(action.key)) {
        return state;
      }
      const newHighlightedKeys = new Set(state.highlightedKeys);
      newHighlightedKeys.add(action.key);
      return {
        ...state,
        highlightedKeys: newHighlightedKeys,
      };
    }
    case "REMOVE_HIGHLIGHT_KEY": {
      if (!state.highlightedKeys.has(action.key)) {
        return state;
      }
      const newHighlightedKeys = new Set(state.highlightedKeys);
      newHighlightedKeys.delete(action.key);
      return {
        ...state,
        highlightedKeys: newHighlightedKeys,
      };
    }
    case "INCREMENT_ERROR":
      return {
        ...state,
        errorCount: state.errorCount + 1,
      };
    case "RESET":
      return {
        typedText: "",
        currentPosition: 0,
        highlightedKeys: new Set(),
        highlightedChars: new Set(),
        errorCount: 0,
      };
    default:
      return state;
  }
}

const initialState: CalibrationState = {
  typedText: "",
  currentPosition: 0,
  highlightedKeys: new Set(),
  highlightedChars: new Set(),
  errorCount: 0,
};

export function useKeyboardCalibration(
  targetText: string
): UseKeyboardCalibrationReturn {
  const [state, dispatch] = useReducer(calibrationReducer, initialState);
  const highlightTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const keystrokeEventsRef = useRef<KeystrokeEvent[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const highlightKey = useCallback((key: string) => {
    const existingTimer = highlightTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    dispatch({ type: "ADD_HIGHLIGHT_KEY", key });

    const timer = setTimeout(() => {
      dispatch({ type: "REMOVE_HIGHLIGHT_KEY", key });
      highlightTimersRef.current.delete(key);
    }, KEY_HIGHLIGHT_DURATION);

    highlightTimersRef.current.set(key, timer);
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      const currentState = stateRef.current;
      if (currentState.currentPosition >= targetText.length) {
        return;
      }

      if (key === "Backspace") {
        if (
          currentState.typedText.length > 0 &&
          currentState.currentPosition > 0
        ) {
          const newTypedText = currentState.typedText.slice(0, -1);
          const newPosition = currentState.currentPosition - 1;
          dispatch({
            type: "BACKSPACE",
            newText: newTypedText,
            newPosition,
          });
          highlightKey("Backspace");
          keystrokeEventsRef.current.push({
            key: "Backspace",
            timestamp: performance.now(),
            isError: false,
          });
        }
        return;
      }

      const targetChar = targetText[currentState.currentPosition];
      if (targetChar === undefined) {
        return;
      }

      const isLetter = /[a-zA-Z]/.test(targetChar);
      const isCorrect = isLetter
        ? key.toLowerCase() === targetChar.toLowerCase()
        : key === targetChar;

      const timestamp = performance.now();

      if (isCorrect) {
        dispatch({
          type: "KEY_PRESS",
          key,
          targetChar,
          isCorrect: true,
        });

        const displayKey = getDisplayKey(key);
        highlightKey(displayKey);
        keystrokeEventsRef.current.push({
          key,
          timestamp,
          isError: false,
        });
      } else {
        dispatch({ type: "INCREMENT_ERROR" });
        keystrokeEventsRef.current.push({
          key,
          timestamp,
          isError: true,
        });
      }
    },
    [targetText, highlightKey]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    highlightTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    highlightTimersRef.current.clear();
    keystrokeEventsRef.current = [];
  }, []);

  const isComplete = state.currentPosition >= targetText.length;

  return {
    typedText: state.typedText,
    currentPosition: state.currentPosition,
    highlightedKeys: state.highlightedKeys,
    highlightedChars: state.highlightedChars,
    isComplete,
    errorCount: state.errorCount,
    keystrokeEvents: [...keystrokeEventsRef.current],
    handleKeyPress,
    reset,
  };
}
