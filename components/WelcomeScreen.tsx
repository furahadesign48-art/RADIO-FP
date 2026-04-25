import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  useDerivedValue
} from 'react-native-reanimated';
import { Play } from 'lucide-react-native';
import { ThemeColors } from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDESHOW_IMAGES = [
  require('../assets/slide2.jpg'),
  require('../assets/slide.jpeg'),
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
];

interface WelcomeScreenProps {
  onStart: () => void;
  theme: ThemeColors;
  isDarkMode: boolean;
  isPlaying: boolean;
}

export const WelcomeScreen = ({ onStart, theme, isDarkMode, isPlaying }: WelcomeScreenProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  // Splash Animations
  const splashScale = useSharedValue(0.3);
  const splashOpacity = useSharedValue(0);
  const ringScale1 = useSharedValue(1);
  const ringScale2 = useSharedValue(1);

  useEffect(() => {
    // Start Splash Animation
    splashScale.value = withSpring(1, { damping: 12 });
    splashOpacity.value = withTiming(1, { duration: 1000 });

    // Animated rings
    ringScale1.value = withRepeat(withTiming(1.5, { duration: 2000 }), -1, true);
    ringScale2.value = withRepeat(withTiming(1.8, { duration: 2500 }), -1, true);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    const slideTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 3000);
    
    return () => {
      clearTimeout(splashTimer);
      clearInterval(slideTimer);
    };
  }, []);

  const splashAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: splashScale.value }],
    opacity: splashOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: interpolate(ringScale1.value, [1, 1.5], [0.5, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: interpolate(ringScale2.value, [1, 1.8], [0.3, 0]),
  }));

  if (showSplash) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background[0], justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View style={[styles.splashLayer, splashAnimatedStyle]}>
          <View style={styles.splashLogoContainer}>
            <Animated.View style={[styles.splashRing, { borderColor: theme.primary }, ring1Style]} />
            <Animated.View style={[styles.splashRingInner, { borderColor: theme.secondary }, ring2Style]} />
            <Image
              source={require('../assets/logo.png')}
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </View>
          <Animated.Text style={[styles.splashText, { color: theme.text }]}>
            RADIO FP
          </Animated.Text>
          <Animated.Text style={[styles.splashSubtext, { color: theme.primary }]}>
            La Radio qui sort de l'ordinaire
          </Animated.Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
      {/* Slideshow Background */}
      {SLIDESHOW_IMAGES.map((img, index) => {
        const isLocal = typeof img === 'number';
        return (
          index === currentImageIndex && (
            <Animated.View
              key={String(img)}
              entering={FadeIn.duration(2000)}
              exiting={FadeOut.duration(2000)}
              style={StyleSheet.absoluteFill}
            >
              <Image
                source={isLocal ? img : { uri: img as string }}
                style={[styles.bgImage, isLocal && { resizeMode: 'contain' }, { opacity: isDarkMode ? 0.6 : 0.3 }]}
              />
            </Animated.View>
          )
        )
      })}
      <LinearGradient
        colors={['transparent', theme.background[1], theme.background[2]]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.logoContainer}>
          <View style={styles.waveContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <WaveBar key={i} index={i} color={theme.primary} />
            ))}
          </View>
          <Text style={[styles.liveLabel, { color: theme.primary }]}>Live</Text>
          <Text style={[styles.titleMain, { color: theme.text }]}>Fréquence</Text>
          <Text style={[styles.titleSub, { color: theme.primary }]}>Positive</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(1000)} style={styles.footer}>
          <TouchableOpacity style={[styles.startButton, { shadowColor: theme.secondary }]} onPress={onStart}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>
                {isPlaying ? "Continuer l'écoute" : "Démarrer"}
              </Text>
              <Play color="#fff" size={20} fill="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const WaveBar = ({ index, color }: { index: number; color: string }) => {
  const heightValue = useSharedValue(10);
  
  useEffect(() => {
    heightValue.value = withRepeat(
      withTiming(30 + Math.random() * 40, {
        duration: 500 + Math.random() * 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
  }));

  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    width: width,
    height: height,
    opacity: 0.6,
  },
  splashLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 2,
  },
  splashRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    opacity: 0.5,
  },
  splashRingInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    opacity: 0.3,
  },
  splashText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: 20,
    textAlign: 'center',
  },
  splashSubtext: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  logoContainer: {
    marginBottom: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#FF8C00',
    borderRadius: 2,
  },
  liveLabel: {
    color: '#FF8C00',
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  titleMain: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 52,
  },
  titleSub: {
    color: '#FF8C00',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 52,
  },
  footer: {
    width: '100%',
  },
  startButton: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
