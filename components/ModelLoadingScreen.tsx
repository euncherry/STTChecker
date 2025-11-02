import React from "react";
import { StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  ProgressBar,
  Text,
  useTheme,
} from "react-native-paper";

interface ModelLoadingScreenProps {
  progress: number;
  error: string | null;
}

export default function ModelLoadingScreen({
  progress,
  error,
}: ModelLoadingScreenProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🤖</Text>
          </View>

          <Text variant="headlineSmall" style={styles.title}>
            AI 모델 준비중
          </Text>

          {error ? (
            <>
              <Text
                variant="bodyMedium"
                style={[styles.error, { color: theme.colors.error }]}
              >
                ⚠️ {error}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
              >
                앱을 재시작해주세요
              </Text>
            </>
          ) : (
            <>
              <Text
                variant="bodyMedium"
                style={[
                  styles.subtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                한국어 음성인식 모델을 로딩하고 있습니다
              </Text>

              <ProgressBar
                progress={progress / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />

              <Text
                variant="labelMedium"
                style={[
                  styles.progressText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {Math.round(progress)}%
              </Text>

              {progress < 30 && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statusText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  📚 사전 데이터 로딩중...
                </Text>
              )}
              {progress >= 30 && progress < 80 && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statusText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  🧠 AI 모델 로딩중... (305MB)
                </Text>
              )}
              {progress >= 80 && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statusText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  ⚡ 초기화 마무리중...
                </Text>
              )}
            </>
          )}

          {!error && <ActivityIndicator style={styles.spinner} />}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  error: {
    textAlign: "center",
    marginVertical: 16,
  },
  hint: {
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    marginBottom: 16,
  },
  statusText: {
    marginBottom: 16,
  },
  spinner: {
    marginTop: 16,
  },
});
