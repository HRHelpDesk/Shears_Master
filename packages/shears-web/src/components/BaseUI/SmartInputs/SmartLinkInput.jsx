// src/components/SmartInputs/LinkInput.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function SmartLinkInput({
  label,
  value,
  onChangeValue,
  onChangeText,
  placeholder,
  mode = 'edit',
  error,
  helperText,
}) {
  const theme = useTheme();
  const [focusedField, setFocusedField] = useState(null);

  const emit = (newVal) => {
    onChangeValue?.(newVal);
    onChangeText?.(newVal);
  };

  const title = value?.title || '';
  const url   = value?.url   || '';

  const handleTitleChange = (e) => emit({ title: e.target.value, url });
  const handleUrlChange   = (e) => emit({ title, url: e.target.value });

  const titleError = typeof error === 'object' ? error?.title : null;
  const urlError   = typeof error === 'object' ? error?.url : (typeof error === 'string' ? error : null);

  const normalizeUrl = (rawUrl) => {
    if (!rawUrl) return rawUrl;
    const trimmed = rawUrl.trim();
    return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  };

  const handleUrlBlur = () => {
    setFocusedField(null);
    if (url) emit({ title, url: normalizeUrl(url) });
  };

  const normalizedUrl = normalizeUrl(url);

  /* ── READ MODE ── */
  if (mode === 'read') {
    const hasValue = url.trim() !== '';

    return (
      <Box sx={{ mb: 0.5 }}>
        {/* {label && (
          <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
            {label}
          </Typography>
        )} */}
        {hasValue ? (
          <Link
            href={normalizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.primary.main }}
          >
            {title.trim() !== '' ? title : url}
          </Link>
        ) : (
          <Typography variant="body1" sx={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>
            Not set
          </Typography>
        )}
      </Box>
    );
  }

  /* ── EDIT MODE ── */
  return (
    <Box sx={{ mb: 0.5 }}>
      {/* {label && (
        <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500, mb: 1 }}>
          {label}
        </Typography>
      )} */}

      {/* Title field */}
      <Typography variant="caption" sx={{ color: titleError ? theme.palette.error.main : theme.palette.text.secondary, mb: 0.5, display: 'block' }}>
        Title
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        value={title}
        onChange={handleTitleChange}
        placeholder="Link title"
        error={!!titleError}
        helperText={titleError}
        onFocus={() => setFocusedField('title')}
        onBlur={() => setFocusedField(null)}
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            minHeight: '48px',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiOutlinedInput-input': {
            padding: '13px',
            fontSize: '16px',
          },
        }}
      />

      {/* URL field */}
      <Typography variant="caption" sx={{ color: urlError ? theme.palette.error.main : theme.palette.text.secondary, mb: 0.5, display: 'block' }}>
        Link URL
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        value={url}
        onChange={handleUrlChange}
        placeholder="https://..."
        type="url"
        error={!!urlError}
        helperText={urlError}
        onFocus={() => setFocusedField('url')}
        onBlur={handleUrlBlur}
        inputProps={{ autoCapitalize: 'none', spellCheck: false }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            minHeight: '48px',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiOutlinedInput-input': {
            padding: '13px',
            fontSize: '16px',
          },
        }}
      />

      {/* General helper text */}
      {(helperText || (error && typeof error === 'string')) && (
        <Typography
          variant="caption"
          sx={{
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            mt: 0.5,
            ml: 0.25,
            display: 'block',
          }}
        >
          {helperText || error}
        </Typography>
      )}
    </Box>
  );
}