// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import { useFonts, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import FontAwesomeFont from 'react-native-vector-icons/Fonts/FontAwesome.ttf';
import IoniconsFont from 'react-native-vector-icons/Fonts/Ionicons.ttf';
import MaterialIconsFont from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    'FontAwesome': FontAwesomeFont,
    'Ionicons': IoniconsFont,
    'MaterialIcons': MaterialIconsFont,
  });

  return loaded || !!error;
}
