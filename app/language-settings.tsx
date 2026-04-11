import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Header } from "@/components/header";
import { usePreferences, INTERFACE_LANGUAGES, TRANSLATION_LANGUAGES, type Language } from "@/contexts/preference-context";
import { Colors, Spacing } from "@/constants/theme";

type SettingsType = "interface" | "translation";

export default function LanguageSettingsScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  const { interfaceLanguage, translationLanguage, setInterfaceLanguage, setTranslationLanguage } = usePreferences();

  const settingsType: SettingsType = (params.type as SettingsType) || "interface";
  const languages = settingsType === "interface" ? INTERFACE_LANGUAGES : TRANSLATION_LANGUAGES;
  const currentLanguage = settingsType === "interface" ? interfaceLanguage : translationLanguage;

  const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);

  const handleSave = async () => {
    if (settingsType === "interface") {
      await setInterfaceLanguage(selectedLang);
    } else {
      await setTranslationLanguage(selectedLang);
    }
    router.back();
  };

  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 112,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "700",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
    },
    saveBtnText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    list: {
      gap: 8,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 14,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    itemSelected: {
      backgroundColor: colors.primaryContainer,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    itemText: {
      fontSize: 18,
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    checkIcon: {
      color: colors.primary,
    },
  });

  const title = settingsType === "interface" ? "界面语言" : "翻译语言";

  return (
    <View style={styles.container}>
      <Header title={title} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>选择语言</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.value}
                style={[
                  styles.item,
                  selectedLang === lang.value && styles.itemSelected,
                ]}
                onPress={() => setSelectedLang(lang.value)}
              >
                <Text style={styles.itemText}>{lang.label}</Text>
                {selectedLang === lang.value && (
                  <MaterialIcons
                    name="check"
                    size={22}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}