// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import CustomHeader from "../../components/CustomHeader";

const { width } = Dimensions.get("window");

export default function MainScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(
    null
  );

  // 애니메이션 값들
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // 예시 문장들
  const templates = [
    // "안녕하세요, 만나서 반갑습니다",
    "안녕하세요",
    "오늘 날씨가 정말 좋네요",
  ];

  useEffect(() => {
    // 페이지 로드 시 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTemplateSelect = (template: string) => {
    setText(template);
    setSelectedTemplate(template);
  };

  const handleClear = () => {
    setText("");
    setSelectedTemplate(null);
  };

  return (
    <KeyboardAvoidingView style={styles.gradient}>
      <CustomHeader title="발음 연습" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* 헤더 섹션 */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Surface style={styles.iconContainer} elevation={0}>
              <View style={styles.iconBackground}>
                <Text style={styles.iconEmoji}>🎤</Text>
              </View>
            </Surface>

            <Text variant="displaySmall" style={styles.title}>
              발음 연습
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              연습할 문장을 입력하세요
            </Text>
          </Animated.View>

          {/* 입력 카드 */}
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Card style={styles.inputCard} mode="elevated" elevation={0}>
              <Card.Content>
                <View style={styles.inputHeader}>
                  <Text variant="titleMedium" style={styles.inputTitle}>
                    연습 문장
                  </Text>
                  {text.length > 0 && (
                    <IconButton
                      icon="close-circle"
                      size={20}
                      onPress={handleClear}
                      style={styles.clearButton}
                    />
                  )}
                </View>

                <TextInput
                  value={text}
                  onChangeText={setText}
                  mode="flat"
                  multiline
                  numberOfLines={3}
                  placeholder="연습하고 싶은 문장을 입력하세요..."
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor={theme.colors.primary}
                  contentStyle={styles.inputContent}
                />

                {text.length > 0 && (
                  <View style={styles.charCount}>
                    <Text variant="bodySmall" style={styles.charCountText}>
                      {text.length}자
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </Animated.View>

          {/* 템플릿 섹션 */}
          <Animated.View
            style={[styles.templatesSection, { opacity: fadeAnim }]}
          >
            <Text variant="titleSmall" style={styles.templateTitle}>
              🌟 추천 문장
            </Text>
            <View style={styles.chipContainer}>
              {templates.map((template, index) => (
                <Chip
                  key={index}
                  selected={selectedTemplate === template}
                  onPress={() => handleTemplateSelect(template)}
                  style={[
                    styles.chip,
                    selectedTemplate === template && styles.selectedChip,
                  ]}
                  textStyle={styles.chipText}
                  mode="outlined"
                  showSelectedCheck={false}
                >
                  {template}
                </Chip>
              ))}
            </View>
          </Animated.View>

          {/* 버튼 섹션 */}
          <Animated.View style={[styles.buttonSection, { opacity: fadeAnim }]}>
            <Button
              mode="contained"
              onPress={() =>
                router.push({ pathname: "/record", params: { text } })
              }
              disabled={text.trim().length === 0}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="microphone"
              uppercase={false}
            >
              녹음 시작하기
            </Button>

            <Text variant="bodySmall" style={styles.hint}>
              💡 마이크 권한이 필요합니다
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    backgroundColor: "#E8E6FF",
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "500",
  },
  cardContainer: {
    marginBottom: 24,
  },
  inputCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputTitle: {
    fontWeight: "600",
    color: "#374151",
  },
  clearButton: {
    margin: -8,
  },
  input: {
    backgroundColor: "rgba(243, 244, 246, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  inputContent: {
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  charCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  charCountText: {
    color: "#9CA3AF",
  },
  templatesSection: {
    marginBottom: 32,
  },
  templateTitle: {
    marginBottom: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: "#E0E7FF",
    borderColor: "#6366F1",
  },
  chipText: {
    fontSize: 14,
  },
  buttonSection: {
    alignItems: "center",
  },
  button: {
    borderRadius: 28,
    width: width - 80,
    elevation: 8,
    backgroundColor: "#6366F1",
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
