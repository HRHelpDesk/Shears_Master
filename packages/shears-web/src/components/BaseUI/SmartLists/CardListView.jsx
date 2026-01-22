// CardListViewReadOnly.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  Chip,
  IconButton,
  Badge,
} from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import { mapFields } from "shears-shared/src/config/fieldMapper";
import ListItemDetail from "../ListItemDetail";

/* ============================================================
   Helpers (unchanged)
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
  recordType,
  modes = ["read"],
  actionsMenu = [],
  appConfig,
  onRefresh,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("read");
  const [selectedItem, setSelectedItem] = useState(null);

  const mappedFields = useMemo(() => mapFields(fields || []), [fields]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setDrawerMode("read");
    setDrawerOpen(true);
  };

  const handleClose = (result) => {
    setDrawerOpen(false);
    if (result?.shouldRefresh || onRefresh) {
      onRefresh?.();
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "block",
            height: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              maxWidth: 1400,
              px: 2,
              py: 2,
              mx: "auto",
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

              // Safely get comment count
              const commentCount = Array.isArray(item?.comments)
                ? item.comments.length
                : Array.isArray(item?.fieldsData?.comments)
                  ? item.fieldsData.comments.length
                  : 0;

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
                    onClick={() => handleCardClick(item)}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                    }}
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

                    <CardContent
                      sx={{
                        flexGrow: 1,
                        pb: 6,          // Extra bottom padding to clear space below text
                        pt: 2,
                        px: 3,
                        position: "relative",
                      }}
                    >
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
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
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

                      {/* Comment icon + count badge – bottom RIGHT, side by side */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 16,
                          right: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <IconButton
                          size="small"
                          color={commentCount > 0 ? "primary" : "action"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(item);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': {
                              bgcolor: "action.hover",
                              color: "primary.main",
                            },
                          }}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>

                        <Badge
                          badgeContent={commentCount}
                          color="primary"
                          showZero={false}           // hide when 0
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: 11,
                              minWidth: 18,
                              height: 18,
                              borderRadius: "50%",
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}

            {data.length === 0 && (
              <Box
                sx={{
                  width: "100%",
                  py: 8,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body1">
                  No {name.toLowerCase()} available
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Drawer */}
      {drawerOpen && (
        <ListItemDetail
          open={drawerOpen}
          recordType={recordType || name.toLowerCase()}
          onClose={(result) => {
            setDrawerOpen(false);
            if (result?.shouldRefresh || onRefresh) {
              onRefresh?.();
            }
          }}
          item={selectedItem}
          appConfig={appConfig}
          fields={fields}
          mode={drawerMode}
          name={name}
          modes={modes}
          actionsMenu={actionsMenu}
        />
      )}
    </>
  );
}