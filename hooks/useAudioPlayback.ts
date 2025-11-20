/**
 * useAudioPlayback - 오디오 재생을 위한 Custom Hook
 *
 * @description
 * `expo-audio`의 `useAudioPlayer`를 래핑하여 사용하기 쉬운 API를 제공합니다.
 * 기존에 results.tsx와 history.tsx에서 중복되던 30줄의 오디오 재생 로직을
 * 재사용 가능한 Hook으로 추상화했습니다.
 *
 * **주요 기능**:
 * - Play/Pause 토글
 * - 파일 소스 교체
 * - 자동 재시작 (끝까지 재생 시)
 * - 재생 상태 추적
 *
 * **장점**:
 * - DRY 원칙: 중복 코드 제거 (results.tsx, history.tsx)
 * - 일관성: 동일한 재생 동작 보장
 * - 유지보수: 한 곳만 수정하면 모든 곳에 반영
 *
 * @example
 * ```typescript
 * // Before (30줄) ❌
 * const audioPlayer = useAudioPlayer({ uri: audioUri });
 * const playerStatus = useAudioPlayerStatus(audioPlayer);
 *
 * const togglePlayback = () => {
 *   if (playerStatus.playing) {
 *     audioPlayer.pause();
 *   } else {
 *     if (playerStatus.currentTime >= playerStatus.duration - 0.1) {
 *       audioPlayer.seekTo(0);
 *     }
 *     audioPlayer.play();
 *   }
 * };
 *
 * // After (5줄) ✅
 * const audio = useAudioPlayback({ uri: audioUri });
 *
 * <Button onPress={audio.toggle}>
 *   {audio.isPlaying ? 'Pause' : 'Play'}
 * </Button>
 * ```
 *
 * @author Claude (Senior RN Engineer)
 * @see ARCHITECTURE_REVIEW.md - Section 5.2
 */

import { useState, useCallback, useEffect } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from "expo-audio";

/**
 * useAudioPlayback Hook의 반환 타입
 */
interface UseAudioPlaybackReturn {
  // 상태
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  source: AudioSource | null;

  // 액션
  play: () => void;
  pause: () => void;
  toggle: () => void;
  changeSource: (newSource: AudioSource | null) => void;
  seekTo: (seconds: number) => void;

  // 고급 사용자를 위한 원본 player 접근
  player: ReturnType<typeof useAudioPlayer>;
}

