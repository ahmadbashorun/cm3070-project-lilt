"use client";

import { useMemo, useCallback, memo } from "react";
import styles from "./SVGKeyboard.module.scss";

interface SVGKeyboardProps {
  highlightedKeys: Set<string>;
}

interface KeyDef {
  label: string;
  width: number;
  x: number;
  y: number;
  displayLabel?: string;
}

interface KeySpec {
  label: string;
  width?: number;
  displayLabel?: string;
}

const KEY_WIDTH = 44;
const KEY_HEIGHT = 44;
const KEY_SPACING = 6;
const ROW_SPACING = 8;
const BASE_X = 20;
const BASE_Y = 20;
const KEYBOARD_WIDTH = 1000;
const KEYBOARD_HEIGHT = 330;
const ARROW_KEY_HEIGHT = 20;

function calculateRowLayout(
  keys: KeySpec[],
  availableWidth: number
): { keys: KeyDef[]; totalWidth: number } {
  const minKeyWidth = KEY_WIDTH;
  const keyCount = keys.length;
  const totalSpacing = (keyCount - 1) * KEY_SPACING;

  let minTotalWidth = totalSpacing;
  let x = BASE_X;
  const keyDefs = new Array<KeyDef>(keyCount);

  for (let i = 0; i < keyCount; i++) {
    const key = keys[i];
    if (key) {
      const baseWidth = (key.width || 1) * minKeyWidth;
      minTotalWidth += baseWidth;
    }
  }

  const extraSpace = Math.max(0, availableWidth - minTotalWidth);
  const spacePerKey = extraSpace / keyCount;

  for (let i = 0; i < keyCount; i++) {
    const key = keys[i];
    if (key) {
      const baseWidth = (key.width || 1) * minKeyWidth;
      const adjustedWidth = baseWidth + spacePerKey;
      keyDefs[i] = {
        label: key.label,
        width: adjustedWidth,
        x,
        y: 0,
        displayLabel: key.displayLabel || key.label,
      };
      x += adjustedWidth + KEY_SPACING;
    }
  }

  const actualTotalWidth = x - BASE_X - KEY_SPACING;
  return { keys: keyDefs, totalWidth: actualTotalWidth };
}

const KEY_LAYOUTS = {
  functionRow: [
    { label: "Escape", displayLabel: "esc" },
    { label: "F1" },
    { label: "F2" },
    { label: "F3" },
    { label: "F4" },
    { label: "F5" },
    { label: "F6" },
    { label: "F7" },
    { label: "F8" },
    { label: "F9" },
    { label: "F10" },
    { label: "F11" },
    { label: "F12" },
    { label: "Power", width: 1.5, displayLabel: "●" },
  ],
  numberRow: [
    { label: "`", displayLabel: "~ `" },
    { label: "1", displayLabel: "1 !" },
    { label: "2", displayLabel: "2 @" },
    { label: "3", displayLabel: "3 #" },
    { label: "4", displayLabel: "4 $" },
    { label: "5", displayLabel: "5 %" },
    { label: "6", displayLabel: "6 ^" },
    { label: "7", displayLabel: "7 &" },
    { label: "8", displayLabel: "8 *" },
    { label: "9", displayLabel: "9 (" },
    { label: "0", displayLabel: "0 )" },
    { label: "-", displayLabel: "- _" },
    { label: "=", displayLabel: "= +" },
    { label: "Backspace", width: 2 },
  ],
  qwertyRow: [
    { label: "Tab", width: 1.5 },
    { label: "Q" },
    { label: "W" },
    { label: "E" },
    { label: "R" },
    { label: "T" },
    { label: "Y" },
    { label: "U" },
    { label: "I" },
    { label: "O" },
    { label: "P" },
    { label: "[", displayLabel: "[ {" },
    { label: "]", displayLabel: "] }" },
    { label: "\\", displayLabel: "\\ |" },
  ],
  asdfRow: [
    { label: "CapsLock", width: 1.75, displayLabel: "caps lock" },
    { label: "A" },
    { label: "S" },
    { label: "D" },
    { label: "F" },
    { label: "G" },
    { label: "H" },
    { label: "J" },
    { label: "K" },
    { label: "L" },
    { label: ";", displayLabel: "; :" },
    { label: "'", displayLabel: "' \"" },
    { label: "Enter", width: 2.25, displayLabel: "return" },
  ],
  zxcvRow: [
    { label: "Shift", width: 2.25 },
    { label: "Z" },
    { label: "X" },
    { label: "C" },
    { label: "V" },
    { label: "B" },
    { label: "N" },
    { label: "M" },
    { label: ",", displayLabel: ", <" },
    { label: ".", displayLabel: ". >" },
    { label: "/", displayLabel: "/ ?" },
    { label: "Shift", width: 2.75 },
  ],
  bottomRowKeys: [
    { label: "fn", width: 1 },
    { label: "Control", width: 1.25, displayLabel: "control" },
    { label: "Option", width: 1.25, displayLabel: "option" },
    { label: "Command", width: 1.25, displayLabel: "⌘" },
    { label: "Space", width: 6.5, displayLabel: "" },
    { label: "Command", width: 1.25, displayLabel: "⌘" },
    { label: "Option", width: 1.25, displayLabel: "option" },
  ],
};

