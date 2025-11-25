import React, { useEffect } from "react";
import { View, Text, Button } from "react-native";
import { useTerminal } from "../context/TerminalContext";

export default function ReaderManagerScreen() {
  const {
    connectedReader,
    discoverReaders,
    connectReader,
    discoveredReaders,
    connectionStatus,
    reconnect,
  } = useTerminal();

  useEffect(() => {
    console.log("ReaderManager mounted");
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Reader Status: {connectedReader ? "Connected" : "Not Connected"}
      </Text>

      {/* Show connected reader info */}
      {connectedReader && (
        <>
          <Text>Device: {connectedReader.deviceType}</Text>
          <Text>Serial: {connectedReader.serialNumber}</Text>
        </>
      )}

      {/* Discover */}
      <Button
        title="Discover Readers"
        onPress={() => discoverReaders({ discoveryMethod: "simulated" })}
      />

      {/* Display Readers */}
      {discoveredReaders?.map((r, i) => (
        <Button
          key={i}
          title={`Connect to ${r.deviceType} (${r.serialNumber})`}
          onPress={() => connectReader(r)}
        />
      ))}

      {/* Reconnect */}
      <Button title="Reconnect" onPress={reconnect} />
    </View>
  );
}
