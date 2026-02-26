const Location = require('../models/Location');

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.isActive !== 'false';
    const filter = activeOnly ? { isActive: true } : {};
    const list = await Location.find(filter).sort({ areaName: 1, building: 1, floor: 1 });
    res.json(list);
  } catch (err) {
    console.error('locationController.list error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
