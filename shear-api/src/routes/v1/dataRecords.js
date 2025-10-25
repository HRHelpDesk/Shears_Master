const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const getDataRecordModel = require('../../models/DataRecord');
const getUserModel = require('../../models/User');

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Store user ID from JWT
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- CREATE a new record
router.post('/', authenticate, async (req, res) => {
  try {
    const { recordType, fieldsData, tags, status } = req.body;
    const DataRecord = getDataRecordModel(req.db);
    const User = getUserModel(req.db);
console.log(recordType)
    // Use authenticated user ID for subscriberId and createdById
    const subscriberId = req.body.subscriberId;
    const createdById = req.body.userId;

    // Verify user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(400).json({ error: 'Invalid subscriberId' });
    }

    const newRecord = new DataRecord({
      subscriberId,
      createdById,
      recordType: recordType || 'customer',
      fieldsData,
      tags: tags || [],
      status: status || 'active',
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (err) {
    console.error('Error creating record:', err);
    res.status(400).json({ error: 'Failed to create record' });
  }
});

// --- GET all records for a subscriber (with optional filters)
router.get('/', authenticate, async (req, res) => {
   console.log('>>> GET /records headers:', req.headers);
  console.log('>>> x-app-name:', req.headers['x-app-name']);
  try {
    const { recordType, searchField, searchValue, status, subscriberId, userId } = req.query;
    console.log('Filters:', { recordType, searchField, searchValue, status,  subscriberId, userId});
    console.log('recordType', recordType);
    const DataRecord = getDataRecordModel(req.db);
console.log(recordType)
    const filter = { subscriberId: userId };
console.log('Filter after subscriberId:', filter);
    if (recordType) filter.recordType = recordType;
    if (status) filter.status = status;
    if (searchField && searchValue) {
      filter[`fieldsData.${searchField}`] = searchValue;
    }
console.log('Final Mongo filter:', JSON.stringify(filter, null, 2));

    const records = await DataRecord.find(filter).sort({ createdAt: -1 });
    console.log(`Fetched ${records.length} records`);
    res.json(records);
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// --- GET a single record by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const DataRecord = getDataRecordModel(req.db);
    const record = await DataRecord.findOne({
      _id: req.params.id,
      subscriberId: userId,
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching record:', err);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// --- UPDATE a record by ID
router.put('/:id', authenticate, async (req, res) => {
  console.log('updates', req.body);
  try {
    const DataRecord = getDataRecordModel(req.db);
    const updates = req.body;

    const updatedRecord = await DataRecord.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { fieldsData: updates } }, // <-- replace fieldsData
      { new: true, runValidators: true }
    );

    if (!updatedRecord) return res.status(404).json({ error: 'Record not found' });
    console.log('Updated Record:', updatedRecord);
    res.json(updatedRecord);
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(400).json({ error: 'Failed to update record' });
  }
});



// --- DELETE a record by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const DataRecord = getDataRecordModel(req.db);
    const deletedRecord = await DataRecord.findOneAndDelete({
      _id: req.params.id,
      
    });
    if (!deletedRecord) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;