// src/components/SmartInputs/PaymentButton.native.js
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Portal, Dialog, Text, useTheme } from 'react-native-paper';

export default function PaymentButton({ label = "Pay Now", onStatusChange, mode = "edit" }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

//   if (mode === "read") {
//     return (
//       <View style={{ marginVertical: 4 }}>
//         <Button mode="contained-tonal" disabled>
//           {label}
//         </Button>
//       </View>
//     );
//   }

  return (
    <View style={{ marginVertical: 4 }}>
      <Button mode="contained" onPress={() => setVisible(true)}>
        {label}
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Update Payment Status</Dialog.Title>

          <Dialog.Content>
            <Text>Select a new status:</Text>
          </Dialog.Content>

          <Dialog.Actions style={{ flexDirection: "column", gap: 10, padding: 16 }}>
            <Button
              mode="contained"
              style={{ backgroundColor: theme.colors.primary }}
              onPress={() => {
                onStatusChange?.("Paid");
                setVisible(false);
              }}
            >
              Mark as Paid
            </Button>

            <Button
              mode="contained"
              style={{ backgroundColor: theme.colors.error }}
              onPress={() => {
                onStatusChange?.("Canceled");
                setVisible(false);
              }}
            >
              Mark as Canceled
            </Button>

            <Button
              mode="contained"
              style={{ backgroundColor: theme.colors.secondary }}
              onPress={() => {
                onStatusChange?.("Unpaid");
                setVisible(false);
              }}
            >
              Mark as Unpaid
            </Button>

            <Button onPress={() => setVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
