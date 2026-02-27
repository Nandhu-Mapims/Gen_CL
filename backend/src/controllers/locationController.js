const Location = require('../models/Location');

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.isActive !== 'false';
    const filter = activeOnly ? { isActive: true } : {};
    if (req.query.locationType) filter.locationType = req.query.locationType;
    const list = await Location.find(filter).sort({ order: 1, areaName: 1 });
    res.json(list);
  } catch (err) {
    console.error('locationController.list error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { areaName, code, locationType, zone, floor, building, description, isActive, order } = req.body;
    if (!areaName || !areaName.trim()) {
      return res.status(400).json({ message: 'Area name is required' });
    }
    const data = {
      areaName: areaName.trim(),
      locationType: locationType || 'OTHER',
      isActive: isActive !== undefined ? isActive : true,
      order: order !== undefined ? parseInt(order) : 0,
    };
    if (code) data.code = code.trim().toUpperCase();
    if (zone) data.zone = zone.trim();
    if (floor) data.floor = floor.trim();
    if (building) data.building = building.trim();
    if (description) data.description = description.trim();

    const location = await Location.create(data);
    res.status(201).json(location);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A location with this code already exists' });
    }
    console.error('locationController.create error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { areaName, code, locationType, zone, floor, building, description, isActive, order } = req.body;
    const update = {};
    if (areaName !== undefined) update.areaName = areaName.trim();
    if (code !== undefined) update.code = code ? code.trim().toUpperCase() : null;
    if (locationType !== undefined) update.locationType = locationType;
    if (zone !== undefined) update.zone = zone ? zone.trim() : '';
    if (floor !== undefined) update.floor = floor ? floor.trim() : '';
    if (building !== undefined) update.building = building ? building.trim() : '';
    if (description !== undefined) update.description = description ? description.trim() : '';
    if (isActive !== undefined) update.isActive = isActive;
    if (order !== undefined) update.order = parseInt(order);

    const location = await Location.findByIdAndUpdate(id, update, { new: true });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A location with this code already exists' });
    }
    console.error('locationController.update error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdAndDelete(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.status(204).send();
  } catch (err) {
    console.error('locationController.remove error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
