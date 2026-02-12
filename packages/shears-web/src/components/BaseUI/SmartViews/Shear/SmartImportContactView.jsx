import React, { useState, useRef, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import Papa from "papaparse";
import { parseAndCreateContacts } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from "../../../../context/AuthContext";

const FIELD_MAPPINGS = [
  { value: "firstName", label: "First Name", required: true },
  { value: "lastName", label: "Last Name", required: true },
  { value: "phone", label: "Phone", required: true },
  { value: "email", label: "Email", required: true },
  { value: "notes", label: "Notes", required: false },
  { value: "skip", label: "Skip this column", required: false },
];

export default function SmartImportContactView({
  onComplete,

}) {
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const {user, token} = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const steps = ["Upload CSV", "Map Columns", "Review & Import"];

  /* ============================================================
     STEP 1: Handle File Upload
  ============================================================ */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`);
          return;
        }

        if (results.data.length === 0) {
          setError("CSV file is empty");
          return;
        }

        setCsvHeaders(results.meta.fields);
        setCsvData(results.data);
        
        // Auto-detect common column mappings
        const autoMappings = autoDetectMappings(results.meta.fields);
        setColumnMappings(autoMappings);
        
        setActiveStep(1);
      },
      error: (error) => {
        setError(`Failed to read CSV: ${error.message}`);
      },
    });
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
      else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("cell")) {
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
  };

  /* ============================================================
     Validate mappings before proceeding
  ============================================================ */
  const validateMappings = () => {
    const requiredFields = ["firstName", "lastName", "phone"];
    const mappedFields = Object.values(columnMappings);

    const missingFields = requiredFields.filter(
      (field) => !mappedFields.includes(field) && !mappedFields.includes("fullName")
    );

    if (missingFields.length > 0) {
      setError(`Please map required fields: ${missingFields.join(", ")}`);
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
      setError(err.message || "Import failed");
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
     Render Steps
  ============================================================ */
  const renderUploadStep = () => (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
      
      <UploadIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        Upload Contact CSV
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select a CSV file containing your contact information
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()}
      >
        Choose File
      </Button>

      <Box sx={{ mt: 4, textAlign: "left", maxWidth: 600, mx: "auto" }}>
        <Typography variant="subtitle2" gutterBottom>
          CSV Format Requirements:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Must include columns for First Name, Last Name, and Phone
          <br />
          • If using "Customer Name", it will be automatically split
          <br />
          • Phone and Email columns should contain valid contact information
          <br />
          • Optional: Notes column for additional information
        </Typography>
      </Box>
    </Box>
  );

  const renderMappingStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Map CSV Columns to Contact Fields
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the auto-detected mappings and adjust as needed. Required fields
        are marked with *.
      </Typography>

      <Box sx={{ flex: 1, overflow: 'auto', mb: 3 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>CSV Column</strong>
                </TableCell>
                <TableCell>
                  <strong>Sample Data</strong>
                </TableCell>
                <TableCell>
                  <strong>Maps To</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {csvHeaders.map((header) => (
                <TableRow key={header}>
                  <TableCell>{header}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      {csvData[0]?.[header] || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={columnMappings[header] || "skip"}
                        onChange={(e) =>
                          handleMappingChange(header, e.target.value)
                        }
                      >
                        <MenuItem value="fullName">
                          Full Name (will be split)
                        </MenuItem>
                        {FIELD_MAPPINGS.map((field) => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                            {field.required && " *"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => setActiveStep(0)}>Back</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (validateMappings()) {
              setActiveStep(2);
            }
          }}
        >
          Next: Review
        </Button>
      </Box>
    </Box>
  );

  const renderReviewStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Preview & Import
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the first 5 contacts before importing. Total contacts to import:{" "}
        <strong>{csvData.length}</strong>
      </Typography>

      <Box sx={{ flex: 1, overflow: 'auto', mb: 3 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>First Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Last Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Phone</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
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
                  <TableRow key={idx}>
                    <TableCell>{firstName}</TableCell>
                    <TableCell>{lastName}</TableCell>
                    <TableCell>{getFieldValue("phone")}</TableCell>
                    <TableCell>{getFieldValue("email")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {importing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Importing contacts...
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => setActiveStep(1)} disabled={importing}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={importing}
          size="large"
        >
          {importing ? "Importing..." : `Import ${csvData.length} Contacts`}
        </Button>
      </Box>
    </Box>
  );

  const renderResultsStep = () => {
    if (!importResults) return null;

    const { successful, failed, total } = importResults;

    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'auto',
      }}>
        <Box sx={{ textAlign: "center", py: 4 }}>
          {failed.length === 0 ? (
            <SuccessIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 80, color: "warning.main", mb: 2 }} />
          )}

          <Typography variant="h5" gutterBottom>
            Import Complete
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2, maxWidth: 600, mx: "auto" }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {successful.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="error.main">
                    {failed.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {failed.length > 0 && (
            <Box sx={{ mt: 3, textAlign: "left", maxWidth: 600, mx: "auto" }}>
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Failed Imports:
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {failed.map((item, idx) => (
                    <Typography key={idx} variant="body2">
                      • {item.name}: {item.error}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => {
                onComplete?.();
                // Reset state
                setActiveStep(0);
                setCsvData(null);
                setCsvHeaders([]);
                setColumnMappings({});
                setImportResults(null);
              }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  /* ============================================================
     Main Render
  ============================================================ */
  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Paper 
            sx={{ 
              p: 3,
              minHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Import Contacts
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {activeStep < 3 && (
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <Box sx={{ flex: 1 }}>
              {activeStep === 0 && renderUploadStep()}
              {activeStep === 1 && renderMappingStep()}
              {activeStep === 2 && renderReviewStep()}
              {activeStep === 3 && renderResultsStep()}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}