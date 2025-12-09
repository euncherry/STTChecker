/**
 * @file components/AndroidUpgradeModal.tsx
 * @description Android 12 이하 사용자에게 업그레이드 안내를 표시하는 모달
 */

import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AndroidUpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  androidVersion: number | null;
}

export default function AndroidUpgradeModal({
  visible,
  onDismiss,
  androidVersion,
}: AndroidUpgradeModalProps) {
  const theme = useTheme();

  const handleOpenSettings = () => {
    // Android 시스템 업데이트 설정 열기
    Linking.openSettings();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="android"
            size={64}
            color={theme.colors.primary}
          />
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Android 업데이트 권장
        </Text>

        <Text variant="bodyMedium" style={styles.description}>
          현재 Android {androidVersion || '12 이하'} 버전을 사용 중입니다.
        </Text>

        <View style={styles.featureList}>
          <Text variant="bodyMedium" style={styles.featureTitle}>
            Android 13 이상에서 사용 가능한 기능:
          </Text>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="microphone"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={styles.featureText}>
              실시간 음성 인식 (말하는 동안 텍스트 표시)
            </Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={styles.featureText}>
              오프라인 음성 인식 (인터넷 불필요)
            </Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={styles.featureText}>
              더 정확한 발음 분석
            </Text>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.note}>
          현재 버전에서도 녹음 후 발음 분석은 정상적으로 사용 가능합니다.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
          >
            나중에
          </Button>
          <Button
            mode="contained"
            onPress={handleOpenSettings}
            style={styles.button}
          >
            설정 열기
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  featureList: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  note: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
