const express = require('express');
const router = express.Router();
const chiefController = require('../controllers/chiefController');
const auth = require('../middleware/auth');

router.get('/admin/analytics', auth('SUPER_ADMIN'), chiefController.getChiefAnalytics);
router.get('/my-analytics', auth(['SUPER_ADMIN', 'SUPERVISOR']), chiefController.getMyAnalytics);

router.get('/patients', auth(['SUPER_ADMIN', 'SUPERVISOR']), chiefController.getChiefPatients);
router.get('/patient-submissions', auth(['SUPER_ADMIN', 'SUPERVISOR']), chiefController.getChiefPatientSubmissions);
router.put('/submissions/:id/corrective-preventive', auth(['SUPER_ADMIN', 'SUPERVISOR']), chiefController.updateCorrectivePreventive);
router.get('/doctor-performance', auth(['SUPER_ADMIN', 'SUPERVISOR']), chiefController.getDoctorPerformance);

module.exports = router;