/**
 * 오디오 재생을 위한 Custom Hook
 *
 * @param initialSource - 초기 오디오 소스 (선택적)
 * @returns {UseAudioPlaybackReturn} 재생 상태 및 제어 함수들
 *
 * @example
 * ```typescript
 * // 기본 사용법
 * function AudioCard({ audioUri }: { audioUri: string }) {
 *   const audio = useAudioPlayback({ uri: audioUri });
 *
 *   return (
 *     <View>
 *       <Button onPress={audio.toggle}>
 *         {audio.isPlaying ? '⏸ Pause' : '▶ Play'}
 *       </Button>
 *       <Text>{audio.currentTime.toFixed(1)}s / {audio.duration.toFixed(1)}s</Text>
 *     </View>
 *   );
 * }
 *
 * // 소스 교체
 * function PlaylistPlayer() {
 *   const audio = useAudioPlayback();
 *   const [currentTrack, setCurrentTrack] = useState(0);
 *
 *   const playTrack = (index: number) => {
 *     audio.changeSource({ uri: tracks[index].uri });
 *     setCurrentTrack(index);
 *   };
 *
 *   return (
 *     <FlatList
 *       data={tracks}
 *       renderItem={({ item, index }) => (
 *         <Button onPress={() => playTrack(index)}>
 *           {item.title}
 *         </Button>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function useAudioPlayback(
  initialSource?: AudioSource | null
): UseAudioPlaybackReturn {
  // expo-audio hooks 사용
  const player = useAudioPlayer(initialSource);
  const status = useAudioPlayerStatus(player);

  // 현재 소스 추적
  const [currentSource, setCurrentSource] = useState<AudioSource | null>(
    initialSource || null
  );

  /**
   * 재생 시작
   *
   * @description
   * - 끝까지 재생된 경우 자동으로 처음부터 재생
   * - 일시정지 상태에서 호출하면 재생 재개
   */
  const play = useCallback(() => {
    console.log("[useAudioPlayback] ▶️ 재생 시작");

    // ✅ 끝까지 재생된 경우 처음부터
    if (status.currentTime >= status.duration - 0.1 && status.duration > 0) {
      console.log("[useAudioPlayback] 🔄 끝까지 재생됨 → 처음부터 재생");
      player.seekTo(0);
    }

    player.play();
  }, [player, status.currentTime, status.duration]);

  /**
   * 일시정지
   */
  const pause = useCallback(() => {
    console.log("[useAudioPlayback] ⏸️ 일시정지");
    player.pause();
  }, [player]);

  /**
   * Play/Pause 토글
   *
   * @description
   * 현재 재생 상태에 따라 play() 또는 pause()를 호출합니다.
   * 가장 자주 사용되는 함수입니다.
   *
   * @example
   * ```typescript
   * <Button onPress={audio.toggle}>
   *   {audio.isPlaying ? '⏸' : '▶'}
   * </Button>
   * ```
   */
  const toggle = useCallback(() => {
    if (status.playing) {
      pause();
    } else {
      play();
    }
  }, [status.playing, play, pause]);

  /**
   * 오디오 소스 교체
   *
   * @param newSource - 새 오디오 소스 (null이면 정지)
   *
   * @description
   * - 재생 중이면 자동으로 일시정지
   * - 소스 교체 후 자동 재생은 하지 않음 (명시적으로 play() 호출 필요)
   *
   * @example
   * ```typescript
   * const audio = useAudioPlayback();
   *
   * // 새 파일 재생
   * audio.changeSource({ uri: 'file:///path/to/new.wav' });
   * audio.play();  // 명시적으로 재생
   *
   * // 정지
   * audio.changeSource(null);
   * ```
   */
  const changeSource = useCallback(
    (newSource: AudioSource | null) => {
      if (newSource === null) {
        console.log("[useAudioPlayback] 🛑 소스 제거 및 정지");
        pause();
        setCurrentSource(null);
        return;
      }

      console.log("[useAudioPlayback] 📁 소스 교체");

      // 재생 중이면 일시정지
      if (status.playing) {
        pause();
      }

      // 소스 교체
      player.replace(newSource);
      setCurrentSource(newSource);
    },
    [player, status.playing, pause]
  );

  /**
   * 특정 위치로 이동
   *
   * @param seconds - 이동할 위치 (초 단위)
   *
   * @example
   * ```typescript
   * // 30초 지점으로 이동
   * audio.seekTo(30);
   *
   * // 처음으로 이동
   * audio.seekTo(0);
   *
   * // Slider 연동
   * <Slider
   *   value={audio.currentTime}
   *   maximumValue={audio.duration}
   *   onSlidingComplete={audio.seekTo}
   * />
   * ```
   */
  const seekTo = useCallback(
    (seconds: number) => {
      console.log(`[useAudioPlayback] ⏩ ${seconds}초로 이동`);
      player.seekTo(seconds);
    },
    [player]
  );

  // ✅ 재생 완료 감지 (디버깅용)
  useEffect(() => {
    if (
      status.currentTime >= status.duration - 0.1 &&
      status.duration > 0 &&
      status.playing
    ) {
      console.log("[useAudioPlayback] ✅ 재생 완료");
    }
  }, [status.currentTime, status.duration, status.playing]);

  return {
    // 상태
    isPlaying: status.playing,
    isLoading: !status.isLoaded,
    currentTime: status.currentTime,
    duration: status.duration,
    source: currentSource,

    // 액션
    play,
    pause,
    toggle,
    changeSource,
    seekTo,

    // 고급 사용자를 위한 원본 player 접근
    player,
  };
}

