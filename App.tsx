import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { 
  Capability, 
  State, 
  usePlaybackState, 
  AppKilledPlaybackBehavior,
  Event
} from 'react-native-track-player';
import { RadioPlayer } from './components/RadioPlayer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { THEMES, ThemeType } from './theme';
import { RADIO_CONFIG } from './constants';

export default function App() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('Ocean');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Audio States
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;
  const isLoading = playbackState.state === State.Buffering || playbackState.state === State.Loading;
  
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'High' | 'Low'>('High');
  const [dataSaver, setDataSaver] = useState(false);

  // Initialisation du TrackPlayer
  useEffect(() => {
    let mounted = true;

    const setupTrackPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
          notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
        });

        // Ajouter le flux radio
        await TrackPlayer.add({
          id: 'radio-fp',
          url: RADIO_CONFIG.STREAM_URL,
          title: 'Fréquence Positive',
          artist: 'Le neveu National',
          artwork: require('./assets/logo.png'),
          isLiveStream: true,
        });

        if (mounted) {
          setIsPlayerReady(true);
        }
      } catch (e: any) {
        if (e.message.includes('already been initialized')) {
          if (mounted) setIsPlayerReady(true);
        } else {
          console.warn('Erreur setup TrackPlayer:', e);
        }
      }
    };

    setupTrackPlayer();

    return () => {
      mounted = false;
      // Ne pas reset ici pour permettre la lecture en arrière-plan
    };
  }, []);

  // Charger le thème au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') return;
        
        const savedTheme = await AsyncStorage.getItem('@radio_theme');
        const savedDarkMode = await AsyncStorage.getItem('@radio_dark_mode');
        if (savedTheme) setCurrentTheme(savedTheme as ThemeType);
        if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');
      } catch (e) {
        console.warn('Erreur chargement paramètres:', e);
      }
    };
    loadSettings();
  }, []);

  // Audio Functions
  const togglePlayback = async () => {
    try {
      const themeColor = parseInt(theme.primary.replace('#', ''), 16);
      const commonOptions = {
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        color: themeColor,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      };

      if (!isPlayerReady) {
        try {
          await TrackPlayer.setupPlayer();
        } catch (e: any) {
          if (!e.message.includes('already been initialized')) {
            throw e;
          }
        }
        
        await TrackPlayer.updateOptions(commonOptions);

        await TrackPlayer.add({
          id: 'radio-fp',
          url: RADIO_CONFIG.STREAM_URL,
          title: 'Fréquence Positive',
          artist: 'Le neveu National',
          artwork: require('./assets/logo.png'),
          isLiveStream: true,
        });
        setIsPlayerReady(true);
      }

      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        const currentVolume = dataSaver ? 0.5 : (isMuted ? 0 : volume);
        await TrackPlayer.setVolume(currentVolume);
        await TrackPlayer.updateOptions(commonOptions);
        await TrackPlayer.play();
      }
    } catch (e) {
      console.warn('Erreur togglePlayback:', e);
    }
  };

  const pausePlayback = async () => {
    try {
      await TrackPlayer.pause();
    } catch (e) {
      console.warn('Erreur pausePlayback:', e);
    }
  };

  const toggleMute = async () => {
    try {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      const currentVolume = dataSaver ? 0.5 : (newMuted ? 0 : volume);
      await TrackPlayer.setVolume(currentVolume).catch(() => {});
    } catch (e) {
      console.warn('Erreur toggleMute:', e);
    }
  };

  const updateAudioQuality = async (quality: 'High' | 'Low') => {
    setAudioQuality(quality);
    if (!isPlayerReady) return;
    
    try {
      const streamUri = `${RADIO_CONFIG.STREAM_URL}${quality === 'Low' ? '?quality=low' : ''}`;
      const wasPlaying = isPlaying;
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: 'radio-fp',
        url: streamUri,
        title: 'Fréquence Positive',
        artist: 'Le neveu National',
        artwork: require('./assets/logo.png'),
        isLiveStream: true,
      });
      if (wasPlaying) await TrackPlayer.play();
    } catch (e) {
      console.warn('Erreur update quality:', e);
    }
  };

  const updateDataSaver = (enabled: boolean) => {
    setDataSaver(enabled);
  };

  // Sync volume with dataSaver/isMuted
  useEffect(() => {
    const updateVolume = async () => {
      if (!isPlayerReady) return;
      
      try {
        const newVolume = dataSaver ? 0.5 : (isMuted ? 0 : volume);
        await TrackPlayer.setVolume(newVolume);
      } catch (e) {
        console.warn('Erreur mise à jour volume:', e);
      }
    };
    updateVolume();
  }, [dataSaver, isMuted, volume, isPlayerReady]);

  // Sauvegarder le thème
  const saveTheme = async (theme: ThemeType) => {
    setCurrentTheme(theme);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem('@radio_theme', theme);
      }
    } catch (e) {
      console.warn('Sauvegarde thème non disponible:', e.message);
    }
  };

  const saveDarkMode = async (darkMode: boolean) => {
    setIsDarkMode(darkMode);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem('@radio_dark_mode', String(darkMode));
      }
    } catch (e) {
      console.warn('Sauvegarde mode sombre non disponible:', e.message);
    }
  };

  const theme = isDarkMode ? THEMES[currentTheme] : {
    ...THEMES.Light,
    primary: THEMES[currentTheme].primary,
    secondary: THEMES[currentTheme].secondary,
  };

  return (
    <View style={styles.container}>
      {showPlayer ? (
        <RadioPlayer 
          onBack={() => setShowPlayer(false)} 
          currentTheme={currentTheme}
          onThemeChange={saveTheme}
          isDarkMode={isDarkMode}
          onDarkModeChange={saveDarkMode}
          theme={theme}
          audio={{
            sound: null, // Plus utilisé avec TrackPlayer
            isPlaying,
            isLoading,
            volume,
            isMuted,
            audioQuality,
            dataSaver,
            togglePlayback,
            pausePlayback,
            toggleMute,
            setAudioQuality: updateAudioQuality,
            setDataSaver: updateDataSaver,
            setVolume
          }}
        />
      ) : (
        <WelcomeScreen 
          onStart={() => setShowPlayer(true)} 
          theme={theme}
          isDarkMode={isDarkMode}
          isPlaying={isPlaying}
        />
      )}
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
