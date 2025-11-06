// app/results.tsx
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";

export default function ResultsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text variant="headlineMedium" style={styles.pageTitle}>
        분석 결과!
      </Text>

      {/* 점수 카드 */}
      <Card style={styles.card} mode="elevated">
        <Card.Title title="정확도 점수 (임시)" />
        <Card.Content style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text variant="headlineLarge" style={styles.score}>
              85%
            </Text>
            <Text variant="labelLarge">CER</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text variant="headlineLarge" style={styles.score}>
              78%
            </Text>
            <Text variant="labelLarge">WER</Text>
          </View>
        </Card.Content>
      </Card>

      {/* 문장 비교 카드 */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium">목표 문장</Text>
          <Text variant="bodyLarge" style={styles.sentence}>
            (메인 화면에서 입력한 문장)
          </Text>
          <View style={styles.divider} />
          <Text variant="titleMedium">내 발음 (STT)</Text>
          <Text variant="bodyLarge" style={styles.sentence}>
            (ONNX 모델이 변환한 문장)
          </Text>
        </Card.Content>
      </Card>

      {/* 태그 카드 */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium">태그 (TODO)</Text>
          <View style={styles.chipContainer}>
            <Chip icon="check" selected>
              받침 연습
            </Chip>
            <Chip icon="plus" onPress={() => {}}>
              태그 추가
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 버튼 */}
      <Button
        mode="contained"
        onPress={() => {}} // TODO: 히스토리 저장
        style={styles.button}
      >
        히스토리에 저장
      </Button>
      <Button
        mode="outlined"
        onPress={() => router.back()} // TODO: 다시하기 (녹음 페이지로?)
        style={styles.button}
      >
        다시하기
      </Button>
      <Button
        mode="text"
        onPress={() => router.push("/(tabs)")}
        style={styles.button}
      >
        홈으로
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  pageTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  scoreBox: {
    alignItems: "center",
  },
  score: {
    fontWeight: "bold",
  },
  sentence: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  button: {
    marginTop: 10,
  },
});
