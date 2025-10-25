const mongoose = require('mongoose');
const { Schema } = mongoose;

const dataRecordSchema = new Schema(
  {
    subscriberId: {
      type: String,
      required: true,
      index: true,
    },
    createdById: {
      type: String,
      required: true,
    },
    recordType: {
      type: String,
      required: true,
      index: true,
    },
    fieldsData: {
      },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

dataRecordSchema.index({ subscriberId: 1, recordType: 1 });
dataRecordSchema.index({ subscriberId: 1, createdById: 1 });
dataRecordSchema.index({ subscriberId: 1, status: 1 });


const getDataRecordModel = (db) => {
  return db.model('DataRecord', dataRecordSchema);
};

module.exports = getDataRecordModel;