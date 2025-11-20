/**
 * @file features/audio/hooks/useAudioPlayback.ts
 * @description expo-audio를 사용한 오디오 재생 커스텀 훅
 *
 * 🎯 이 훅이 존재하는 이유:
 * - 깔끔하고 재사용 가능한 API로 오디오 재생 단순화
 * - 자동 상태 관리로 재생/일시정지/탐색 제어 제공
 * - 엣지 케이스 처리 (끝에서 재생, 버퍼링, 에러)
 * - 앱별 로직으로 expo-audio의 useAudioPlayer 래핑
 *
 * 📚 사용 예시:
 * ```tsx
 * const { play, pause, seek, state } = useAudioPlayback(audioUri);
 *
 * <Button onPress={play}>재생</Button>
 * <Button onPress={pause}>일시정지</Button>
 * <Text>{state.currentTime} / {state.duration}</Text>
 * <Slider value={state.currentTime} onValueChange={seek} />
 * ```
 */

import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { AudioSource } from '@/types/global';
import type { PlaybackState } from '../types';

/**
 * useAudioPlayback 훅의 반환 타입
 */
interface UseAudioPlaybackReturn {
  /** 현재 재생 상태 */
  state: PlaybackState;
  /** 재생 시작 또는 재개 */
  play: () => void;
  /** 재생 일시정지 */
  pause: () => void;
  /** 재생/일시정지 토글 */
  togglePlayback: () => void;
  /** 특정 시간으로 이동(초) */
  seek: (seconds: number) => void;
  /** 중지 및 처음으로 되돌리기 */
  stop: () => void;
  /** 재생 속도 설정 (1.0 = 보통 속도, 0.5 = 반속, 2.0 = 배속) */
  setRate: (rate: number) => void;
  /** 볼륨 설정 (0.0 = 무음, 1.0 = 최대 볼륨) */
  setVolume: (volume: number) => void;
}

/**
 * 오디오 재생을 위한 커스텀 훅
 *
 * 🏗️ 작동 방식:
 * 1. useAudioPlayer: 플레이어 인스턴스 생성 및 오디오 로드
 * 2. useAudioPlayerStatus: 실시간 재생 상태 모니터링
 * 3. 편리한 제어 기능 제공 (재생, 일시정지, 탐색 등)
 *
 * ⚙️ 주요 기능:
 * - 이미 끝난 경우 처음부터 자동 재시작
 * - 타입 안전한 재생 제어
 * - 컴포넌트 언마운트 시 자동 정리
 *
 * @param source - 오디오 소스 (URI, require(), 또는 { uri: string })
 * @returns 재생 제어 및 상태
 */
export function useAudioPlayback(source: AudioSource | null): UseAudioPlaybackReturn {
  // ✅ 오디오 플레이어 인스턴스 생성
  // 오디오 파일을 자동으로 로드하고 플레이어 생명주기 관리
  const player = useAudioPlayer(source);

  // ✅ 실시간 재생 상태 가져오기
  // 재생 상태가 변경될 때마다 업데이트 (재생/일시정지/탐색/종료)
  const status = useAudioPlayerStatus(player);

  /**
   * 재생 시작 (또는 일시정지 상태에서 재개)
   *
   * 🎯 스마트 재생:
   * - 끝에 있으면 먼저 처음으로 되감기
   * - 일시정지 상태면 현재 위치에서 재개
   * - 중지 상태면 처음부터 시작
   */
  const play = useCallback((): void => {
    console.log('[useAudioPlayback] ▶️ 재생 요청됨');

    // 오디오의 끝에 있는지 확인
    const isAtEnd = status.duration && status.currentTime >= status.duration - 0.1;

    if (isAtEnd) {
      // 재생 전에 처음으로 되감기
      console.log('[useAudioPlayback] 🔄 처음으로 되감기');
      player.seekTo(0);
    }

    player.play();
    console.log('[useAudioPlayback] ✅ 재생 시작됨');
  }, [player, status]);

  /**
   * 재생 일시정지
   *
   * 🔍 위치는 유지되며, 나중에 재개 가능
   */
  const pause = useCallback((): void => {
    console.log('[useAudioPlayback] ⏸️ 일시정지 요청됨');
    player.pause();
    console.log('[useAudioPlayback] ✅ 재생 일시정지됨');
  }, [player]);

  /**
   * 재생/일시정지 토글
   *
   * 🎯 재생/일시정지 버튼에 편리함
   */
  const togglePlayback = useCallback((): void => {
    if (status.playing) {
      pause();
    } else {
      play();
    }
  }, [status.playing, play, pause]);

  /**
   * 특정 시간 위치로 이동
   *
   * @param seconds - 목표 위치(초)
   */
  const seek = useCallback((seconds: number): void => {
    console.log(`[useAudioPlayback] ⏩ ${seconds.toFixed(2)}초로 이동 중`);
    player.seekTo(seconds);
  }, [player]);

  /**
   * 재생 중지 및 처음으로 초기화
   */
  const stop = useCallback((): void => {
    console.log('[useAudioPlayback] ⏹️ 중지 요청됨');
    player.pause();
    player.seekTo(0);
    console.log('[useAudioPlayback] ✅ 재생 중지됨');
  }, [player]);

  /**
   * 재생 속도 설정
   *
   * 🎯 유용한 경우:
   * - 발음 학습을 위한 느린 재생 (0.5x - 0.75x)
   * - 빠른 검토를 위한 빠른 재생 (1.25x - 2.0x)
   *
   * @param rate - 재생 속도 (0.5 = 반속, 1.0 = 보통, 2.0 = 배속)
   */
  const setRate = useCallback((rate: number): void => {
    console.log(`[useAudioPlayback] 🎛️ 재생 속도를 ${rate}x로 설정 중`);
    player.setPlaybackRate(rate);
  }, [player]);

  /**
   * 볼륨 레벨 설정
   *
   * @param volume - 볼륨 레벨 (0.0 = 무음, 1.0 = 최대 볼륨)
   */
  const setVolume = useCallback((volume: number): void => {
    console.log(`[useAudioPlayback] 🔊 볼륨을 ${(volume * 100).toFixed(0)}%로 설정 중`);
    player.volume = volume;
  }, [player]);

  // expo-audio의 AudioStatus를 앱의 PlaybackState로 변환
  const state: PlaybackState = {
    isPlaying: status.playing,
    isPaused: !status.playing && status.currentTime > 0,
    currentTime: status.currentTime,
    duration: status.duration || 0,
    isBuffering: status.isBuffering,
    didJustFinish: status.didJustFinish,
  };

  return {
    state,
    play,
    pause,
    togglePlayback,
    seek,
    stop,
    setRate,
    setVolume,
  };
}
