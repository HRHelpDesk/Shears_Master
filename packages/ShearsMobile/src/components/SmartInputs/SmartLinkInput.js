// src/components/SmartInputs/LinkInput.js
import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function LinkInput({
  label,
  value,            // { title: string, url: string }
  onChangeValue,    // (newValue: { title, url }) => void  — preferred
  onChangeText,     // same signature, alias used by ListItemDetailScreen
  placeholder,
  mode = 'edit',
  error,
  helperText,
}) {
  const theme = useTheme();
  const [focusedField, setFocusedField] = useState(null); // 'title' | 'url' | null

  // Support both callback names
  const emit = (newVal) => {
    onChangeValue?.(newVal);
    onChangeText?.(newVal);
  };

  const title = value?.title || '';
  const url = value?.url || '';

  const handleTitleChange = (text) => {
    emit({ title: text, url });
  };

  const handleUrlChange = (text) => {
    emit({ title, url: text });
  };

    const titleError = typeof error === 'object' ? error?.title : null;
  const urlError   = typeof error === 'object' ? error?.url   : (typeof error === 'string' ? error : null);


  const normalizeUrl = (rawUrl) => {
    if (!rawUrl) return rawUrl;
    const trimmed = rawUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleUrlBlur = () => {
    setFocusedField(null);
    if (url) {
      emit({ title, url: normalizeUrl(url) });
    }
  };

  const handleOpenLink = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    try {
      const supported = await Linking.canOpenURL(normalized);
      if (supported) {
        await Linking.openURL(normalized);
      } else {
        Alert.alert('Invalid URL', `Cannot open this link: ${normalized}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong trying to open the link.');
    }
  };

  /** READ MODE - Tappable hyperlink */
  if (mode === 'read') {
    const hasValue = url.trim() !== '';

    return (
      <View style={styles.readContainer}>
   
        {hasValue ? (
          <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
            <Text
              variant="bodyLarge"
              style={[styles.readValue, styles.linkText, { color: theme.colors.primary, fontWeight:'bold' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title.trim() !== '' ? title : url}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            variant="bodyLarge"
            style={[styles.readValue, { color: theme.colors.textLight, fontStyle: 'italic' }]}
          >
            Not set
          </Text>
        )}
      </View>
    );
  }

  /** EDIT MODE - Title + URL fields */
  const getBorderColor = (field) => {
    if (error) return theme.colors.error;
    if (focusedField === field) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={styles.editContainer}>
     <Text
          variant="labelSmall"
          style={[
            styles.fieldLabel,
            { color: titleError ? theme.colors.error : theme.colors.textSecondary },
          ]}
        >
          Title
        </Text>

      {/* Title Field */}
      <RNTextInput
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Link title"
        placeholderTextColor={theme.colors.textLight}
        onFocus={() => setFocusedField('title')}
        onBlur={() => setFocusedField(null)}
        style={[
          styles.input,
          styles.titleInput,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor('title'),
            borderWidth: focusedField === 'title' ? 2 : 1,
            color: theme.colors.text,
          },
        ]}
        autoCapitalize="sentences"
        autoCorrect={true}
      />
       <Text
          variant="labelSmall"
          style={[
            styles.fieldLabel,
            { color: titleError ? theme.colors.error : theme.colors.textSecondary },
          ]}
        >
          Link URL
        </Text>

      {/* URL Field */}
      <RNTextInput
        value={url}
        onChangeText={handleUrlChange}
        placeholder="https://..."
        placeholderTextColor={theme.colors.textLight}
        keyboardType="url"
        onFocus={() => setFocusedField('url')}
        onBlur={handleUrlBlur}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor('url'),
            borderWidth: focusedField === 'url' ? 2 : 1,
            color: theme.colors.text,
          },
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            { color: error ? theme.colors.error : theme.colors.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // READ MODE STYLES
  readContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },
  readValue: {
    lineHeight: 22,
  },
  linkText: {
    textDecorationLine: 'underline',
  },

  // EDIT MODE STYLES
  editContainer: {
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
    transitionProperty: 'border-color, border-width',
    transitionDuration: '150ms',
  },
  titleInput: {
    marginBottom: 8,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
});