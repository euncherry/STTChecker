/**
 * @file features/audio/hooks/useAudioPlayback.ts
 * @description Custom hook for audio playback using expo-audio
 *
 * 🎯 Why this hook exists:
 * - Simplifies audio playback with a clean, reusable API
 * - Provides play/pause/seek controls with automatic state management
 * - Handles edge cases (replay from end, buffering, errors)
 * - Wraps expo-audio's useAudioPlayer with app-specific logic
 *
 * 📚 Usage example:
 * ```tsx
 * const { play, pause, seek, state } = useAudioPlayback(audioUri);
 *
 * <Button onPress={play}>Play</Button>
 * <Button onPress={pause}>Pause</Button>
 * <Text>{state.currentTime} / {state.duration}</Text>
 * <Slider value={state.currentTime} onValueChange={seek} />
 * ```
 */

import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { AudioSource } from '@/types/global';
import type { PlaybackState } from '../types';

/**
 * Return type for useAudioPlayback hook
 */
interface UseAudioPlaybackReturn {
  /** Current playback state */
  state: PlaybackState;
  /** Start or resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Toggle between play and pause */
  togglePlayback: () => void;
  /** Seek to a specific time (in seconds) */
  seek: (seconds: number) => void;
  /** Stop and reset to beginning */
  stop: () => void;
  /** Set playback rate (1.0 = normal speed, 0.5 = half speed, 2.0 = double speed) */
  setRate: (rate: number) => void;
  /** Set volume (0.0 = silent, 1.0 = full volume) */
  setVolume: (volume: number) => void;
}

/**
 * Custom hook for audio playback
 *
 * 🏗️ How it works:
 * 1. useAudioPlayer: Creates player instance and loads audio
 * 2. useAudioPlayerStatus: Monitors playback state in real-time
 * 3. Provides convenient controls (play, pause, seek, etc.)
 *
 * ⚙️ Key features:
 * - Auto-restart from beginning if already finished
 * - Type-safe playback controls
 * - Automatic cleanup when component unmounts
 *
 * @param source - Audio source (URI, require(), or { uri: string })
 * @returns Playback controls and state
 */
export function useAudioPlayback(source: AudioSource | null): UseAudioPlaybackReturn {
  // ✅ Create audio player instance
  // This automatically loads the audio file and manages the player lifecycle
  const player = useAudioPlayer(source);

  // ✅ Get real-time playback status
  // This updates whenever playback state changes (play/pause/seek/end)
  const status = useAudioPlayerStatus(player);

  /**
   * Start playback (or resume if paused)
   *
   * 🎯 Smart playback:
   * - If at the end, rewinds to beginning first
   * - If paused, resumes from current position
   * - If stopped, starts from beginning
   */
  const play = useCallback((): void => {
    console.log('[useAudioPlayback] ▶️ Play requested');

    // Check if we're at the end of the audio
    const isAtEnd = status.duration && status.currentTime >= status.duration - 0.1;

    if (isAtEnd) {
      // Rewind to beginning before playing
      console.log('[useAudioPlayback] 🔄 Rewinding to beginning');
      player.seekTo(0);
    }

    player.play();
    console.log('[useAudioPlayback] ✅ Playback started');
  }, [player, status]);

  /**
   * Pause playback
   *
   * 🔍 Position is preserved, can be resumed later
   */
  const pause = useCallback((): void => {
    console.log('[useAudioPlayback] ⏸️ Pause requested');
    player.pause();
    console.log('[useAudioPlayback] ✅ Playback paused');
  }, [player]);

  /**
   * Toggle between play and pause
   *
   * 🎯 Convenient for play/pause buttons
   */
  const togglePlayback = useCallback((): void => {
    if (status.playing) {
      pause();
    } else {
      play();
    }
  }, [status.playing, play, pause]);

  /**
   * Seek to a specific time position
   *
   * @param seconds - Target position in seconds
   */
  const seek = useCallback((seconds: number): void => {
    console.log(`[useAudioPlayback] ⏩ Seeking to ${seconds.toFixed(2)}s`);
    player.seekTo(seconds);
  }, [player]);

  /**
   * Stop playback and reset to beginning
   */
  const stop = useCallback((): void => {
    console.log('[useAudioPlayback] ⏹️ Stop requested');
    player.pause();
    player.seekTo(0);
    console.log('[useAudioPlayback] ✅ Playback stopped');
  }, [player]);

  /**
   * Set playback rate (speed)
   *
   * 🎯 Useful for:
   * - Slow playback for pronunciation learning (0.5x - 0.75x)
   * - Fast playback for quick review (1.25x - 2.0x)
   *
   * @param rate - Playback rate (0.5 = half speed, 1.0 = normal, 2.0 = double speed)
   */
  const setRate = useCallback((rate: number): void => {
    console.log(`[useAudioPlayback] 🎛️ Setting playback rate to ${rate}x`);
    player.setPlaybackRate(rate);
  }, [player]);

  /**
   * Set volume level
   *
   * @param volume - Volume level (0.0 = silent, 1.0 = full volume)
   */
  const setVolume = useCallback((volume: number): void => {
    console.log(`[useAudioPlayback] 🔊 Setting volume to ${(volume * 100).toFixed(0)}%`);
    player.volume = volume;
  }, [player]);

  // Transform expo-audio's AudioStatus into our app's PlaybackState
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
