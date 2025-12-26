import * as React from "react";
import { Pressable, PressableProps, View } from "react-native";
import { cn } from "@/lib/utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface IconButtonProps extends PressableProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  className?: string;
}

const IconButton = React.forwardRef<View, IconButtonProps>(
  ({ icon, size = 24, color, className, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(
          "items-center justify-center rounded-full p-2",
          props.disabled && "opacity-50",
          className
        )}
        {...props}
      >
        <MaterialCommunityIcons
          name={icon}
          size={size}
          color={color || "#1C1B1F"}
        />
      </Pressable>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
