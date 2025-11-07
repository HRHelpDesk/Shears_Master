// src/components/ListItemDetail.jsx
import React, { useContext, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Button as MuiButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { FieldMap } from '../../config/component-mapping/FieldMap';
import PlainTextInput from './SmartInputs/PlainTextInput';

import {
  singularize,
  getDisplayTitle,
  formatCurrency,
  currencyToNumber,
} from 'shears-shared/src/utils/stringHelpers';

import {
  createRecord,
  deleteRecord,
  updateRecord,
} from 'shears-shared/src/Services/Authentication';

import { AuthContext } from '../../context/AuthContext';

/* -------------------------------------------------------------- */
/* ✅ Helper — safe nested accessor                                */
/* -------------------------------------------------------------- */
const getValue = (source, path) => {
  if (!source || !path) return '';
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((acc, key) => acc?.[key], source) ?? '';
};

/* -------------------------------------------------------------- */
/* ✅ Grid renderer for nested fields                              */
/* -------------------------------------------------------------- */
const RenderNestedFields = ({
  nestedFields = [],
  item,
  handleChange,
  mode,
  theme,
  parentPath,
}) => {
  const grouped = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  return (
    <>
      {Object.keys(grouped).map((rowKey) => {
        const rowFields = grouped[rowKey];
        const totalSpan = rowFields.reduce(
          (s, f) => s + (f.layout?.span || 1),
          0
        );

        return (
          <Box
            key={rowKey}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}
          >
            {rowFields.map((nf) => {
              const span = nf.layout?.span || 1;
              const width = `calc(${(span / totalSpan) * 100}% - 8px)`;

              return (
                <Box key={nf.field} sx={{ flex: `0 0 ${width}`, minWidth: 200 }}>
                  {renderField(
                    nf,
                    item,
                    handleChange,
                    mode,
                    theme,
                    0,
                    parentPath
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </>
  );
};

/* -------------------------------------------------------------- */
/* ✅ MAIN FIELD RENDERER                                          */
/* -------------------------------------------------------------- */
const renderField = (
  fieldDef,
  item,
  handleChange,
  mode,
  theme,
  level = 0,
  parentPath = ''
) => {
  const inputType = fieldDef.input || fieldDef.type || 'text';
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;

  const fieldPath = parentPath
    ? `${parentPath}.${fieldDef.field}`
    : fieldDef.field;

  const value = getValue(item, fieldPath);

  /* -------------------------------------------------------------- */
  /* ✅ Detect array fields (schema-based)                          */
  /* -------------------------------------------------------------- */
  const shouldBeArray =
    Array.isArray(fieldDef.arrayConfig?.object) ||
    fieldDef.type === 'array' ||
    fieldDef.input === 'array';

  if (shouldBeArray && !Array.isArray(value)) {
    handleChange(fieldPath, []);
  }

  /* -------------------------------------------------------------- */
  /* ✅ ARRAY FIELD RENDERING                                       */
  /* -------------------------------------------------------------- */
  if (Array.isArray(value)) {
    const addItem = () => {
      const newItem =
        fieldDef.input === 'linkSelect'
          ? { _id: '', name: '' }
          : Object.fromEntries(nestedFields.map((nf) => [nf.field, '']));

      handleChange(fieldPath, [...value, newItem]);
    };

    const deleteItem = (idx) => {
      const updated = [...value];
      updated.splice(idx, 1);
      handleChange(fieldPath, updated);
    };

    return (
      <Box key={fieldPath} sx={{ mb: 3, ml: level * 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main }}>
            {fieldDef.label || fieldDef.field}
          </Typography>

          {(mode === 'edit' || mode === 'add') && (
            <MuiButton
              size="small"
              startIcon={<AddIcon />}
              onClick={addItem}
              sx={{ textTransform: 'none' }}
            >
              Add
            </MuiButton>
          )}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Items */}
        {value.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary', py: 2 }}
            onClick={mode !== 'read' ? addItem : undefined}
          >
            {mode !== 'read' ? '+ Add first entry' : 'No entries'}
          </Typography>
        ) : (
          value.map((entry, idx) => (
            <Box
              key={`${fieldPath}[${idx}]`}
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(74,144,226,0.04)',
              }}
            >
              {/* Item header */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {singularize(fieldDef.label || fieldDef.field)} #{idx + 1}
                </Typography>

                {(mode === 'edit' || mode === 'add') && (
                  <MuiButton
                    size="small"
                    startIcon={<DeleteOutlineIcon />}
                    sx={{ textTransform: 'none', color: theme.palette.error.main }}
                    onClick={() => deleteItem(idx)}
                  >
                    Remove
                  </MuiButton>
                )}
              </Box>

              {/* Item content */}
              {fieldDef.input === 'linkSelect' ? (
                <FieldMap.linkSelect
                  label={fieldDef.label}
                  value={entry}
                  mode={mode}
                  recordTypeName={fieldDef.inputConfig?.recordType}
                  onChangeText={(nv) => {
                    const updated = [...value];
                    updated[idx] = nv;
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
                />
              )}
            </Box>
          ))
        )}
      </Box>
    );
  }

  /* -------------------------------------------------------------- */
  /* ✅ LINK SELECT                                                 */
  /* -------------------------------------------------------------- */
  if (fieldDef.input === 'linkSelect') {
    return (
      <Box key={fieldPath} sx={{ mb: 2 }}>
        <FieldComponent
          label={fieldDef.label}
          value={value}
          mode={mode}
          recordTypeName={fieldDef.inputConfig?.recordType}
          onChangeText={(nv) => handleChange(fieldPath, nv)}
        />
      </Box>
    );
  }

  /* -------------------------------------------------------------- */
  /* ✅ OBJECT FIELD                                                */
  /* -------------------------------------------------------------- */
  const isObjectField =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    fieldDef.objectConfig;

  if (isObjectField) {
    return (
      <Box key={fieldPath} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {fieldDef.label}
        </Typography>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(74,144,226,0.04)',
          }}
        >
          <RenderNestedFields
            nestedFields={fieldDef.objectConfig}
            item={item}
            handleChange={handleChange}
            parentPath={fieldPath}
            mode={mode}
            theme={theme}
          />
        </Box>
      </Box>
    );
  }

  /* -------------------------------------------------------------- */
  /* ✅ SIMPLE FIELD                                                */
  /* -------------------------------------------------------------- */
  return (
    <Box key={fieldPath} sx={{ mb: 2 }}>
      <FieldComponent
        label={fieldDef.label}
        value={value}
        mode={mode}
        onChangeText={(nv) => handleChange(fieldPath, nv)}
        multiline={fieldDef.input === 'textarea'}
        keyboardType={fieldDef.input === 'number' ? 'numeric' : 'default'}
      />
    </Box>
  );
};

/* ========================================================================================= */
/*                                    MAIN COMPONENT                                         */
/* ========================================================================================= */

export default function ListItemDetail({
  open,
  onClose,
  item = {},
  fields = [],
  mode: initialMode = 'read',
  name,
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  /* -------------------------------------------------------------- */
  /* ✅ Initialize object from schema                               */
  /* -------------------------------------------------------------- */
  const initFromFields = (fields) => {
    const o = {};
    fields.forEach((f) => {
      const isArrayField =
        Array.isArray(f.arrayConfig?.object) ||
        f.type === 'array' ||
        f.input === 'array';

      if (isArrayField) {
        o[f.field] = [];
      } else if (f.objectConfig) {
        o[f.field] = initFromFields(f.objectConfig);
      } else {
        o[f.field] = '';
      }
    });
    return o;
  };

  /* -------------------------------------------------------------- */
  /* ✅ initialData generation                                      */
  /* -------------------------------------------------------------- */
  const initialData = useMemo(() => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return initFromFields(fields);
    }

    if (item.fieldsData && typeof item.fieldsData === 'object') {
      return item.fieldsData;
    }

    if (Object.keys(item).length > 0) return item;

    return initFromFields(fields);
  }, [item, fields]);

  const [localItem, setLocalItem] = React.useState(initialData);
  const [mode, setMode] = React.useState(initialMode);

  const lastAutoAmount = React.useRef(0);

  /* -------------------------------------------------------------- */
  /* ✅ FIX: initialize auto baseline for edit mode                 */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    const initial = currencyToNumber(localItem?.payment?.amount || "0");
    lastAutoAmount.current = isNaN(initial) ? 0 : initial;
  }, []);

  /* -------------------------------------------------------------- */
  /* ✅ Auto Duration + Auto Payment                                */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!localItem) return;

    let totalMinutes = 0;
    let totalAmount = 0;

    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj.raw?.duration) {
        const { hours = '0', minutes = '0' } = obj.raw.duration;
        totalMinutes += (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      }

      if (obj.raw?.price) {
        const price = currencyToNumber(obj.raw.price);
        if (!isNaN(price)) totalAmount += price;
      }

      if (Array.isArray(obj)) obj.forEach(walk);
      else Object.values(obj).forEach(walk);
    };

    walk(localItem);

    setLocalItem((prev) => {
      const u = { ...prev };

      if (totalMinutes > 0) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        u.duration = {
          hours: h.toString(),
          minutes: m.toString().padStart(2, '0'),
        };

        if (u.time?.startTime) {
          const [sh, sm] = u.time.startTime.split(':').map(Number);
          const start = new Date(0, 0, 0, sh, sm);
          const end = new Date(start.getTime() + totalMinutes * 60000);

          u.time.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(
            end.getMinutes()
          ).padStart(2, '0')}`;
        }
      }

      if (!u.payment) u.payment = { amount: '', status: 'Open', action: {} };

      const current = currencyToNumber(u.payment.amount);

      // ✅ FIX: overwrite only when user has NOT manually changed it this session
      if (!u.payment.amount || current === lastAutoAmount.current) {
        u.payment.amount = formatCurrency(String(totalAmount));
        lastAutoAmount.current = totalAmount;
      }

      return u;
    });
  }, [
    localItem.service,
    localItem.product,
    localItem.addOns,
    localItem._id,
  ]);

  /* -------------------------------------------------------------- */
  /* ✅ Path-based update                                            */
  /* -------------------------------------------------------------- */
  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let t = updated;

      while (keys.length > 1) {
        const k = keys.shift();
        if (!t[k]) t[k] = {};
        t = t[k];
      }

      t[keys[0]] = value;
      return updated;
    });
  };

  /* -------------------------------------------------------------- */
  /* ✅ Save                                                        */
  /* -------------------------------------------------------------- */
  const handleSave = async () => {
    try {
      if (mode === 'edit' && item._id) {
        await updateRecord(item._id, localItem, token);
        setMode('read');
      } else {
        await createRecord(
          localItem,
          name.toLowerCase(),
          token,
          user.subscriberId,
          user.userId
        );
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async () => {
  if (!item?._id) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this item? This action cannot be undone."
  );
  if (!confirmed) return;

  try {
    await deleteRecord(item._id, token);
    onClose(); // ✅ closes modal (parent already refreshes list)
  } catch (err) {
    console.error(err);
    alert("Error deleting record: " + err.message);
  }
};


  /* Reset when parent changes */
  useEffect(() => {
    setLocalItem(initialData);
    setMode(initialMode);
  }, [item, initialMode, initialData]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', md: '70%', lg: '60%' },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ---------------------- HEADER ---------------------- */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {getDisplayTitle(localItem, name, mode)}
              </Typography>

              {mode === 'read' && localItem?.createdAt && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Created {new Date(localItem.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1.5}>
              {mode === 'read' ? (
                <>
                  {/* ✅ DELETE BUTTON */}
                  {item?._id && (
                    <IconButton onClick={handleDelete}>
                      <DeleteOutlineIcon sx={{ color: theme.palette.error.main }} />
                    </IconButton>
                  )}

                  <IconButton onClick={() => setMode('edit')}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={onClose}>
                    <CloseIcon />
                  </IconButton>
                </>
              ) : (

                <>
                  <IconButton onClick={handleSave}>
                    <CheckIcon color="primary" />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      mode === 'add' ? onClose() : setMode('read')
                    }
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </Stack>
          </Box>
        </Box>

        {/* ---------------------- CONTENT ---------------------- */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {fields.map((field, idx) => (
            <React.Fragment key={field.field}>
              {renderField(field, localItem, handleChange, mode, theme)}

              {idx < fields.length - 1 && (
                <Divider sx={{ my: 2, opacity: 0.3 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}
