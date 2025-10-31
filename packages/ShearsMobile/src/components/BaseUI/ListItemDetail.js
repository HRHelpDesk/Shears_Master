// src/screens/ListItemDetail.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useTheme, Card, Text, Divider, Button, Portal } from 'react-native-paper';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { FieldMap } from '../../config/component-mapping/FieldMap';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { createRecord, updateRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';
import PlainTextInput from '../../components/SmartInputs/PlainTextInput';

const getValue = (source, path) => {
  if (!source || !path) return '';
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((acc, key) => acc?.[key], source) ?? '';
};

const RenderField = ({ fieldDef, item, handleChange, mode, theme, level = 0, parentPath = '' }) => {
  const inputType = fieldDef.input || fieldDef.type || 'text';
  const nestedFields = fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;
  const fieldPath = parentPath ? `${parentPath}.${fieldDef.field}` : fieldDef.field;
  const value = getValue(item, fieldPath);

  // Initialize missing structures
  if (fieldDef.arrayConfig?.object && !Array.isArray(value)) handleChange(fieldPath, []);
  else if (fieldDef.objectConfig && (value === undefined || typeof value !== 'object'))
    handleChange(fieldPath, {});

  // 🧩 ARRAY FIELDS
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
      <Card style={{ marginVertical: 8, marginLeft: level * 10 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 4 }}>
            {fieldDef.label || fieldDef.field}
          </Text>
          <Divider />

          {value.length === 0 ? (
            <View style={{ marginVertical: 8 }}>
              {mode === 'edit' ? (
                <TouchableOpacity onPress={handleAddArrayItem}>
                  <Text
                    style={{
                      fontStyle: 'italic',
                      color: theme.colors.primary,
                      marginLeft: 4,
                    }}
                  >
                    + Add first entry
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: 4,
                    fontStyle: 'italic',
                  }}
                >
                  No entries
                </Text>
              )}
            </View>
          ) : (
            value.map((entry, idx) => (
              <Card
                key={`${fieldPath}[${idx}]`}
                style={{
                  marginTop: 8,
                  padding: 10,
                  backgroundColor: theme.colors.surfaceVariant,
                    borderRadius:2
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                    borderRadius:1
                  }}
                >
                  <Text variant="titleSmall">
                    {(fieldDef.label || fieldDef.field)} #{idx + 1}
                  </Text>

                  {(mode === 'edit' || mode === 'add') && (
                    <Button
                      mode="contained-tonal"
                      compact
                      onPress={() => handleDeleteArrayItem(idx)}
                      textColor={theme.colors.error}
                      style={{
                        backgroundColor: theme.colors.errorContainer,
                        borderRadius: 1,
                        paddingHorizontal: 6,
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </View>

                {/* ✅ Handle linkSelect arrays properly */}
                {fieldDef.input === 'linkSelect' ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
                    recordTypeName={fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'}
                    onChangeText={(newVal) => {
                      const updated = [...value];
                      updated[idx] = newVal;
                      handleChange(fieldPath, updated);
                    }}
                  />
                ) : (
                  nestedFields.map((nestedField) => (
                    <RenderField
                      key={nestedField.field}
                      fieldDef={nestedField}
                      item={item}
                      handleChange={handleChange}
                      mode={mode}
                      theme={theme}
                      level={level + 1}
                      parentPath={`${fieldPath}[${idx}]`}
                    />
                  ))
                )}
              </Card>
            ))
          )}

          {(mode === 'edit' || mode === 'add') && (
            <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
              <Button mode="contained" onPress={handleAddArrayItem} style={{ borderRadius: 1 }}>
                + Add {singularize(fieldDef.label || fieldDef.field)}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }

if (fieldDef.input === 'linkSelect' && !Array.isArray(value)) {
  return (
    <Card style={{ marginVertical: 6, marginLeft: level * 10 }}>
      <Card.Content>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          recordTypeName={
            fieldDef.inputConfig?.recordType ||
            fieldDef.recordTypeName ||
            'contacts'
          }
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        />
      </Card.Content>
    </Card>
  );
}

// 🧱 OBJECT FIELDS (for nested field objects)
if (
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  fieldDef.objectConfig
) {
  return (
    <Card style={{ marginVertical: 8, marginLeft: level * 10 }}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 4 }}>
          {fieldDef.label || fieldDef.field}
        </Text>
        <Divider />
        {nestedFields.map((nestedField) => (
          <RenderField
            key={nestedField.field}
            fieldDef={nestedField}
            item={item}
            handleChange={handleChange}
            mode={mode}
            theme={theme}
            level={level + 1}
            parentPath={fieldPath}
          />
        ))}
      </Card.Content>
    </Card>
  );
}

  // ✏️ SIMPLE FIELD TYPES
  if (fieldDef.input === 'linkSelect') {
    return (
      <Card style={{ marginVertical: 6, marginLeft: level * 10 }}>
        <Card.Content>
          <FieldMap.linkSelect
            label={fieldDef.label || fieldDef.field}
            value={value}
            mode={mode}
            recordTypeName={fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'}
            onChangeText={(newVal) => handleChange(fieldPath, newVal)}
          />
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={{ marginVertical: 6, marginLeft: level * 10 }}>
      <Card.Content>
        <FieldComponent
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
          multiline={fieldDef.input === 'textarea'}
          keyboardType={fieldDef.input === 'number' ? 'numeric' : 'default'}
          options={
            fieldDef.input === 'select' ? fieldDef.inputConfig?.options || [] : []
          }
        />
      </Card.Content>
    </Card>
  );
};


export default function ListItemDetailScreen({ route, navigation }) {
  const { item = {}, name, appConfig, fields = [], mode: initialMode = 'read' } = route.params;
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    console.log('Fields:', fields);
  }, []);

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
      if (mode === 'edit' && item._id) {
        await updateRecord(item._id, localItem, token);
      } else {
        await createRecord(localItem, name.toLowerCase(), token, user.subscriberId, user.userId);
      }
      setMode('read');
      navigation.goBack();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
       <Portal.Host>
          <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
       
      >
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background, padding: 12 }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <Card style={{ marginBottom: 10, paddingBottom: 4 }}>
        <Card.Content>
          <Text variant="titleLarge" style={{ marginBottom: 6 }}>
            {mode === 'add'
              ? `Add ${singularize(name)}`
              : localItem?.serviceName || localItem?.firstName || 'Item Detail'}
          </Text>
          <Divider style={{ marginBottom: 6 }} />
        </Card.Content>

        <Card.Content style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
       {/* Header Actions */}
<Card.Content style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
  {mode === 'read' ? (
    <>
      <Button onPress={() => navigation.goBack()}>Close</Button>
      <Button mode="contained" onPress={() => setMode('edit')}>
        Edit
      </Button>
    </>
  ) : mode === 'add' ? (
    <>
      <Button onPress={() => navigation.goBack()}>Close</Button>
      <Button mode="contained" onPress={handleSave}>
        Save
      </Button>
    </>
  ) : (
    <>
      <Button onPress={() => setMode('read')}>Cancel</Button>
      <Button mode="contained" onPress={handleSave}>
        Save
      </Button>
    </>
  )}
</Card.Content>

        </Card.Content>
      </Card>

      {/* Body */}
      {fields.map((field) => (
     
        <RenderField
          key={field.field}
          fieldDef={field}
          item={localItem}
          handleChange={handleChange}
          mode={mode}
          theme={theme}
        />
    
      ))}

    </ScrollView>
    </KeyboardAvoidingView>
               </Portal.Host>
  );
}
