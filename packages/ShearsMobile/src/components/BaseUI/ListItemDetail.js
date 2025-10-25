import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { humanizeFieldName } from 'shears-shared/src/utils/stringHelpers';
import { FieldMap } from '../../config/component-mapping/FieldMap';
import PlainTextInput from '../SmartInputs/PlainTextInput';
import AddNestedItemButton from '../UI/AddNestedItemButton';
import { AuthContext } from '../../context/AuthContext';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { createRecord } from 'shears-shared/src/Services/Authentication';
import { sub } from 'date-fns';

export default function ListItemDetail({ route, navigation }) {
  const {token, user} = useContext(AuthContext);
  const { item = {}, appConfig, name, mode: initialMode = 'read' } = route.params; // Default to 'read' if mode not provided
  const theme = useTheme();
  const primaryColor = appConfig?.themeColors?.primary || theme.colors.primary;
  const secondaryColor = appConfig?.themeColors?.secondary || theme.colors.background;

  const [mode, setMode] = useState(initialMode); // Initialize mode from route.params
  const [formValues, setFormValues] = useState({});
  const [mappedFields, setMappedFields] = useState([]);

 useEffect(() => {
  console.log('🔄 useEffect triggered in ListItemDetail', {
    item,
    appConfig,
    name,
    initialMode,
    user
  });

  const currentRoute = appConfig?.mainNavigation.find(
    (r) => r.name === name || r.displayName === name
  );
  console.log('🔎 Found route:', currentRoute);

  let fields = [];

  if (currentRoute?.fields?.length) {
    fields = mapFields(currentRoute.fields);
    fields = fields.map((f) => {
      if (f.type.toLowerCase() === 'array' && !f.arrayConfig) {
        const sourceField = currentRoute.fields.find((cf) => cf.field === f.field);
        if (sourceField?.arrayConfig) {
          return { ...f, arrayConfig: sourceField.arrayConfig };
        } else {
          return {
            ...f,
            arrayConfig: {
              object: [{ field: 'value', type: 'string', label: f.label || f.field }],
            },
          };
        }
      }
      return f;
    });
    console.log('📋 Mapped fields from appConfig:', fields);
  } else if (Object.keys(item).length > 0) {
    fields = Object.keys(item)
      .filter((k) => !['avatar', 'firstName', 'lastName'].includes(k))
      .map((k) => {
        const isArray = Array.isArray(item[k]);
        const firstItem = isArray && item[k][0] ? item[k][0] : {};
        return {
          field: k,
          type: isArray
            ? 'array'
            : typeof item[k] === 'object' && item[k] !== null
            ? 'object'
            : 'string',
          displayInList: true,
          label: humanizeFieldName(k),
          arrayConfig: isArray
            ? {
                object: Object.keys(firstItem).map((subKey) => ({
                  field: subKey,
                  type: 'string',
                  label: humanizeFieldName(subKey),
                  defaultValue: '',
                })),
              }
            : undefined,
          objectConfig:
            typeof item[k] === 'object' && !isArray
              ? Object.keys(item[k]).map((subKey) => ({
                  field: subKey,
                  type: typeof item[k][subKey],
                  label: humanizeFieldName(subKey),
                  defaultValue: '',
                }))
              : undefined,
        };
      });
    console.log('📋 Mapped fields from item:', fields);
  } else {
    fields = currentRoute?.fields
      ? mapFields(currentRoute.fields)
      : [
          { field: 'name', type: 'string', label: 'Name', displayInList: true },
          { field: 'description', type: 'string', label: 'Description', displayInList: true },
        ];
    console.log('📋 Using fallback fields:', fields);
  }

  console.log('🔍 Final field definitions:', JSON.stringify(fields, null, 2));
  setMappedFields(fields);

  // Initialize form values
const initialFormValues = initialMode === 'add' 
  ? {} 
  : { ...(item.fieldsdata || item) };

  console.log('📋 Initial form values before processing:', initialFormValues);

  fields.forEach((field) => {
    if (initialMode === 'add') {
      if (field.type.toLowerCase() === 'array') {
        initialFormValues[field.field] = []; // Initialize as empty array
      } else if (field.type === 'object' && field.objectConfig) {
        initialFormValues[field.field] = {};
        field.objectConfig.forEach((subField) => {
          initialFormValues[field.field][subField.field] = subField.defaultValue ?? '';
        });
      } else {
        initialFormValues[field.field] = field.defaultValue ?? '';
      }
    } else {
      // Edit mode fallback
      if (field.type.toLowerCase() === 'array' && !initialFormValues[field.field]) {
        initialFormValues[field.field] = [];
      } else if (field.type === 'object' && !initialFormValues[field.field]) {
        initialFormValues[field.field] = {};
      }
    }
  });

  // Prepopulate array fields in add mode
  if (initialMode === 'add') {
    fields.forEach((field) => {
      if (field.type.toLowerCase() === 'array' && field.arrayConfig?.object?.length) {
        const minItems = field.arrayConfig.minItems || 0;
        if (minItems > 0 && !Array.isArray(initialFormValues[field.field])) {
          initialFormValues[field.field] = [];
          console.log(`📋 Corrected ${field.field} to empty array`);
        }
        if (minItems > 0 && initialFormValues[field.field].length === 0) {
          const newItem = {};
          field.arrayConfig.object.forEach((subField) => {
            newItem[subField.field] = subField.defaultValue ?? '';
          });
          initialFormValues[field.field] = [newItem];
          console.log(`📋 Prepopulated array field ${field.field}:`, initialFormValues[field.field]);
        }
      }
    });
  }

  console.log('📋 Final form values:', JSON.stringify(initialFormValues, null, 2));
  setFormValues(initialFormValues);
}, [appConfig, name, item, initialMode]);



  const isReadOnly = mode === 'read';

  const withOpacity = (hex, opacity) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  // --- Avatar and display name
  const displayNameFieldKey = Object.keys(formValues).find(
    (k) => k.toLowerCase().includes('name') && k !== 'firstName' && k !== 'lastName'
  );
  const displayNameValue = displayNameFieldKey ? formValues[displayNameFieldKey] : '';
  const initials = !formValues.avatar && displayNameValue
    ? displayNameValue.split(' ').map((n) => n[0]).join('').toUpperCase()
    : (formValues.firstName?.[0] || '?') + (formValues.lastName?.[0] || '');

  // --- Input handlers
  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

const handleNestedChange = (field, index, key, value) => {
  setFormValues((prev) => {
    const updated = [...(prev[field] || [])];
    updated[index] = { ...updated[index], [key]: value };
    return { ...prev, [field]: updated };
  });
};

const handleObjectChange = (parentField, key, value) => {
  setFormValues((prev) => ({
    ...prev,
    [parentField]: { ...prev[parentField], [key]: value },
  }));
};

const initializeArrayItem = (fieldKey) => {
  const fieldDef = mappedFields.find((f) => f.field === fieldKey);
  if (!fieldDef?.arrayConfig?.object) return {};
  const newItem = {};
  fieldDef.arrayConfig.object.forEach((subField) => {
    newItem[subField.field] = subField.defaultValue ?? '';
  });
  return newItem;
};

const handleAddNestedItem = (field) => {
  setFormValues((prev) => {
    const newItem = initializeArrayItem(field);
    return { ...prev, [field]: [...(prev[field] || []), newItem] };
  });
};

const handleRemoveNestedItem = (field, index) => {
  setFormValues((prev) => {
    const updated = [...(prev[field] || [])];
    updated.splice(index, 1);
    return { ...prev, [field]: updated };
  });
};

 const handleSave = async () => {
  console.log('💾 Saving formValues:', JSON.stringify(formValues, null, 2));
  // ... validation logic ...
  if (!token) {
    Alert.alert('Authentication Error', 'Please log in to save data.');
    return;
  }
  try {
  await createRecord(formValues, name.toLowerCase(), token, user.subscriberId, user.userId);
    console.log('💾 Saved successfully:', formValues);
    setMode('read');
    navigation.goBack();
  } catch (error) {
    console.error('Save failed:', error);
    Alert.alert('Error', error.message || 'Failed to save item. Please try again.');
  }
};

  const handleDelete = () => {
    console.log('🗑 Delete:', formValues);
    navigation.goBack();
  };

  // --- Recursive field renderer
  const renderFieldRecursive = (fieldKey, value, fieldDef, parentFieldKey, index) => {
  const def = fieldDef || mappedFields.find((f) => f.field === fieldKey);
  if (!def) return null;

  // --- Array fields ---
  if (def.type?.toLowerCase() === 'array' && def.arrayConfig) {
    const objectConfig = def.arrayConfig.object || [];
    const safeValue = Array.isArray(value)
      ? value
      : value === undefined || value === null
      ? []
      : typeof value === 'object'
      ? Object.values(value)
      : [];

    if (!Array.isArray(value)) {
      console.warn(`⚠️ Field "${fieldKey}" expected an array but got:`, typeof value, value);
    }

    return (
      <LiquidGlassView
        key={fieldKey}
        style={[styles.arrayContainer, !isLiquidGlassSupported && { backgroundColor: '#fff' }]}
        effect="regular"
        tintColor={withOpacity(primaryColor, 0.2)}
        colorScheme="system"
      >
        <Text style={[styles.arrayTitle, { color: theme.colors.onSurface }]}>{def.label}</Text>

        {safeValue.length === 0 && isReadOnly ? (
          <Text style={{ color: theme.colors.disabled }}>None</Text>
        ) : (
          safeValue.map((entry, idx) => (
            <View
              key={idx}
              style={[styles.arrayItem, { backgroundColor: withOpacity(theme.colors.surface, 0.1) }]}
            >
              {objectConfig.map((subField) =>
                renderFieldRecursive(
                  subField.field,
                  entry?.[subField.field],
                  subField,
                  fieldKey,
                  idx
                )
              )}

              {!isReadOnly && (
                <TouchableOpacity
                  onPress={() => handleRemoveNestedItem(fieldKey, idx)}
                  style={styles.deleteButton}
                >
                  <Icon name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {!isReadOnly && (
          <AddNestedItemButton label={def.label} onPress={() => handleAddNestedItem(fieldKey)} />
        )}
      </LiquidGlassView>
    );
  }

  // --- Singular object fields ---
  if (def.type === 'object' && def.objectConfig) {
    const safeObject = typeof value === 'object' && value !== null ? value : {};
    return (
      <LiquidGlassView
        key={fieldKey}
        style={[styles.arrayContainer, !isLiquidGlassSupported && { backgroundColor: '#fff' }]}
        effect="regular"
        tintColor={withOpacity(primaryColor, 0.2)}
        colorScheme="system"
      >
        <Text style={[styles.arrayTitle, { color: theme.colors.onSurface }]}>{def.label}</Text>
        {def.objectConfig.map((subField) =>
          renderFieldRecursive(
            subField.field,
            safeObject[subField.field],
            subField,
            fieldKey,
            undefined
          )
        )}
      </LiquidGlassView>
    );
  }

  // --- Primitive fields ---
  const InputComponent = FieldMap[def.input] || PlainTextInput;
  return (
    <LiquidGlassView
      key={fieldKey}
      style={[styles.arrayContainer, !isLiquidGlassSupported && { backgroundColor: '#fff' }]}
      effect="regular"
      tintColor={withOpacity(primaryColor, 0.15)}
      colorScheme="system"
    >
      <Text style={[styles.label, { color: theme.colors.onSurface, marginBottom: 4 }]}>{def.label}</Text>

      {isReadOnly ? (
        <Text style={[styles.value, { color: theme.colors.onSurface }]}>{value ?? '(empty)'}</Text>
      ) : (
        <InputComponent
          value={value?.toString() || ''}
         onChangeText={(val) => {
  if (parentFieldKey && index !== undefined) {
    // Nested array field
    handleNestedChange(parentFieldKey, index, fieldKey, val);
  } else if (parentFieldKey) {
    // Nested object field
    handleObjectChange(parentFieldKey, fieldKey, val);
  } else {
    // Top-level field
    handleInputChange(fieldKey, val);
  }
}}
          placeholder={def.display?.placeholder || `Enter ${def.label}`}
          style={styles.paperInput}
          theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface } }}
          label={def.label}
          options={def.inputConfig?.options || []}
          {...(def.inputConfig || {})}
        />
      )}
    </LiquidGlassView>
  );
};


  return (
    <LinearGradient colors={[withOpacity(primaryColor, 0.6), withOpacity(secondaryColor, 0.6)]} style={styles.gradient}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <LiquidGlassView
          style={[styles.backButtonGlass, !isLiquidGlassSupported && { backgroundColor: theme.colors.surface }]}
          tintColor="rgba(255,255,255,0.1)"
          effect="clear"
          interactive
        >
          <Icon name="arrow-back" size={24} color={theme.colors.onSurface} />
        </LiquidGlassView>
      </TouchableOpacity>

      {/* Edit/Save Button */}
      <TouchableOpacity style={styles.editButton} onPress={() => (isReadOnly ? setMode('edit') : handleSave())}>
        <LiquidGlassView
          style={[styles.backButtonGlass, !isLiquidGlassSupported && { backgroundColor: theme.colors.surface }]}
          tintColor="rgba(255,255,255,0.1)"
          effect="clear"
          interactive
        >
          {isReadOnly ? (
            <Text style={[styles.editText, { color: primaryColor }]}>Edit</Text>
          ) : (
            <Icon name="check" size={24} color={primaryColor} />
          )}
        </LiquidGlassView>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {formValues.avatar ? (
            <Avatar.Image size={100} source={{ uri: formValues.avatar }} />
          ) : (
            <Avatar.Text size={100} label={initials} style={{ backgroundColor: primaryColor }} color="#fff" />
          )}
        </View>

        {/* Display Name */}
        {displayNameValue ? (
          <Text style={[styles.nameHeader, { color: theme.colors.onSurface }]}>{displayNameValue}</Text>
        ) : (
          (formValues.firstName || formValues.lastName) && (
            <Text style={[styles.nameHeader, { color: theme.colors.onSurface }]}>
              {formValues.firstName} {formValues.lastName}
            </Text>
          )
        )}

        {/* Render Fields */}
        {mappedFields.map((field) =>
          renderFieldRecursive(field.field, formValues[field.field], field)
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  backButtonGlass: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  editButton: { position: 'absolute', top: 50, right: 20, zIndex: 2 },
  editButtonGlass: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  editText: { fontSize: 16, fontWeight: 'bold' },
  avatarContainer: { marginBottom: 20 },
  nameHeader: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  stackedField: { width: '100%', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 16, flexWrap: 'wrap' },
  paperInput: { width: '100%' },
  arrayContainer: {
    width: '100%',
    marginBottom: 15,
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  arrayTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  arrayItem: {
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: { position: 'absolute', top: 4, right: 4 },
});