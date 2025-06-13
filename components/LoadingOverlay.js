// components/LoadingOverlay.js
import { COLORS } from "@/constants/Colors";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

export default function LoadingOverlay({ visible }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
