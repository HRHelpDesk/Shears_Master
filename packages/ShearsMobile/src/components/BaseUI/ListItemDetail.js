import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme, Text, Divider, Button, Portal } from 'react-native-paper';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { FieldMap } from '../../config/component-mapping/FieldMap';
import { createRecord, updateRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';
import PlainTextInput from '../../components/SmartInputs/PlainTextInput';
import { GlassActionButton } from '../UI/GlassActionButton';
import { getDisplayTitle } from 'shears-shared/src/utils/stringHelpers';

const getValue = (source, path) => {
  if (!source || !path) return '';
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((acc, key) => acc?.[key], source) ?? '';
};

/* -------------------------------------------------------------------------- */
/*                       Helper: Render Nested Fields (Grid)                  */
/* -------------------------------------------------------------------------- */
const RenderNestedFields = ({ nestedFields, item, handleChange, mode, theme, parentPath, columns = 3 }) => {
  const groupedByRow = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400;
  const effectiveColumns = isSmallScreen ? 1 : columns;

  return (
    <>
      {Object.keys(groupedByRow).map((rowKey) => {
        const rowFields = groupedByRow[rowKey];
        const totalSpan = rowFields.reduce((s, f) => s + (f.layout?.span || 1), 0);

        return (
          <View key={`row-${rowKey}`} style={[styles.columnsContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {rowFields.map((nestedField) => {
              const span = nestedField.layout?.span || 1;
              const width = `${(span / totalSpan) * 100}%`;

              return (
                <View key={nestedField.field} style={[styles.columnItem, { width, paddingRight: 8 }]}>
                  <RenderField
                    fieldDef={nestedField}
                    item={item}
                    handleChange={handleChange}
                    mode={mode}
                    theme={theme}
                    level={0}
                    parentPath={parentPath}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Render Field Component                           */
/* -------------------------------------------------------------------------- */
const RenderField = ({ fieldDef, item, handleChange, mode, theme, level = 0, parentPath = '' }) => {
  const inputType = fieldDef.input || fieldDef.type || 'text';
  const nestedFields = fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;
  const fieldPath = parentPath ? `${parentPath}.${fieldDef.field}` : fieldDef.field;
  const value = getValue(item, fieldPath);

  if (fieldDef.arrayConfig?.object && !Array.isArray(value)) handleChange(fieldPath, []);
  else if (fieldDef.objectConfig && (value === undefined || typeof value !== 'object'))
    handleChange(fieldPath, {});

  /* ----------------------------- ARRAY FIELDS ----------------------------- */
  if (Array.isArray(value)) {
    const handleAddArrayItem = () => {
      const newItem =
        fieldDef.input === 'linkSelect'
          ? { _id: '', name: '' }
          : Object.fromEntries((nestedFields || []).map((nf) => [nf.field, '']));
      handleChange(fieldPath, [...value, newItem]);
    };

    const handleDeleteArrayItem = (idx) => {
      const updated = [...value];
      updated.splice(idx, 1);
      handleChange(fieldPath, updated);
    };

    return (
      <View style={[styles.arraySection, { marginLeft: level * 16 }]}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {fieldDef.label || fieldDef.field}
          </Text>
          {(mode === 'edit' || mode === 'add') && (
            <Button mode="text" onPress={handleAddArrayItem} icon="plus" compact textColor={theme.colors.primary}>
              Add
            </Button>
          )}
        </View>
        <Divider style={{ marginBottom: 12 }} />

        {value.length === 0 ? (
          <View style={styles.emptyState}>
            {mode === 'edit' ? (
              <TouchableOpacity onPress={handleAddArrayItem}>
                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>Tap to add first entry</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No entries</Text>
            )}
          </View>
        ) : (
          value.map((entry, idx) => (
            <View
              key={`${fieldPath}[${idx}]`}
              style={[
                styles.arrayItemCard,
                {
                  backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(74,144,226,0.03)',
                  borderWidth: 1,
                  borderColor: theme.dark ? '#4B5563' : '#F3F4F6',
                },
              ]}
            >
              <View style={styles.arrayItemHeader}>
                <Text variant="labelLarge" style={{ color: theme.colors.text }}>
                  {singularize(fieldDef.label || fieldDef.field)} #{idx + 1}
                </Text>

                {(mode === 'edit' || mode === 'add') && (
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleDeleteArrayItem(idx)}
                    textColor={theme.colors.error}
                    icon="delete-outline"
                  >
                    Remove
                  </Button>
                )}
              </View>

              <View style={styles.arrayItemContent}>
                {fieldDef.input === 'linkSelect' ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
                    recordTypeName={
                      fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'
                    }
                    onChangeText={(newVal) => {
                      const updated = [...value];
                      updated[idx] = newVal;
                      handleChange(fieldPath, updated);
                    }}
                  />
                ) : (
                  <RenderNestedFields
                    nestedFields={nestedFields}
                    item={item}
                    handleChange={handleChange}
                    mode={mode}
                    theme={theme}
                    parentPath={`${fieldPath}[${idx}]`}
                    columns={fieldDef.columns || 3}
                  />
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  /* ----------------------------- LINK SELECT ----------------------------- */
  if (fieldDef.input === 'linkSelect' && !Array.isArray(value)) {
    return (
      <View style={[styles.fieldWrapper, { marginLeft: level * 16 }]}>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          recordTypeName={
            fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'
          }
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        />
      </View>
    );
  }

  /* ----------------------------- OBJECT FIELDS ---------------------------- */
  if (value && typeof value === 'object' && !Array.isArray(value) && fieldDef.objectConfig) {
    return (
      <View style={[styles.objectSection, { marginLeft: level * 16 }]}>
        <Text variant="titleSmall" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
          {fieldDef.label || fieldDef.field}
        </Text>
        <View
          style={[
            styles.objectContent,
            {
              backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(74,144,226,0.03)',
              borderWidth: 1,
              borderColor: theme.dark ? '#4B5563' : '#F3F4F6',
            },
          ]}
        >
          <RenderNestedFields
            nestedFields={nestedFields}
            item={item}
            handleChange={handleChange}
            mode={mode}
            theme={theme}
            parentPath={fieldPath}
            columns={fieldDef.columns || 3}
          />
        </View>
      </View>
    );
  }

  /* ----------------------------- SIMPLE FIELDS ---------------------------- */
  return (
    <View style={[styles.fieldWrapper, { marginLeft: level * 16 }]}>
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        multiline={fieldDef.input === 'textarea'}
        keyboardType={fieldDef.input === 'number' ? 'numeric' : 'default'}
        options={fieldDef.input === 'select' ? fieldDef.inputConfig?.options || [] : []}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Main Component                                 */
/* -------------------------------------------------------------------------- */
export default function ListItemDetailScreen({ route, navigation }) {
  const { item = {}, name, fields = [], mode: initialMode = 'read' } = route.params;
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const initializeItemFromFields = (fields) => {
    const obj = {};
    fields.forEach((f) => {
      if (f.objectConfig) obj[f.field] = initializeItemFromFields(f.objectConfig);
      else if (f.arrayConfig?.object || f.type === 'array') obj[f.field] = [];
      else obj[f.field] = '';
    });
    return obj;
  };

  const initialData = useMemo(() => {
    if (item?.fieldsData) return item.fieldsData;
    if (item && Object.keys(item).length > 0) return item;
    return initializeItemFromFields(fields);
  }, [item, fields]);

  const [localItem, setLocalItem] = useState(initialData);
  const [mode, setMode] = useState(initialMode);

  /* ------------------- Auto Duration + End Time Logic --------------------- */
  useEffect(() => {
    if (!localItem) return;
    let totalMinutes = 0;

    const findDurations = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.raw?.duration) {
        const { hours = '0', minutes = '0' } = obj.raw.duration;
        totalMinutes += parseInt(hours || 0) * 60 + parseInt(minutes || 0);
      }
      if (Array.isArray(obj)) obj.forEach((item) => findDurations(item));
      else Object.values(obj).forEach((val) => findDurations(val));
    };

    findDurations(localItem);

    if (totalMinutes > 0) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setLocalItem((prev) => {
        const updated = { ...prev };
        updated.duration = {
          hours: hours.toString(),
          minutes: minutes.toString().padStart(2, '0'),
        };
        if (updated.time?.startTime) {
          const [h, m] = updated.time.startTime.split(':').map(Number);
          const start = new Date(0, 0, 0, h, m);
          const end = new Date(start.getTime() + totalMinutes * 60000);
          updated.time.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(
            end.getMinutes()
          ).padStart(2, '0')}`;
        }
        return updated;
      });
    }
  }, [localItem?._id, localItem.service]);

  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let target = updated;
      while (keys.length > 1) {
        const key = keys.shift();
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      target[keys[0]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      if (mode === 'edit' && item._id) await updateRecord(item._id, localItem, token);
      else await createRecord(localItem, name.toLowerCase(), token, user.subscriberId, user.userId);
      setMode('read');
      navigation.goBack();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <Portal.Host>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.headerContainer,
            { backgroundColor: theme.colors.background, zIndex: 10, paddingHorizontal: 15, paddingTop: 25 },
          ]}
        >
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineMedium" style={{ color: theme.colors.text, fontWeight: '600' }}>
                {getDisplayTitle(localItem, name, mode)}
              </Text>
              {mode === 'read' && localItem?.createdAt && (
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                  Created {new Date(localItem.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {mode === 'read' ? (
                <>
                  <GlassActionButton icon="pencil" onPress={() => setMode('edit')} color={theme.colors.primary} theme={theme} />
                  <GlassActionButton icon="close" onPress={() => navigation.goBack()} theme={theme} />
                </>
              ) : (
                <>
                  <GlassActionButton icon="check" onPress={handleSave} color={theme.colors.primary} theme={theme} />
                  <GlassActionButton
                    icon="close"
                    onPress={() => (mode === 'add' ? navigation.goBack() : setMode('read'))}
                    theme={theme}
                  />
                </>
              )}
            </View>
          </View>
          <Divider style={{ marginTop: 12, marginBottom: 4, opacity: 0.4 }} />
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.scrollContent}>
          <View style={styles.fieldsContainer}>
            {fields.map((field, index) => (
              <React.Fragment key={field.field}>
                <RenderField fieldDef={field} item={localItem} handleChange={handleChange} mode={mode} theme={theme} />
                {index < fields.length - 1 && <Divider style={{ marginVertical: 12, opacity: 0.3 }} />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Portal.Host>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  headerContainer: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 12, marginLeft: 16, alignItems: 'center' },
  fieldWrapper: { marginBottom: 16 },
  arraySection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  emptyState: { paddingVertical: 24, alignItems: 'center' },
  arrayItemCard: { marginBottom: 12, borderRadius: 8, padding: 12 },
  arrayItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  objectSection: { marginBottom: 5 },
  objectContent: { padding: 12, borderRadius: 8 },
  columnsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  columnItem: { marginBottom: 8 },
});
