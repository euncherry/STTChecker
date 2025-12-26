import * as React from "react";
import { Modal, Pressable, View, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

interface TooltipTextProps {
  className?: string;
  children?: React.ReactNode;
}

const TooltipText = ({ className, children }: TooltipTextProps) => (
  <Text className={cn("text-sm text-popover-foreground", className)}>
    {children}
  </Text>
);

// Simple Tooltip using Modal for reliable behavior
interface SimpleTooltipProps {
  children: React.ReactElement;
  content: string;
}

const SimpleTooltip = ({ children, content }: SimpleTooltipProps) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>{children}</Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <View className="bg-popover border border-border rounded-lg px-4 py-3 mx-8 max-w-xs shadow-lg">
            <TooltipText>{content}</TooltipText>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export { TooltipText, SimpleTooltip };
