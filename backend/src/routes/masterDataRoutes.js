const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const auth = require('../middleware/auth');

// Admin: get full master data (designations, wards, units)
router.get('/', auth(['SUPER_ADMIN']), masterDataController.getMasterData);

// Admin: update master data
router.put('/', auth(['SUPER_ADMIN']), masterDataController.updateMasterData);

module.exports = router;