function SVGKeyboard({
  highlightedKeys,
}: SVGKeyboardProps): React.ReactElement {
  const availableWidth = KEYBOARD_WIDTH - BASE_X * 2;
  const arrowKeysAreaWidth = KEY_WIDTH * 3 + KEY_SPACING * 2;
  const bottomRowAvailableWidth =
    availableWidth - arrowKeysAreaWidth - KEY_SPACING;

  const layout = useMemo(() => {
    const functionRow = calculateRowLayout(
      KEY_LAYOUTS.functionRow,
      availableWidth
    );
    const numberRow = calculateRowLayout(KEY_LAYOUTS.numberRow, availableWidth);
    const qwertyRow = calculateRowLayout(KEY_LAYOUTS.qwertyRow, availableWidth);
    const asdfRow = calculateRowLayout(KEY_LAYOUTS.asdfRow, availableWidth);
    const zxcvRow = calculateRowLayout(KEY_LAYOUTS.zxcvRow, availableWidth);
    const bottomRow = calculateRowLayout(
      KEY_LAYOUTS.bottomRowKeys,
      bottomRowAvailableWidth
    );

    return {
      functionRow,
      numberRow,
      qwertyRow,
      asdfRow,
      zxcvRow,
      bottomRow,
    };
  }, [availableWidth, bottomRowAvailableWidth]);

  const allKeys = useMemo(() => {
    const { functionRow, numberRow, qwertyRow, asdfRow, zxcvRow, bottomRow } =
      layout;
    const bottomRowY = BASE_Y + (KEY_HEIGHT + ROW_SPACING) * 5;
    const arrowKeysStartX = KEYBOARD_WIDTH - BASE_X - arrowKeysAreaWidth;
    const arrowUpDownX = arrowKeysStartX + KEY_WIDTH + KEY_SPACING;
    const arrowUpY = bottomRowY + 2;
    const arrowDownY = bottomRowY + KEY_HEIGHT - ARROW_KEY_HEIGHT - 2;

    const arrowKeys: KeyDef[] = [
      {
        label: "◄",
        width: KEY_WIDTH,
        x: arrowKeysStartX,
        y: bottomRowY,
        displayLabel: "◄",
      },
      {
        label: "▲",
        width: KEY_WIDTH,
        x: arrowUpDownX,
        y: arrowUpY,
        displayLabel: "▲",
      },
      {
        label: "▼",
        width: KEY_WIDTH,
        x: arrowUpDownX,
        y: arrowDownY,
        displayLabel: "▼",
      },
      {
        label: "►",
        width: KEY_WIDTH,
        x: arrowKeysStartX + (KEY_WIDTH + KEY_SPACING) * 2,
        y: bottomRowY,
        displayLabel: "►",
      },
    ];

    const keysWithY = [
      ...functionRow.keys.map((key) => ({ ...key, y: BASE_Y })),
      ...numberRow.keys.map((key) => ({
        ...key,
        y: BASE_Y + KEY_HEIGHT + ROW_SPACING,
      })),
      ...qwertyRow.keys.map((key) => ({
        ...key,
        y: BASE_Y + (KEY_HEIGHT + ROW_SPACING) * 2,
      })),
      ...asdfRow.keys.map((key) => ({
        ...key,
        y: BASE_Y + (KEY_HEIGHT + ROW_SPACING) * 3,
      })),
      ...zxcvRow.keys.map((key) => ({
        ...key,
        y: BASE_Y + (KEY_HEIGHT + ROW_SPACING) * 4,
      })),
      ...bottomRow.keys.map((key) => ({ ...key, y: bottomRowY })),
      ...arrowKeys,
    ];

    return keysWithY;
  }, [layout, arrowKeysAreaWidth]);

  const svgHeight = KEYBOARD_HEIGHT;

  const renderKey = useCallback(
    (keyDef: KeyDef, index: number) => {
      const isHighlighted = highlightedKeys.has(keyDef.label);
      const isSpace = keyDef.label === "Space";
      const isArrow = ["◄", "▲", "▼", "►"].includes(keyDef.label);
      const isStackedArrow = keyDef.label === "▲" || keyDef.label === "▼";
      const keyHeight = isStackedArrow ? ARROW_KEY_HEIGHT : KEY_HEIGHT;

      return (
        <g key={`key-${index}`}>
          <rect
            x={keyDef.x}
            y={keyDef.y}
            width={keyDef.width}
            height={keyHeight}
            rx={8}
            fill={
              isHighlighted ? "url(#keyGradientHighlight)" : "url(#keyGradient)"
            }
            stroke={isHighlighted ? "#c0c0c2" : "#d0d0d2"}
            strokeWidth={1}
            filter={
              isHighlighted ? "url(#keyShadowHighlight)" : "url(#keyShadow)"
            }
            className={styles.keyRect}
          />
          {!isSpace && (
            <text
              x={keyDef.x + keyDef.width / 2}
              y={keyDef.y + keyHeight / 2 + (isArrow ? 4 : 6)}
              textAnchor="middle"
              fontSize={isArrow ? "14" : "12"}
              fill={isHighlighted ? "#1d1d1f" : "#1d1d1f"}
              fontWeight="500"
              className={styles.keyText}
            >
              {keyDef.displayLabel || keyDef.label}
            </text>
          )}
        </g>
      );
    },
    [highlightedKeys]
  );

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${KEYBOARD_WIDTH} ${svgHeight}`}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="keyboardShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="keyShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="keyShadowHighlight"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="keyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#f8f8f8" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="keyGradientHighlight"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#e8e8ea" stopOpacity="1" />
            <stop offset="100%" stopColor="#e0e0e2" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={KEYBOARD_WIDTH}
          height={svgHeight}
          rx="12"
          fill="#f5f5f7"
          filter="url(#keyboardShadow)"
          className={styles.keyboardBase}
        />
        {allKeys.map((keyDef, index) => renderKey(keyDef, index))}
      </svg>
    </div>
  );
}

export default memo(SVGKeyboard);
