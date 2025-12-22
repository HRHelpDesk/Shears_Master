// CardListViewReadOnly.jsx
import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  Box,
  Chip,
} from "@mui/material";

import { mapFields } from "shears-shared/src/config/fieldMapper";
import ReadOnlyDetail from "../ReadOnly/ReadOnlyDetail";

/* ============================================================
   Helpers
============================================================ */

function getImage(item) {
  return item?.fieldsData?.announcementImage?.[0]?.url || null;
}

function getVideoUrl(item) {
  return item?.fieldsData?.videoUrl || null;
}

function getTitle(item) {
  return (
    item?.fieldsData?.announcementName ||
    item?.fieldsData?.annnouncementName ||
    "Announcement"
  );
}

function getDescription(item) {
  return item?.fieldsData?.message || "";
}

function getDate(item) {
  const raw =
    item?.fieldsData?.date ||
    item?.fieldsData?.createdAt ||
    item?.createdAt;

  if (!raw) return null;

  const date = new Date(raw);
  if (isNaN(date)) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function CardListViewReadOnly({
  data = [],
  fields = [],
  name = "Announcements",
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ Normalize schema fields so overrides + labels work
  const mappedFields = useMemo(() => {
    return mapFields(fields || []);
  }, [fields]);

  // ✅ IMPORTANT: pass the FULL record, not fieldsData
  const openDetail = (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: { xs: "block", md: "contents" },
            height: { xs: "calc(100vh - 120px)" },
            overflowY: { xs: "auto" },
          }}
        >
          <Box
            sx={{
              maxWidth: 1400,
              px: 2,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              alignContent: "flex-start",
              gap: 3,
            }}
          >
            {data.map((item) => {
              const imageUrl = getImage(item);
              const videoUrl = getVideoUrl(item);
              const title = getTitle(item);
              const description = getDescription(item);
              const dateLabel = getDate(item);

              return (
                <Card
                  key={item._id}
                  elevation={2}
                  sx={{
                    width: 360,
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                  }}
                >
                  <CardActionArea
                    onClick={() => openDetail(item)}
                    sx={{ height: "100%" }}
                  >
                    {(imageUrl || videoUrl) && (
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "4 / 3",
                          overflow: "hidden",
                        }}
                      >
                        {imageUrl && (
                          <CardMedia
                            component="img"
                            image={imageUrl}
                            alt={title}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}

                        {videoUrl && (
                          <Chip
                            label="Video"
                            size="small"
                            color="primary"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      {dateLabel && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          {dateLabel}
                        </Typography>
                      )}

                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: 600, lineHeight: 1.3 }}
                      >
                        {title}
                      </Typography>

                      {description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {description}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>

      {detailOpen && selectedItem && (
        <ReadOnlyDetail
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={selectedItem}
          fields={mappedFields}
          name={name}
        />
      )}
    </>
  );
}
