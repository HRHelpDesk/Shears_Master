import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Button,
  Text,
  useTheme,
  Icon,
  IconButton,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DateRangePickerInput({
  label = 'Date Range',
  value,
  onChangeText,
  mode = 'edit',
  error,
  helperText,
  allowSingleDay = true,
  allowMultiDay = true,
}) {
  const theme = useTheme();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['75%'], []);
const insets = useSafeAreaInsets();

  const [rangeMode, setRangeMode] = useState('single');
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  /* -------------------------------------------------------------------------- */
  /*                                UTILITIES                                   */
  /* -------------------------------------------------------------------------- */

  function parseDate(dateStr) {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      const temp = new Date(start);
      start.setTime(end.getTime());
      end.setTime(temp.getTime());
    }

    while (start <= end) {
      dates.push(formatDate(new Date(start)));
      start.setDate(start.getDate() + 1);
    }

    return dates;
  }

  const displayValue = (() => {
    if (!value || value.length === 0) return 'Not set';

    if (value.length === 1) {
      const d = parseDate(value[0]);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const start = parseDate(value[0]);
    const end = parseDate(value[value.length - 1]);

    const startStr = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    const endStr = end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr} (${value.length} days)`;
  })();

  /* -------------------------------------------------------------------------- */
  /*                            SYNC FROM PROP                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (value && value.length > 0) {
      setTempStartDate(parseDate(value[0]));
      setTempEndDate(parseDate(value[value.length - 1]));
      setRangeMode(value.length === 1 ? 'single' : 'range');
    }
  }, [value]);

  /* -------------------------------------------------------------------------- */
  /*                              ACTIONS                                       */
  /* -------------------------------------------------------------------------- */

  const handleConfirm = () => {
    if (rangeMode === 'single') {
      onChangeText([formatDate(tempStartDate)]);
    } else {
      onChangeText(getDateRange(tempStartDate, tempEndDate));
    }
  };

  const handleRangeModeChange = (newMode) => {
    setRangeMode(newMode);
    if (newMode === 'single') {
      setTempEndDate(tempStartDate);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 READ MODE                                  */
  /* -------------------------------------------------------------------------- */

  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        <View style={styles.inlineRead}>
          <Icon
            source={value && value.length > 1 ? 'calendar-range' : 'calendar'}
            size={26}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={[
              styles.readValue,
              {
                color:
                  value && value.length > 0
                    ? theme.colors.onSurface
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {displayValue}
          </Text>
        </View>
      </View>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 EDIT MODE                                  */
  /* -------------------------------------------------------------------------- */

  const borderColor = error
    ? theme.colors.error
    : theme.colors.outlineVariant || theme.colors.outline;

  return (
    <View style={styles.editContainer}>
      <Text
        variant="titleMedium"
        style={[styles.label, { color: theme.colors.primary }]}
      >
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => bottomSheetRef.current?.present()}
        style={[
          styles.selectorContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
          },
        ]}
      >
        <View style={styles.inlineContent}>
          <Icon
            source={value && value.length > 1 ? 'calendar-range' : 'calendar'}
            size={20}
            color={
              value && value.length > 0
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant
            }
          />

          <Text
            style={[
              styles.selectorText,
              {
                color:
                  value && value.length > 0
                    ? theme.colors.onSurface
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {value && value.length > 0
              ? displayValue
              : 'Select date range'}
          </Text>
        </View>

        <IconButton
          icon="chevron-down"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {(helperText || error) && (
        <Text
          variant="bodySmall"
          style={{
            marginTop: 4,
            color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
          }}
        >
          {error || helperText}
        </Text>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/*                             BOTTOM SHEET                               */}
      {/* ---------------------------------------------------------------------- */}

      <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            index={0}
            enablePanDownToClose
            stackBehavior="push"
            topInset={insets.top}
            modalProps={{ presentationStyle: 'overFullScreen' }}
            backgroundStyle={{
                backgroundColor: theme.colors.surface,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.outline,
            }}
            >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Select {label}</Text>

          <Divider style={{ marginVertical: 16 }} />

        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            {allowSingleDay && allowMultiDay && (
              <SegmentedButtons
                value={rangeMode}
                onValueChange={handleRangeModeChange}
                buttons={[
                  { value: 'single', label: 'Single-Day' },
                  { value: 'range', label: 'Multi-Day' },
                ]}
                style={{ marginBottom: 20 }}
              />
            )}

            {/* START DATE */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>
                {rangeMode === 'single' ? 'Date' : 'Start Date'}
              </Text>

              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempStartDate(selectedDate);
                    if (
                      rangeMode === 'range' &&
                      selectedDate > tempEndDate
                    ) {
                      setTempEndDate(selectedDate);
                    }
                  }
                }}
              />
            </View>

            {rangeMode === 'range' && (
              <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>End Date</Text>

                <DateTimePicker
                  value={tempEndDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempEndDate(selectedDate);
                      if (selectedDate < tempStartDate) {
                        setTempStartDate(selectedDate);
                      }
                    }
                  }}
                />

                <View style={styles.summaryContainer}>
                  <Text variant="bodySmall">
                    {getDateRange(tempStartDate, tempEndDate).length} day(s)
                  </Text>
                </View>
              </View>
            )}
          </BottomSheetScrollView>

          {/* Sticky Actions */}
          <View
            style={[
                styles.sheetActions,
                { paddingBottom: insets.bottom + 20 },
            ]}
            >
            <Button
                mode="outlined"
                style={styles.actionButton}
                contentStyle={styles.actionContent}
                onPress={() => bottomSheetRef.current?.dismiss()}
            >
                Cancel
            </Button>

            <Button
                mode="contained"
                style={styles.actionButton}
                contentStyle={styles.actionContent}
                onPress={() => {
                handleConfirm();
                bottomSheetRef.current?.dismiss();
                }}
            >
                Confirm
            </Button>
            </View>

        </View>
      </BottomSheetModal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  readContainer: { marginBottom: 12 },
  inlineRead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readValue: { fontSize: 16 },
  label: { marginBottom: 8, fontWeight: '600' },

  editContainer: { marginBottom: 12 },

  selectorContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  selectorText: {
    fontSize: 16,
  },

  sheetContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  dateSection: {
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },

  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },

  summaryContainer: {
    marginTop: 12,
    alignItems: 'center',
  },

  sheetActions: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  paddingHorizontal: 20,
  paddingTop: 12,
  backgroundColor: 'white',
  borderTopWidth: 1,
  borderColor: 'rgba(0,0,0,0.08)',
  gap: 12,
},

actionButton: {
  flex: 1,
  borderRadius: 5,
},

actionContent: {
  height: 50,
},

});
