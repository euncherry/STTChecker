import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

interface WaveSurferWebViewProps {
  /** 표준 발음 오디오 파일 경로 (assets/audio/references/*.wav) - Optional */
  referenceAudioPath?: string;
  /** 사용자 녹음 오디오 파일 경로 (File URI) */
  userAudioPath: string;
  /** WebView 준비 완료 콜백 */
  onReady?: () => void;
  /** 에러 콜백 */
  onError?: (error: string) => void;
}

/**
 * WaveSurfer.js 기반 오디오 시각화 WebView 컴포넌트
 *
 * 3가지 그래프 제공:
 * - Waveform Comparison: 파형 비교
 * - Pitch Contour: 음정 변화
 * - Spectrogram: 주파수 스펙트럼
 *
 * @example
 * ```tsx
 * <WaveSurferWebView
 *   referenceAudioPath="/assets/audio/references/Default.wav"
 *   userAudioPath="file:///data/.../recording_123.wav"
 *   onReady={() => console.log('Ready')}
 * />
 * ```
 */
export default function WaveSurferWebView({
  referenceAudioPath,
  userAudioPath,
  onReady,
  onError,
}: WaveSurferWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // HTML 파일 로드
  useEffect(() => {
    loadHtmlAsset();
  }, []);

  // 오디오 데이터 전송
  useEffect(() => {
    if (htmlUri && userAudioPath) {
      sendAudioData();
    }
  }, [htmlUri, referenceAudioPath, userAudioPath]);

  /**
   * HTML Asset 로드
   */
  const loadHtmlAsset = async () => {
    try {
      console.log('[WaveSurferWebView] 🚀 Loading HTML asset');

      // Asset 로드 (wavesurfer-viewer.html)
      const [asset] = await Asset.loadAsync(
        require('@/assets/webview/wavesurfer-viewer.html')
      );

      console.log('[WaveSurferWebView] ✅ HTML asset loaded:', asset.localUri);
      setHtmlUri(asset.localUri || null);
    } catch (err) {
      const errorMsg = `HTML 로드 실패: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('[WaveSurferWebView] ❌', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  /**
   * 오디오 파일을 Base64로 인코딩하여 WebView로 전송
   */
  const sendAudioData = async () => {
    try {
      setIsLoading(true);
      console.log('[WaveSurferWebView] 🔄 Encoding audio files to Base64');

      // 표준 발음 오디오 인코딩 (Optional)
      // 현재는 로컬 파일 경로만 지원 (file:// 또는 절대 경로)
      let referenceBase64: string | undefined;

      if (referenceAudioPath) {
        const referenceFile = new File(referenceAudioPath);
        referenceBase64 = await referenceFile.base64();
      }

      // 사용자 녹음 오디오 인코딩 - 새 File API 사용
      const userFile = new File(userAudioPath);
      const userBase64 = await userFile.base64();

      console.log('[WaveSurferWebView] ✅ Audio encoding complete');
      if (referenceBase64) {
        console.log('[WaveSurferWebView] 📊 Reference size:', referenceBase64.length);
      }
      console.log('[WaveSurferWebView] 📊 User size:', userBase64.length);

      // WebView로 데이터 전송
      const message = JSON.stringify({
        type: 'LOAD_AUDIO',
        referenceAudio: referenceBase64 ? `data:audio/wav;base64,${referenceBase64}` : undefined,
        userAudio: `data:audio/wav;base64,${userBase64}`,
      });

      webViewRef.current?.postMessage(message);
      console.log('[WaveSurferWebView] 📤 Audio data sent to WebView');

    } catch (err) {
      const errorMsg = `오디오 로드 실패: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('[WaveSurferWebView] ❌', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  };

  /**
   * WebView 메시지 핸들러
   */
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[WaveSurferWebView] 📥 Message from WebView:', data.type);

      switch (data.type) {
        case 'WEBVIEW_READY':
          console.log('[WaveSurferWebView] ✅ WebView initialized');
          break;

        case 'VISUALIZATION_READY':
          console.log('[WaveSurferWebView] ✅ Visualization complete');
          setIsLoading(false);
          onReady?.();
          break;

        case 'ERROR':
          console.error('[WaveSurferWebView] ❌ WebView error:', data.message);
          setError(data.message);
          setIsLoading(false);
          onError?.(data.message);
          break;

        default:
          console.log('[WaveSurferWebView] ℹ️ Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('[WaveSurferWebView] ❌ Message parsing error:', err);
    }
  };

  /**
   * WebView 에러 핸들러
   */
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMsg = `WebView 에러: ${nativeEvent.description || 'Unknown'}`;
    console.error('[WaveSurferWebView] ❌', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (!htmlUri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
        <Text style={styles.loadingText}>HTML 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6750A4" />
          <Text style={styles.loadingText}>그래프 생성 중...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: htmlUri }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        mediaPlaybackRequiresUserAction={false}
        androidLayerType="hardware"
        onLoadEnd={() => {
          console.log('[WaveSurferWebView] ✅ WebView loaded');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    textAlign: 'center',
  },
});
