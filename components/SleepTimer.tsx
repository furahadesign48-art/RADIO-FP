import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Timer, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface SleepTimerProps {
  onTimerSet: (minutes: number | null) => void;
  themeColor?: string;
  textColor?: string;
  cardColor?: string;
  isDarkMode?: boolean;
}

const TIMER_OPTIONS = [
  { label: 'Désactivé', value: null },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

export const SleepTimer = ({ 
  onTimerSet, 
  themeColor = '#FF8C00', 
  textColor = '#fff', 
  cardColor = 'rgba(255,255,255,0.08)',
  isDarkMode = true 
}: SleepTimerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 60000); // Mise à jour chaque minute
    } else if (timeLeft === 0) {
      onTimerSet(0); // Signal pour arrêter la musique
      setActiveTimer(null);
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleSelect = (minutes: number | null) => {
    setActiveTimer(minutes);
    setTimeLeft(minutes);
    onTimerSet(minutes);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity 
        style={[styles.timerButton, { backgroundColor: cardColor }]} 
        onPress={() => setModalVisible(true)}
      >
        <Timer color={activeTimer ? themeColor : textColor} size={20} />
        {timeLeft !== null && (
          <Text style={[styles.timerText, { color: themeColor }]}>{timeLeft}m</Text>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView 
            intensity={90} 
            tint={isDarkMode ? 'dark' : 'light'} 
            style={[
              styles.modalContent, 
              { backgroundColor: isDarkMode ? 'rgba(34, 30, 38, 0.95)' : 'rgba(255,255,255,0.95)' }
            ]}
          >
            <View style={[
              styles.modalHeader, 
              { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            ]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Minuteur de veille</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={textColor} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={TIMER_OPTIONS}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.optionItem, 
                    { 
                      backgroundColor: activeTimer === item.value ? `${themeColor}22` : 'transparent',
                      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[
                    styles.optionLabel,
                    { color: textColor },
                    activeTimer === item.value && { color: themeColor, fontWeight: 'bold' }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
  },
  timerText: {
    color: '#FF4500',
    fontSize: 9,
    position: 'absolute',
    bottom: 4,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  optionLabel: {
    fontSize: 17,
  },
});
