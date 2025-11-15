import React from "react";
import { View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "react-native-paper";

export default function SmartFullCircleGauge({
  label = "Weekly",
  size = 180,
  strokeWidth = 18,
}) {
  const theme = useTheme();
  const value = 50;       // 0–100

  // This matches your WORKING logic
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth / 2;

  const circumference = 2 * Math.PI * normalizedRadius;

  // EXACT math from your working RewardsProgressCircle
  const clamped = Math.min(Math.max(value, 0), 100);
  const progress = clamped / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: "center", marginVertical: 20 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>

        {/* Track */}
        <Circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={theme.colors.surfaceVariant}     // nice background
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <Circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}   // THIS IS REQUIRED
        />

        {/* VALUE */}
        <SvgText
          x={radius}
          y={radius - 5}
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill={theme.colors.onBackground}
        >
          {clamped}
        </SvgText>

        {/* LABEL */}
        <SvgText
          x={radius}
          y={radius + 25}
          textAnchor="middle"
          fontSize="14"
          fill={theme.colors.onSurfaceVariant}
        >
          {label}
        </SvgText>

      </Svg>
    </View>
  );
}