/**
 * 💡 React Hooks 교육: Custom Hook의 조합
 *
 * @description
 * useAudioPlayback은 내부적으로 expo-audio의 2개 Hook을 조합합니다:
 *
 * ```typescript
 * const player = useAudioPlayer(source);     // 플레이어 인스턴스
 * const status = useAudioPlayerStatus(player);  // 실시간 상태
 * ```
 *
 * **Hook 조합의 장점**:
 * 1. **추상화**: 복잡한 내부 구현을 숨김
 * 2. **재사용**: 여러 곳에서 동일한 로직 사용
 * 3. **확장**: 추가 기능을 쉽게 구현 (예: autoPlay)
 *
 * **예시: autoPlay 기능 추가**:
 * ```typescript
 * export function useAudioPlayback(
 *   initialSource?: AudioSource | null,
 *   options?: { autoPlay?: boolean }
 * ) {
 *   const player = useAudioPlayer(initialSource);
 *   const status = useAudioPlayerStatus(player);
 *
 *   // ✅ 로드 완료 시 자동 재생
 *   useEffect(() => {
 *     if (options?.autoPlay && status.isLoaded && !status.playing) {
 *       player.play();
 *     }
 *   }, [options?.autoPlay, status.isLoaded, status.playing]);
 *
 *   // ... rest of the code
 * }
 * ```
 */

/**
 * 💡 React Hooks 교육: Dependency Array 이해하기
 *
 * @description
 * useCallback, useEffect의 두 번째 인자는 dependency array입니다.
 *
 * **규칙**:
 * 1. 함수 내에서 사용하는 모든 외부 변수를 포함
 * 2. Primitive 값(number, string, boolean)은 변경 시 재생성
 * 3. 객체/배열은 참조가 변경될 때만 재생성
 *
 * **예시**:
 * ```typescript
 * const [count, setCount] = useState(0);
 * const [name, setName] = useState('');
 *
 * // ✅ count만 사용 → count만 dependency
 * const printCount = useCallback(() => {
 *   console.log(count);
 * }, [count]);
 *
 * // ✅ count와 name 둘 다 사용 → 둘 다 dependency
 * const printBoth = useCallback(() => {
 *   console.log(count, name);
 * }, [count, name]);
 *
 * // ❌ dependency 누락 → stale closure 문제!
 * const printCountBad = useCallback(() => {
 *   console.log(count);  // count 사용하는데
 * }, []);  // dependency에 없음 → 항상 초기값 출력!
 * ```
 *
 * **ESLint 플러그인**:
 * - `eslint-plugin-react-hooks` 사용 권장
 * - 누락된 dependency 자동 감지
 */

/**
 * 💡 TypeScript 교육: ReturnType Utility Type
 *
 * @description
 * `ReturnType<T>`는 함수 T의 반환 타입을 추출합니다.
 *
 * ```typescript
 * // player의 타입 정의 시
 * player: ReturnType<typeof useAudioPlayer>;
 *
 * // 이는 다음과 같음:
 * player: AudioPlayer;  // useAudioPlayer의 반환 타입
 * ```
 *
 * **사용 이유**:
 * - `AudioPlayer` 타입을 직접 import할 필요 없음
 * - useAudioPlayer의 반환 타입이 변경되면 자동으로 반영
 *
 * **다른 예시**:
 * ```typescript
 * function getUser() {
 *   return { id: 1, name: 'Alice' };
 * }
 *
 * type User = ReturnType<typeof getUser>;
 * // { id: number; name: string; }
 * ```
 *
 * **다른 Utility Types**:
 * - `Parameters<T>`: 함수 T의 파라미터 타입 추출
 * - `Awaited<T>`: Promise<T>의 T 추출
 * - `NonNullable<T>`: null, undefined 제거
 */

/**
 * 💡 Best Practice: Hook 네이밍
 *
 * @description
 * Custom Hook 네이밍 패턴:
 *
 * **패턴 1: use + 목적**
 * - `useSTTProcessing` - STT 처리
 * - `useAudioPlayback` - 오디오 재생
 * - `useHistoryManager` - 히스토리 관리
 *
 * **패턴 2: use + 리소스**
 * - `useUser` - 사용자 정보
 * - `useAuth` - 인증 상태
 * - `useFetch` - 데이터 fetch
 *
 * **❌ 피해야 할 이름**:
 * - `audioPlayback` - use 접두사 없음
 * - `useAudioPlaybackHook` - Hook은 이미 알 수 있으므로 중복
 * - `useAPB` - 약어 사용 금지 (명확성 우선)
 */
