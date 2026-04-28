import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions, Linking, Alert, Modal, ScrollView, Switch, Share } from 'react-native';
import { Play, Pause, Square, Volume2, VolumeX, Heart, Share2, Facebook, Instagram, Timer, ChevronLeft, Settings, Info, Zap, Smartphone, Sliders, Moon, Sun, Palette, Bell, Plus, Minus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn,
  FadeOut,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming, 
  Easing,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { RADIO_CONFIG } from '../constants';
import { SleepTimer } from './SleepTimer';
import { THEMES, ThemeType, ThemeColors } from '../theme';

const logoImg = require('../assets/logo.png');

const { width } = Dimensions.get('window');

const ANNOUNCEMENTS = [
  "Restez branchés sur Fréquence Positive !",
  "nous suivre sur facebook",
  "Suivez-nous sur Instagram pour les coulisses !",
  "La radio qui sort de l'ordinaire."
];

interface TrackInfo {
  title: string;
  artist: string;
  cover: string;
}

interface RadioPlayerProps {
  onBack: () => void;
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  isDarkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
  theme: ThemeColors;
  audio: {
    sound: any | null;
    isPlaying: boolean;
    isLoading: boolean;
    volume: number;
    isMuted: boolean;
    audioQuality: 'High' | 'Low';
    dataSaver: boolean;
    togglePlayback: () => Promise<void>;
    pausePlayback: () => Promise<void>;
    toggleMute: () => Promise<void>;
    setAudioQuality: (quality: 'High' | 'Low') => void;
    setDataSaver: (enabled: boolean) => void;
    setVolume: (volume: number) => void;
  };
}

export const RadioPlayer = ({ 
  onBack, 
  currentTheme, 
  onThemeChange, 
  isDarkMode, 
  onDarkModeChange,
  theme,
  audio
}: RadioPlayerProps) => {
  const { 
    sound, 
    isPlaying, 
    isLoading, 
    volume, 
    isMuted, 
    audioQuality, 
    dataSaver, 
    togglePlayback, 
    pausePlayback, 
    toggleMute, 
    setAudioQuality, 
    setDataSaver, 
    setVolume 
  } = audio;

  const [isLiked, setIsLiked] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [equalizerPreset, setEqualizerPreset] = useState<'Flat' | 'Bass' | 'Vocal'>('Flat');

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
  };

  // Effet psychologique pour l'égaliseur
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({
    title: 'Fréquence Positive',
    artist: 'Le neveu National',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop'
  });

  useEffect(() => {
    if (!isPlaying) return;
    
    let targetVolume = volume;
    if (equalizerPreset === 'Bass') targetVolume = Math.min(1.0, volume * 1.2);
    if (equalizerPreset === 'Vocal') targetVolume = volume * 0.9;
    
    setVolume(targetVolume);
  }, [equalizerPreset, isPlaying]);

  const floatingAnim = useSharedValue(0);
  const rotation = useSharedValue(0);
  const waveOffset = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    floatingAnim.value = withRepeat(
      withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animations Styles
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingAnim.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    shadowRadius: interpolate(glowOpacity.value, [0.4, 0.8], [15, 30]),
  }));

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(RADIO_CONFIG.METADATA_URL);
        const data = await response.json();
        if (data) {
          setTrackInfo({
            title: data.title || 'Fréquence Positive',
            artist: data.artist || 'Le neveu National',
            cover: data.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop'
          });
        }
      } catch (error) {
        console.error('Metadata fetch error:', error);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  const pulseStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: isPlaying ? withRepeat(withTiming(0, { duration: 2000 }), -1, false) : 0,
    };
  });

  const pulseStyles2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value * 1.2 }],
      opacity: isPlaying ? withRepeat(withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }), -1, false) : 0,
    };
  });

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 15000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      waveOffset.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 4000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.4, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      );
    } else {
      rotation.value = withSpring(0);
      waveOffset.value = withSpring(0);
      pulseScale.value = withSpring(1);
    }
  }, [isPlaying]);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `J'écoute ${trackInfo.title} - ${trackInfo.artist} sur Fréquence Positive ! 🎧\n\nRejoignez-nous en téléchargeant l'application ici : https://play.google.com/store/apps/details?id=com.furahadigital.radiofp`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleTimerSet = async (minutes: number | null) => {
    if (minutes === 0 && isPlaying) {
      await pausePlayback();
    }
  };

  const handleSocialLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.1, 0.9, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color={theme.text} size={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.radioName, { color: theme.text }]}>{RADIO_CONFIG.RADIO_NAME}</Text>
          <View style={[styles.liveIndicator, { backgroundColor: isDarkMode ? 'rgba(255,0,0,0.1)' : 'rgba(255,0,0,0.05)' }]}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.settingsButton}>
          <Settings color={theme.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.centerContainer}>
          <View style={styles.circularSpectrumContainer}>
            {[...Array(80)].map((_, i) => (
              <CircularBar 
                key={i} 
                index={i} 
                total={80} 
                isPlaying={isPlaying} 
                waveOffset={waveOffset}
                primaryColor={theme.primary}
                preset={equalizerPreset}
              />
            ))}
          </View>
          <Animated.View style={[styles.coverContainer, rotationStyle, glowAnimatedStyle, { borderColor: `${theme.primary}4D`, shadowColor: theme.primary }]}>
            <Image 
              source={logoImg} 
              style={styles.cover}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.infoContainer, floatingStyle]}>
          <Text style={[styles.title, { color: theme.primary, textShadowColor: `${theme.primary}4D` }]}>{trackInfo.title}</Text>
          <Text style={[styles.artist, { color: theme.text }]}>{trackInfo.artist}</Text>
        </Animated.View>

        <AnnouncementSlider theme={theme} />

        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: theme.card }]} 
              onPress={handleShare}
            >
              <Share2 size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: theme.card }]} 
              onPress={() => setIsLiked(!isLiked)}
            >
              <Heart size={20} color={isLiked ? theme.secondary : theme.text} fill={isLiked ? theme.secondary : 'none'} />
            </TouchableOpacity>
          </View>

          <View style={styles.playButtonContainer}>
            <Animated.View style={[styles.pulseCircle, pulseStyles, { backgroundColor: `${theme.secondary}66` }]} />
            <Animated.View style={[styles.pulseCircle, pulseStyles2, { backgroundColor: `${theme.secondary}66` }]} />
            <TouchableOpacity 
              style={[styles.playButton, { shadowColor: theme.secondary, borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} 
              onPress={togglePlayback}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                style={styles.playGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : isPlaying ? (
                  <Pause size={42} color="#fff" fill="#fff" />
                ) : (
                  <Play size={42} color="#fff" fill="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.controlGroup}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: theme.card }]} 
              onPress={() => setShowVolumeControl(true)}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={20} color={theme.text} />
              ) : (
                <Volume2 size={20} color={theme.text} />
              )}
            </TouchableOpacity>
            <SleepTimer 
              onTimerSet={handleTimerSet} 
              themeColor={theme.primary} 
              textColor={theme.text} 
              cardColor={theme.card} 
              isDarkMode={isDarkMode}
            />
          </View>
        </View>

        <View style={styles.socials}>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLink(RADIO_CONFIG.SOCIALS.facebook)}>
            <Facebook color={theme.text} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLink(RADIO_CONFIG.SOCIALS.instagram)}>
            <Instagram color={theme.text} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
            <Share2 color={theme.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isSettingsOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <BlurView intensity={90} tint={isDarkMode ? 'dark' : 'light'} style={[styles.settingsModal, { backgroundColor: isDarkMode ? 'rgba(34, 30, 38, 0.95)' : 'rgba(255,255,255,0.95)' }]}>
          <View style={[styles.settingsHeader, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>Paramètres</Text>
            <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
              <Text style={[styles.closeButton, { color: theme.primary }]}>Terminé</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>APPARENCE</Text>
              
              <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
                <View style={styles.settingInfo}>
                  <Moon color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Mode Sombre</Text>
                </View>
                <Switch 
                  value={isDarkMode} 
                  onValueChange={onDarkModeChange}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.equalizerContainer, { backgroundColor: theme.card }]}>
                <View style={styles.settingInfo}>
                  <Palette color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Palette de couleurs</Text>
                </View>
                <View style={styles.presetGroup}>
                  {(['Classic', 'Ocean', 'Midnight'] as const).map(t => (
                    <TouchableOpacity 
                      key={t}
                      onPress={() => onThemeChange(t)}
                      style={[
                        styles.presetButton, 
                        { backgroundColor: theme.card, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                        currentTheme === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <Text style={[styles.presetText, { color: currentTheme === t ? '#fff' : theme.text }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>AUDIO</Text>
              
              <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
                <View style={styles.settingInfo}>
                  <Zap color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Qualité Supérieure</Text>
                </View>
                <Switch 
                  value={audioQuality === 'High'} 
                  onValueChange={(val) => setAudioQuality(val ? 'High' : 'Low')}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
                <View style={styles.settingInfo}>
                  <Smartphone color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Économiseur de données</Text>
                </View>
                <Switch 
                  value={dataSaver} 
                  onValueChange={setDataSaver}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.equalizerContainer, { backgroundColor: theme.card }]}>
                <View style={styles.settingInfo}>
                  <Sliders color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Égaliseur</Text>
                </View>
                <View style={styles.presetGroup}>
                  {(['Flat', 'Bass', 'Vocal'] as const).map(preset => (
                    <TouchableOpacity 
                      key={preset}
                      onPress={() => setEqualizerPreset(preset)}
                      style={[
                        styles.presetButton, 
                        { backgroundColor: theme.card, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                        equalizerPreset === preset && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <Text style={[styles.presetText, { color: equalizerPreset === preset ? '#fff' : theme.text }]}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>APPLICATION</Text>
              
              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]} onPress={() => Linking.openURL('mailto:support@frequencepositive.com')}>
                <View style={styles.settingInfo}>
                  <Info color={theme.text} size={20} />
                  <Text style={[styles.settingText, { color: theme.text }]}>Support & Feedback</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.aboutSection}>
              <Image source={logoImg} style={styles.aboutLogo} />
              <Text style={[styles.aboutTitle, { color: theme.text }]}>Fréquence Positive</Text>
              <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 1.0.0 (Build 2026)</Text>
              <Text style={[styles.aboutCredit, { color: theme.primary }]}>Propulsé par Furaha-Digital</Text>
            </View>
          </ScrollView>
        </BlurView>
      </Modal>

      <Modal
        visible={showVolumeControl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVolumeControl(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowVolumeControl(false)}
        >
          <BlurView intensity={60} tint={isDarkMode ? 'dark' : 'light'} style={styles.volumeModalContent}>
            <TouchableOpacity activeOpacity={1} style={[styles.volumeCard, { backgroundColor: theme.card }]}>
              <View style={styles.volumeHeader}>
                <Text style={[styles.volumeTitle, { color: theme.text }]}>Volume</Text>
                <TouchableOpacity onPress={() => setShowVolumeControl(false)}>
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.volumeMainControls}>
                <TouchableOpacity 
                  style={[styles.volumeLargeBtn, { backgroundColor: `${theme.primary}20` }]} 
                  onPress={() => adjustVolume(-0.1)}
                >
                  <Minus size={24} color={theme.primary} />
                </TouchableOpacity>

                <View style={styles.volumeDisplay}>
                  <Text style={[styles.volumePercent, { color: theme.primary }]}>
                    {isMuted ? "MUTE" : `${Math.round(volume * 100)}%`}
                  </Text>
                  <View style={[styles.volumeBarContainer, { backgroundColor: `${theme.text}10` }]}>
                    <Animated.View 
                      style={[
                        styles.volumeBarFill, 
                        { 
                          backgroundColor: theme.primary,
                          width: `${volume * 100}%`
                        }
                      ]} 
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.volumeLargeBtn, { backgroundColor: `${theme.primary}20` }]} 
                  onPress={() => adjustVolume(0.1)}
                >
                  <Plus size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.muteToggleBtn, { backgroundColor: isMuted ? theme.primary : `${theme.text}10` }]} 
                onPress={toggleMute}
              >
                {isMuted ? (
                  <VolumeX size={20} color="#fff" />
                ) : (
                  <Volume2 size={20} color={theme.text} />
                )}
                <Text style={[styles.muteToggleText, { color: isMuted ? "#fff" : theme.text }]}>
                  {isMuted ? "Réactiver le son" : "Couper le son"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const AnnouncementSlider = ({ theme }: { theme: any }) => {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(setIndex)((index + 1) % ANNOUNCEMENTS.length);
          opacity.value = withTiming(1, { duration: 500 });
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.announcementCard, { backgroundColor: theme.card }]}>
      <Bell size={16} color={theme.primary} style={{ marginRight: 8 }} />
      <Animated.Text style={[styles.announcementText, { color: theme.text }, animatedStyle]}>
        {ANNOUNCEMENTS[index]}
      </Animated.Text>
    </View>
  );
};

const CircularBar = ({ index, total, isPlaying, waveOffset, primaryColor, preset }: { index: number, total: number, isPlaying: boolean, waveOffset: Animated.SharedValue<number>, primaryColor: string, preset: 'Flat' | 'Bass' | 'Vocal' }) => {
  const angle = (index / total) * 360;
  const angleRad = (index / total) * 2 * Math.PI;
  
  const animatedStyle = useAnimatedStyle(() => {
    let waveHeight = 5;
    
    if (isPlaying) {
      // Ajustement de l'intensité selon le preset d'égaliseur
      const multiplier = preset === 'Bass' ? 1.5 : (preset === 'Vocal' ? 0.7 : 1);
      
      // Combinaison de plusieurs ondes pour l'effet organique
      const wave1 = Math.sin(angleRad * 3 + waveOffset.value) * (15 * multiplier);
      const wave2 = Math.sin(angleRad * 5 - waveOffset.value * 1.5) * (10 * multiplier);
      const wave3 = Math.sin(angleRad * 2 + waveOffset.value * 0.5) * (8 * multiplier);
      waveHeight = (15 * multiplier) + wave1 + wave2 + wave3;
    }

    // Calcul de la couleur en fonction de l'angle (Dégradé circulaire basé sur la couleur primaire)
    // On convertit la couleur primaire hex vers HSL pour garder l'harmonie
    const hexToHsl = (hex: string) => {
      'worklet';
      let r = parseInt(hex.substring(1, 3), 16) / 255;
      let g = parseInt(hex.substring(3, 5), 16) / 255;
      let b = parseInt(hex.substring(5, 7), 16) / 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) h = s = 0;
      else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h! /= 6;
      }
      return [h! * 360, s * 100, l * 100];
    };

    const [h, s, l] = hexToHsl(primaryColor);
    const hue = h + (index / total) * 20; 
    const saturation = s;
    const lightness = isPlaying ? l : 20;

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    return {
      height: withSpring(Math.max(5, waveHeight), { damping: 15 }),
      transform: [
        { rotate: `${angle}deg` },
        { translateY: - (width * 0.7) / 2 - 10 }
      ],
      backgroundColor: color,
      shadowColor: color,
      shadowOpacity: isPlaying ? 0.6 : 0,
      shadowRadius: 15,
      width: 2.5,
    };
  });

  return <Animated.View style={[styles.circularBar, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    width: '100%',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  radioName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  liveText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topActions: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.9,
    height: width * 0.9,
    marginTop: 10, // Réduit encore
  },
  circularSpectrumContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBar: {
    position: 'absolute',
    borderRadius: 2,
  },
  coverContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    overflow: 'hidden',
    elevation: 30,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    borderWidth: 6,
    borderColor: 'rgba(255,140,0,0.3)',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 25,
    width: width * 0.85,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  announcementText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    color: '#FF8C00',
    fontSize: 26, // Taille ajustée
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255,140,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  artist: {
    color: '#fff',
    fontSize: 17, // Taille ajustée
    marginTop: 6, // Marge ajustée
    textAlign: 'center', 
    opacity: 0.7,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 15, // Gap réduit pour plus d'harmonie
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Gap réduit à l'intérieur des groupes
  },
  playButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 69, 0, 0.4)',
  },
  playButton: {
    width: 84, // Légèrement plus grand
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButton: {
    width: 40, // Plus petit
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 8,
    height: 40,
    gap: 10,
  },
  volumeAdjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  volumeModalContent: {
    width: width * 0.85,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  volumeCard: {
    padding: 25,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  volumeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  volumeMainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  volumeLargeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  volumePercent: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  volumeBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  muteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 12,
  },
  muteToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playGradient: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  socials: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 30, // Marge ajustée
    marginBottom: 40, // Ajout d'une marge en bas pour éviter la barre système
    gap: 25,
  },
  socialButton: {
    opacity: 0.7,
  },
  settingsModal: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 30, 38, 0.95)',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  settingSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
  },
  equalizerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  presetGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activePreset: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  presetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 50,
  },
  aboutLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 15,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aboutVersion: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 5,
  },
  aboutCredit: {
    color: '#FF8C00',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
  },
});
