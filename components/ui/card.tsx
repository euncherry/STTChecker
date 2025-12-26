import * as React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

interface CardProps extends ViewProps {
  className?: string;
}

const Card = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-4", className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

const CardTitle = React.forwardRef<View, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View ref={ref} {...props}>
        <Text
          className={cn(
            "text-lg font-semibold leading-none tracking-tight text-card-foreground",
            className
          )}
        >
          {children}
        </Text>
      </View>
    );
  }
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

const CardDescription = React.forwardRef<View, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View ref={ref} {...props}>
        <Text className={cn("text-sm text-muted-foreground", className)}>
          {children}
        </Text>
      </View>
    );
  }
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return <View ref={ref} className={cn("p-4 pt-0", className)} {...props} />;
  }
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn("flex flex-row items-center p-4 pt-0", className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
