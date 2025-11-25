import React from "react";
import { Box, useTheme } from "@mui/material";

export default function SmartFullCircleGauge({
  label = "Weekly",
  size = 180,
  strokeWidth = 18,

}) {
  const theme = useTheme();
const value = 75;
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth / 2;

  const circumference = 2 * Math.PI * normalizedRadius;

  const clamped = Math.min(Math.max(value, 0), 100);
  const progress = clamped / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
      <svg width={size} height={size}>
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={theme.palette.grey[300]}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={theme.palette.primary.main}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${radius} ${radius})`}
        />

        {/* VALUE */}
        <text
          x={radius}
          y={radius - 5}
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill={theme.palette.text.primary}
        >
          {clamped}
        </text>

        {/* LABEL */}
        <text
          x={radius}
          y={radius + 25}
          textAnchor="middle"
          fontSize="14"
          fill={theme.palette.text.secondary}
        >
          {label}
        </text>
      </svg>
    </Box>
  );
}
