import React from "react";
import { View, Text, Image } from "react-native";
import { Avatar, useTheme } from "react-native-paper";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

export default function SmartProfileCard({ user }) {
  const theme = useTheme();

  if (!user) return null;

  const displayName =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim();

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <View
      style={{
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        
      }}
    >
      {/* Avatar */}
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            borderWidth: 3,
            borderColor: "rgba(255,255,255,0.25)",
          }}
        />
      ) : (
        <Avatar.Text
          label={<Text style={{color:'white'}}>{initials}</Text>}
          size={90}
          style={{
            backgroundColor: theme.colors.primary,
            
          }}
        />
      )}

      {/* Name */}
      <Text
        style={{
          marginTop: 12,
          fontSize: 22,
          fontWeight: "700",
        
        }}
      >
        {displayName}
      </Text>

      {/* Role */}
      {user.role && (
        <Text
          style={{
            marginTop: 4,
            fontSize: 14,
   
            opacity: 0.85,
          }}
        >
          {capitalizeFirstLetter(user.role)}
        </Text>
      )}
    </View>
  );
}
