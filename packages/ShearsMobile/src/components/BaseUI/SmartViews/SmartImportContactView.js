import React, { useState, useContext } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert as RNAlert,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Chip,
  ProgressBar,
  Portal,
  Modal,
  DataTable,
  SegmentedButtons,
  List,
  Divider,
  IconButton,
} from "react-native-paper";
import { pick, types } from "@react-native-documents/picker";
import RNFS from "react-native-fs";
import Papa from "papaparse";
import { parseAndCreateContacts } from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../../context/AuthContext";

const FIELD_MAPPINGS = [
  { value: "firstName", label: "First Name", required: true },
  { value: "lastName", label: "Last Name", required: true },
  { value: "phone", label: "Phone", required: true },
  { value: "email", label: "Email", required: true },
  { value: "notes", label: "Notes", required: false },
  { value: "skip", label: "Skip this column", required: false },
];

export default function SmartImportContactView({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [mappingModalVisible, setMappingModalVisible] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);

  const { user, token } = useContext(AuthContext);

  const steps = ["Upload CSV", "Map Columns", "Review & Import"];

  /* ============================================================
     STEP 1: Handle File Upload
  ============================================================ */
  const handleFileUpload = async () => {
    try {
      const files = await pick({
        type: [types.csv, types.plainText],
        allowMultiSelection: false,
      });

      if (files.length === 0) {
        // No file selected (possibly canceled)
        return;
      }

      const file = files[0];
      const fileContent = await RNFS.readFile(file.uri, "utf8");

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            RNAlert.alert(
              "Parse Error",
              `CSV parsing error: ${results.errors[0].message}`
            );
            return;
          }

          if (results.data.length === 0) {
            setError("CSV file is empty");
            RNAlert.alert("Empty File", "CSV file is empty");
            return;
          }

          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);

          // Auto-detect common column mappings
          const autoMappings = autoDetectMappings(results.meta.fields);
          setColumnMappings(autoMappings);

          setActiveStep(1);
          setError(null);
        },
        error: (error) => {
          setError(`Failed to read CSV: ${error.message}`);
          RNAlert.alert("Error", `Failed to read CSV: ${error.message}`);
        },
      });
    } catch (err) {
      if (err?.code === 'OPERATION_CANCELED' || err?.message?.includes('canceled')) {
        // User canceled the picker
        return;
      }
      setError(`Failed to pick file: ${err.message}`);
      RNAlert.alert("Error", `Failed to pick file: ${err.message}`);
    }
  };

  /* ============================================================
     Auto-detect common column names
  ============================================================ */
  const autoDetectMappings = (headers) => {
    const mappings = {};
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    headers.forEach((header, index) => {
      const lower = lowerHeaders[index];

      // First Name
      if (
        lower.includes("first") &&
        (lower.includes("name") || lower === "first" || lower === "firstname")
      ) {
        mappings[header] = "firstName";
      }
      // Last Name
      else if (
        lower.includes("last") &&
        (lower.includes("name") || lower === "last" || lower === "lastname")
      ) {
        mappings[header] = "lastName";
      }
      // Customer Name (for splitting)
      else if (
        (lower.includes("customer") || lower.includes("client")) &&
        lower.includes("name")
      ) {
        mappings[header] = "fullName";
      }
      // Phone
      else if (
        lower.includes("phone") ||
        lower.includes("mobile") ||
        lower.includes("cell")
      ) {
        mappings[header] = "phone";
      }
      // Email
      else if (lower.includes("email") || lower.includes("e-mail")) {
        mappings[header] = "email";
      }
      // Notes
      else if (lower.includes("note") || lower.includes("comment")) {
        mappings[header] = "notes";
      }
      // Default to skip
      else {
        mappings[header] = "skip";
      }
    });

    return mappings;
  };

  /* ============================================================
     STEP 2: Update column mapping
  ============================================================ */
  const handleMappingChange = (header, value) => {
    setColumnMappings((prev) => ({
      ...prev,
      [header]: value,
    }));
    setMappingModalVisible(false);
  };

  /* ============================================================
     Validate mappings before proceeding
  ============================================================ */
  const validateMappings = () => {
    const requiredFields = ["firstName", "lastName", "phone"];
    const mappedFields = Object.values(columnMappings);

    const missingFields = requiredFields.filter(
      (field) =>
        !mappedFields.includes(field) && !mappedFields.includes("fullName")
    );

    if (missingFields.length > 0) {
      const errorMsg = `Please map required fields: ${missingFields.join(", ")}`;
      setError(errorMsg);
      RNAlert.alert("Missing Required Fields", errorMsg);
      return false;
    }

    setError(null);
    return true;
  };

  /* ============================================================
     STEP 3: Import contacts
  ============================================================ */
  const handleImport = async () => {
    if (!validateMappings()) return;

    setImporting(true);
    setError(null);

    try {
      const results = await parseAndCreateContacts(
        csvData,
        columnMappings,
        token,
        user.userId,
        user.subscriberId
      );

      setImportResults(results);
      setActiveStep(3);
    } catch (err) {
      const errorMsg = err.message || "Import failed";
      setError(errorMsg);
      RNAlert.alert("Import Failed", errorMsg);
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
  };

  /* ============================================================
     Get preview of first 5 rows
  ============================================================ */
  const getPreviewData = () => {
    if (!csvData) return [];
    return csvData.slice(0, 5);
  };

  /* ============================================================
     Get field label from mapping value
  ============================================================ */
  const getFieldLabel = (value) => {
    if (value === "fullName") return "Full Name (will be split)";
    const field = FIELD_MAPPINGS.find((f) => f.value === value);
    return field ? field.label : value;
  };

  /* ============================================================
     Render Steps
  ============================================================ */
  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.uploadIconContainer}>
        <IconButton
          icon="cloud-upload"
          size={80}
          iconColor="#2196F3"
          style={styles.uploadIcon}
        />
      </View>

      <Text variant="headlineMedium" style={styles.centerText}>
        Upload Contact CSV
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.centerText, styles.secondaryText]}
      >
        Select a CSV file containing your contact information
      </Text>

      <Button
        mode="contained"
        icon="file-upload"
        onPress={handleFileUpload}
        style={styles.uploadButton}
      >
        Choose File
      </Button>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            CSV Format Requirements:
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            • Must include columns for First Name, Last Name, and Phone
            {"\n"}• If using "Customer Name", it will be automatically split
            {"\n"}• Phone and Email columns should contain valid contact
            information
            {"\n"}• Optional: Notes column for additional information
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  const renderMappingStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="titleLarge" style={styles.stepTitle}>
        Map CSV Columns to Contact Fields
      </Text>
      <Text variant="bodyMedium" style={styles.stepSubtitle}>
        Review the auto-detected mappings and adjust as needed. Required fields
        are marked with *.
      </Text>

      <ScrollView style={styles.mappingScrollView}>
        <Card style={styles.mappingCard}>
          {csvHeaders.map((header, index) => (
            <View key={header}>
              <List.Item
                title={header}
                description={csvData[0]?.[header] || "-"}
                right={() => (
                  <View style={styles.mappingRight}>
                    <Chip
                      mode="outlined"
                      onPress={() => {
                        setSelectedHeader(header);
                        setMappingModalVisible(true);
                      }}
                      style={styles.mappingChip}
                    >
                      {getFieldLabel(columnMappings[header] || "skip")}
                    </Chip>
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      onPress={() => {
                        setSelectedHeader(header);
                        setMappingModalVisible(true);
                      }}
                    />
                  </View>
                )}
                style={styles.mappingItem}
              />
              {index < csvHeaders.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setActiveStep(0)}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            if (validateMappings()) {
              setActiveStep(2);
            }
          }}
        >
          Next: Review
        </Button>
      </View>

      {/* Mapping Selection Modal */}
      <Portal>
        <Modal
          visible={mappingModalVisible}
          onDismiss={() => setMappingModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Map "{selectedHeader}"
          </Text>
          <ScrollView>
            <List.Item
              title="Full Name (will be split)"
              left={() => <List.Icon icon="account" />}
              onPress={() => handleMappingChange(selectedHeader, "fullName")}
              style={
                columnMappings[selectedHeader] === "fullName" &&
                styles.selectedMapping
              }
            />
            {FIELD_MAPPINGS.map((field) => (
              <List.Item
                key={field.value}
                title={`${field.label}${field.required ? " *" : ""}`}
                left={() => (
                  <List.Icon
                    icon={
                      field.value === "firstName" || field.value === "lastName"
                        ? "account"
                        : field.value === "phone"
                        ? "phone"
                        : field.value === "email"
                        ? "email"
                        : field.value === "notes"
                        ? "note"
                        : "cancel"
                    }
                  />
                )}
                onPress={() => handleMappingChange(selectedHeader, field.value)}
                style={
                  columnMappings[selectedHeader] === field.value &&
                  styles.selectedMapping
                }
              />
            ))}
          </ScrollView>
          <Button
            mode="outlined"
            onPress={() => setMappingModalVisible(false)}
            style={styles.modalCloseButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="titleLarge" style={styles.stepTitle}>
        Preview & Import
      </Text>
      <Text variant="bodyMedium" style={styles.stepSubtitle}>
        Review the first 5 contacts before importing. Total contacts to import:{" "}
        <Text style={styles.bold}>{csvData.length}</Text>
      </Text>

      <ScrollView horizontal style={styles.previewScrollView}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.tableCell}>First Name</DataTable.Title>
            <DataTable.Title style={styles.tableCell}>Last Name</DataTable.Title>
            <DataTable.Title style={styles.tableCell}>Phone</DataTable.Title>
            <DataTable.Title style={styles.tableCell}>Email</DataTable.Title>
          </DataTable.Header>

          {getPreviewData().map((row, idx) => {
            // Get mapped values
            const getFieldValue = (fieldName) => {
              const header = Object.keys(columnMappings).find(
                (h) => columnMappings[h] === fieldName
              );
              return row[header] || "";
            };

            const fullNameHeader = Object.keys(columnMappings).find(
              (h) => columnMappings[h] === "fullName"
            );
            const fullName = fullNameHeader ? row[fullNameHeader] : "";
            const [autoFirstName, autoLastName] = fullName
              ? fullName.split(" ")
              : ["", ""];

            const firstName = getFieldValue("firstName") || autoFirstName;
            const lastName = getFieldValue("lastName") || autoLastName;

            return (
              <DataTable.Row key={idx}>
                <DataTable.Cell style={styles.tableCell}>{firstName}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>{lastName}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>
                  {getFieldValue("phone")}
                </DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>
                  {getFieldValue("email")}
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      </ScrollView>

      {importing && (
        <View style={styles.progressContainer}>
          <ProgressBar indeterminate color="#2196F3" />
          <Text variant="bodyMedium" style={styles.progressText}>
            Importing contacts...
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={() => setActiveStep(1)}
          disabled={importing}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleImport}
          disabled={importing}
          loading={importing}
        >
          {importing ? "Importing..." : `Import ${csvData.length} Contacts`}
        </Button>
      </View>
    </View>
  );

  const renderResultsStep = () => {
    if (!importResults) return null;

    const { successful, failed, total } = importResults;

    return (
      <ScrollView style={styles.resultsScrollView}>
        <View style={styles.resultsContainer}>
          {failed.length === 0 ? (
            <IconButton
              icon="check-circle"
              size={80}
              iconColor="#4CAF50"
              style={styles.resultIcon}
            />
          ) : (
            <IconButton
              icon="alert-circle"
              size={80}
              iconColor="#FF9800"
              style={styles.resultIcon}
            />
          )}

          <Text variant="headlineMedium" style={styles.resultTitle}>
            Import Complete
          </Text>

          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <Text variant="displaySmall" style={styles.statNumber}>
                  {total}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="displaySmall"
                  style={[styles.statNumber, styles.successColor]}
                >
                  {successful.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Success
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="displaySmall"
                  style={[styles.statNumber, styles.errorColor]}
                >
                  {failed.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Failed
                </Text>
              </Card.Content>
            </Card>
          </View>

          {failed.length > 0 && (
            <Card style={styles.failedCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.failedTitle}>
                  Failed Imports:
                </Text>
                <ScrollView style={styles.failedScrollView}>
                  {failed.map((item, idx) => (
                    <Text key={idx} variant="bodySmall" style={styles.failedItem}>
                      • {item.name}: {item.error}
                    </Text>
                  ))}
                </ScrollView>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="contained"
            onPress={() => {
              onComplete?.();
              // Reset state
              setActiveStep(0);
              setCsvData(null);
              setCsvHeaders([]);
              setColumnMappings({});
              setImportResults(null);
            }}
            style={styles.doneButton}
          >
            Done
          </Button>
        </View>
      </ScrollView>
    );
  };

  /* ============================================================
     Progress Stepper
  ============================================================ */
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {steps.map((label, index) => (
        <View key={label} style={styles.stepperStep}>
          <View
            style={[
              styles.stepperCircle,
              index <= activeStep && styles.stepperCircleActive,
            ]}
          >
            <Text
              variant="bodySmall"
              style={[
                styles.stepperNumber,
                index <= activeStep && styles.stepperNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={[
              styles.stepperLabel,
              index === activeStep && styles.stepperLabelActive,
            ]}
          >
            {label}
          </Text>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepperLine,
                index < activeStep && styles.stepperLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  /* ============================================================
     Main Render
  ============================================================ */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Import Contacts
        </Text>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <View style={styles.errorContent}>
              <IconButton icon="alert-circle" iconColor="#F44336" size={24} />
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setError(null)}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {activeStep < 3 && renderStepper()}

      <View style={styles.content}>
        {activeStep === 0 && renderUploadStep()}
        {activeStep === 1 && renderMappingStep()}
        {activeStep === 2 && renderReviewStep()}
        {activeStep === 3 && renderResultsStep()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "bold",
  },
  errorCard: {
    margin: 16,
    backgroundColor: "#ffebee",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    color: "#c62828",
    marginLeft: 8,
  },
  stepperContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepperStep: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stepperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepperCircleActive: {
    backgroundColor: "#2196F3",
  },
  stepperNumber: {
    color: "#757575",
    fontWeight: "bold",
  },
  stepperNumberActive: {
    color: "#fff",
  },
  stepperLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  stepperLabelActive: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  stepperLine: {
    position: "absolute",
    top: 16,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#e0e0e0",
  },
  stepperLineActive: {
    backgroundColor: "#2196F3",
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  centerText: {
    textAlign: "center",
    marginBottom: 8,
  },
  secondaryText: {
    color: "#757575",
    marginBottom: 24,
  },
  uploadIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  uploadIcon: {
    margin: 0,
  },
  uploadButton: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#e3f2fd",
  },
  infoTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    color: "#424242",
    lineHeight: 20,
  },
  stepTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSubtitle: {
    color: "#757575",
    marginBottom: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  mappingScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  mappingCard: {
    backgroundColor: "#fff",
  },
  mappingItem: {
    paddingVertical: 8,
  },
  mappingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  mappingChip: {
    marginRight: -8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalTitle: {
    padding: 16,
    fontWeight: "bold",
  },
  selectedMapping: {
    backgroundColor: "#e3f2fd",
  },
  modalCloseButton: {
    margin: 16,
  },
  previewScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  tableCell: {
    minWidth: 120,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    textAlign: "center",
    marginTop: 8,
    color: "#757575",
  },
  resultsScrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: 16,
    alignItems: "center",
  },
  resultIcon: {
    margin: 0,
    marginBottom: 16,
  },
  resultTitle: {
    fontWeight: "bold",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    fontWeight: "bold",
    color: "#2196F3",
  },
  successColor: {
    color: "#4CAF50",
  },
  errorColor: {
    color: "#F44336",
  },
  statLabel: {
    color: "#757575",
    marginTop: 4,
  },
  failedCard: {
    width: "100%",
    marginBottom: 24,
    backgroundColor: "#fff3e0",
  },
  failedTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  failedScrollView: {
    maxHeight: 200,
  },
  failedItem: {
    marginBottom: 4,
    color: "#424242",
  },
  doneButton: {
    minWidth: 200,
  },
});