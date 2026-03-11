"use client";

import { useMemo } from "react";
import styles from "./StressChart.module.scss";

interface DataPoint {
  timestamp: number;
  value: number;
}

interface StressChartProps {
  data: {
    facial: DataPoint[];
    postural: DataPoint[];
    behavioral: DataPoint[];
    contextual: DataPoint[];
    temporal: DataPoint[];
    overall: DataPoint[];
    stressLevel: DataPoint[];
  };
  width?: number;
  height?: number;
}

const COLORS = {
  facial: "#ef4444",
  postural: "#f59e0b",
  behavioral: "#8b5cf6",
  contextual: "#06b6d4",
  temporal: "#10b981",
  overall: "#3b82f6",
  stressLevel: "#6366f1",
};

const INDICATOR_LABELS = {
  facial: "Facial Stress",
  postural: "Postural Stress",
  behavioral: "Behavioral Stress",
  contextual: "Contextual Load",
  temporal: "Temporal Factor",
  overall: "Overall Score",
  stressLevel: "Stress Level",
};

export default function StressChart({
  data,
  width = 400,
  height = 200,
}: StressChartProps): React.ReactElement {
  const padding = { top: 20, right: 30, bottom: 30, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Combine all data points to determine time range
  const allDataPoints = useMemo(() => {
    const all: DataPoint[] = [];
    Object.values(data).forEach((series) => {
      all.push(...series);
    });
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const timeRange = useMemo(() => {
    if (allDataPoints.length === 0) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }
    const first = allDataPoints[0];
    const last = allDataPoints[allDataPoints.length - 1];
    if (!first || !last) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }
    const min = first.timestamp;
    const max = last.timestamp;
    // Extend range slightly for better visualization
    const range = max - min || 3600000; // Default to 1 hour if no range
    return {
      min: min - range * 0.1,
      max: max + range * 0.1,
    };
  }, [allDataPoints]);

  const valueRange = useMemo(() => ({ min: 0, max: 100 }), []);

  // Scale functions - memoized to avoid dependency issues
  const scaleX = useMemo(() => {
    return (timestamp: number): number => {
      const timeDiff = timeRange.max - timeRange.min;
      if (timeDiff === 0) return padding.left;
      const ratio = (timestamp - timeRange.min) / timeDiff;
      return padding.left + ratio * chartWidth;
    };
  }, [timeRange, padding.left, chartWidth]);

  const scaleY = useMemo(() => {
    return (value: number): number => {
      const valueDiff = valueRange.max - valueRange.min;
      if (valueDiff === 0) return padding.top + chartHeight / 2;
      const ratio = (value - valueRange.min) / valueDiff;
      return padding.top + chartHeight - ratio * chartHeight;
    };
  }, [valueRange, padding.top, chartHeight]);

  // Generate path for a data series
  const generatePath = useMemo(() => {
    return (points: DataPoint[]): string => {
      if (points.length === 0) return "";
      const firstPoint = points[0];
      if (!firstPoint) return "";
      if (points.length === 1) {
        const x = scaleX(firstPoint.timestamp);
        const y = scaleY(firstPoint.value);
        return `M ${x} ${y}`;
      }

      let path = `M ${scaleX(firstPoint.timestamp)} ${scaleY(
        firstPoint.value
      )}`;

      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        if (!point) continue;
        const x = scaleX(point.timestamp);
        const y = scaleY(point.value);
        path += ` L ${x} ${y}`;
      }

      return path;
    };
  }, [scaleX, scaleY]);

  // Format time for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: Array<{ x?: number; y?: number; label?: string }> = [];

    // Horizontal grid lines (value markers)
    for (let i = 0; i <= 5; i++) {
      const value = (valueRange.max - valueRange.min) * (i / 5);
      const y = scaleY(value);
      lines.push({
        y,
        label: Math.round(value).toString(),
      });
    }

    // Vertical grid lines (time markers)
    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const timestamp =
        timeRange.min + ((timeRange.max - timeRange.min) * i) / timeSteps;
      const x = scaleX(timestamp);
      lines.push({
        x,
        label: formatTime(timestamp),
      });
    }

    return lines;
  }, [timeRange, valueRange, scaleX, scaleY]);

  const hasData = allDataPoints.length > 0;

  return (
    <div className={styles.chartContainer}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chart}
      >
        {/* Grid lines */}
        <g className={styles.grid}>
          {gridLines.map((line, idx) => {
            if (line.x !== undefined) {
              return (
                <g key={`v-${idx}`}>
                  <line
                    x1={line.x}
                    y1={padding.top}
                    x2={line.x}
                    y2={height - padding.bottom}
                    className={styles.gridLine}
                  />
                  <text
                    x={line.x}
                    y={height - padding.bottom + 20}
                    className={styles.gridLabel}
                    textAnchor="middle"
                  >
                    {line.label}
                  </text>
                </g>
              );
            }
            if (line.y !== undefined) {
              return (
                <g key={`h-${idx}`}>
                  <line
                    x1={padding.left}
                    y1={line.y}
                    x2={width - padding.right}
                    y2={line.y}
                    className={styles.gridLine}
                  />
                  <text
                    x={padding.left - 10}
                    y={line.y + 4}
                    className={styles.gridLabel}
                    textAnchor="end"
                  >
                    {line.label}
                  </text>
                </g>
              );
            }
            return null;
          })}
        </g>

        {/* Chart area background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          className={styles.chartArea}
        />

        {/* Data lines */}
        {hasData && (
          <g className={styles.dataLines}>
            {data.overall.length > 0 && (
              <path
                d={generatePath(data.overall)}
                fill="none"
                stroke={COLORS.overall}
                strokeWidth="2.5"
                className={styles.dataLine}
              />
            )}
            {data.facial.length > 0 && (
              <path
                d={generatePath(data.facial)}
                fill="none"
                stroke={COLORS.facial}
                strokeWidth="2"
                className={styles.dataLine}
                strokeDasharray="4,4"
              />
            )}
            {data.postural.length > 0 && (
              <path
                d={generatePath(data.postural)}
                fill="none"
                stroke={COLORS.postural}
                strokeWidth="2"
                className={styles.dataLine}
                strokeDasharray="4,4"
              />
            )}
            {data.behavioral.length > 0 && (
              <path
                d={generatePath(data.behavioral)}
                fill="none"
                stroke={COLORS.behavioral}
                strokeWidth="2"
                className={styles.dataLine}
                strokeDasharray="4,4"
              />
            )}
            {data.contextual.length > 0 && (
              <path
                d={generatePath(data.contextual)}
                fill="none"
                stroke={COLORS.contextual}
                strokeWidth="2"
                className={styles.dataLine}
                strokeDasharray="4,4"
              />
            )}
            {data.temporal.length > 0 && (
              <path
                d={generatePath(data.temporal)}
                fill="none"
                stroke={COLORS.temporal}
                strokeWidth="2"
                className={styles.dataLine}
                strokeDasharray="4,4"
              />
            )}
          </g>
        )}

        {/* Stress level as bars */}
        {hasData &&
          data.stressLevel.length > 0 &&
          data.stressLevel.map((point, idx) => {
            const x = scaleX(point.timestamp);
            const barHeight = (point.value / 4) * chartHeight * 0.3;
            const y = scaleY(0) - barHeight;
            return (
              <rect
                key={`stress-${idx}`}
                x={x - 2}
                y={y}
                width="4"
                height={barHeight}
                fill={COLORS.stressLevel}
                opacity={0.6}
                className={styles.stressBar}
              />
            );
          })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          className={styles.axis}
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          className={styles.axis}
        />

        {/* Axis labels - compact for small panel */}
        <text
          x={width / 2}
          y={height - 5}
          className={styles.axisLabel}
          textAnchor="middle"
          fontSize="10"
          opacity="0.6"
        >
          Time
        </text>
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
          const color = COLORS[key as keyof typeof COLORS];
          const hasDataForIndicator = data[key as keyof typeof data].length > 0;
          if (!hasDataForIndicator && key !== "overall") return null;

          return (
            <div key={key} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{
                  backgroundColor: color,
                  borderStyle: key === "overall" ? "solid" : "dashed",
                  borderColor: "#fff",
                }}
              />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
