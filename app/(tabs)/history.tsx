// app/(tabs)/history.tsx
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import CustomHeader from "../../components/CustomHeader";

export default function HistoryScreen() {
  const theme = useTheme();
  // TODO: 임시 데이터. 나중에 AsyncStorage에서 불러옵니다.
  const historyItems = [];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.primary }]}>
      {/* 1. 커스텀 헤더 */}
      <CustomHeader title="연습 히스토리" />

      {/* 2. 콘텐츠 영역 */}
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {historyItems.length === 0 ? (
          // 히스토리가 없을 때
          <View style={styles.emptyContainer}>
            <View style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyText}>
                  아직 저장된 연습 기록이 없습니다.
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubText}>
                  메인 화면에서 연습을 완료하고 저장해 보세요.
                </Text>
              </Card.Content>
            </View>
          </View>
        ) : (
          // 히스토리가 있을 때 (ScrollView 사용)
          <ScrollView>
            <Text>TODO: 히스토리 목록</Text>
            {/* TODO: 여기에 FlatList 또는 map으로 히스토리 카드 렌더링 */}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50, // 탭 바 높이 고려
  },
  card: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  emptySubText: {
    textAlign: "center",
    marginTop: 8,
    color: "#666",
  },
});
