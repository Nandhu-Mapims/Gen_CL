/**
 * Full Clean Seed
 * ──────────────────────────────────────────────────────
 *  Wipes everything and seeds:
 *   • 6 departments
 *   • 1 Super Admin, 1 QA, 3 Supervisors, 3 Staff
 *   • 10 Locations, 3 Shifts
 *   • 3 Form templates + checklist items (assigned to users)
 *   • 7 days of realistic audit submissions
 *   • Corrective/Preventive actions on some NO responses
 *   • Notifications
 *   • MasterData (designations)
 *
 * Run: cd backend && node src/seed/cleanSeed.js
 */

const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt    = require('bcrypt');
const mongoose  = require('mongoose');

const connectDB      = require('../config/db');
const Department     = require('../models/Department');
const User           = require('../models/User');
const ChiefDoctor    = require('../models/ChiefDoctor');
const FormTemplate   = require('../models/FormTemplate');
const ChecklistItem  = require('../models/ChecklistItem');
const AuditSubmission = require('../models/AuditSubmission');
const Location       = require('../models/Location');
const Shift          = require('../models/Shift');
const Patient        = require('../models/Patient');
const Admission      = require('../models/Admission');
const Notification   = require('../models/Notification');
const MasterData     = require('../models/MasterData');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash    = (pw) => bcrypt.hash(pw, 10);
const emailOf = (name) => name.toLowerCase().replace(/\s+/g, '.') + '@hospital.com';
const daysAgo = (n, h = 9, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
};
const dateStr  = (d) => d.toISOString().slice(0, 10);
const timeStr  = (d) => d.toTimeString().slice(0, 5);
const rand     = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pick     = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

// ─── Config ────────────────────────────────────────────────────────────────────

const PASSWORD = 'TataTiago@2026';

const DEPARTMENTS = [
  { name: 'General Medicine',   code: 'GM'      },
  { name: 'General Surgery',    code: 'GS'      },
  { name: 'Orthopedics',        code: 'ORTHO'   },
  { name: 'Pediatrics',         code: 'PED'     },
  { name: 'Nursing Services',   code: 'NUS'     },
  { name: 'Quality Department', code: 'QUALITY' },
];

const SUPERVISORS = [
  { name: 'Rajesh Kumar',  deptCode: 'GM',    designation: 'Unit Supervisor' },
  { name: 'Priya Sharma',  deptCode: 'GS',    designation: 'Unit Supervisor' },
  { name: 'Amit Patel',    deptCode: 'ORTHO', designation: 'Department Head' },
];

const STAFF = [
  { name: 'Meera Joseph', deptCode: 'GM',    designation: 'Staff Auditor' },
  { name: 'Suresh Kumar', deptCode: 'GS',    designation: 'Staff Auditor' },
  { name: 'Divya Menon',  deptCode: 'ORTHO', designation: 'Quality Auditor' },
];

// ─── Locations ─────────────────────────────────────────────────────────────────

const LOCATIONS = [
  { areaName: 'Zone A',   locationType: 'ZONE',  zone: 'A', order: 1 },
  { areaName: 'Zone B',   locationType: 'ZONE',  zone: 'B', order: 2 },
  { areaName: 'Zone C',   locationType: 'ZONE',  zone: 'C', order: 3 },
  { areaName: 'Floor 1',  locationType: 'FLOOR', floor: '1', order: 4 },
  { areaName: 'Floor 2',  locationType: 'FLOOR', floor: '2', order: 5 },
  { areaName: 'Floor 3',  locationType: 'FLOOR', floor: '3', order: 6 },
  { areaName: 'Ward A',   locationType: 'WARD',  order: 7 },
  { areaName: 'Ward B',   locationType: 'WARD',  order: 8 },
  { areaName: 'ICU',      locationType: 'UNIT',  order: 9 },
  { areaName: 'OT Block', locationType: 'UNIT',  order: 10 },
];

// ─── Shifts ─────────────────────────────────────────────────────────────────────

const SHIFTS = [
  { name: 'Morning',   startTime: '06:00', endTime: '14:00', hours: [7, 8, 9] },
  { name: 'Afternoon', startTime: '14:00', endTime: '22:00', hours: [14, 15, 16] },
  { name: 'Night',     startTime: '22:00', endTime: '06:00', hours: [22, 23, 0] },
];

// ─── Form definitions ──────────────────────────────────────────────────────────
// Each form is scoped to exactly ONE department.

const FORMS = [
  {
    key: 'DAILY',
    name: 'General Medicine Daily Checklist',
    description: 'Daily quality audit checklist for the General Medicine department.',
    deptCodes: ['GM'],
    isCommon: false,
    sections: [
      { name: 'Hand Hygiene & Infection Control', order: 1 },
      { name: 'Patient Safety & Documentation',  order: 2 },
      { name: 'Equipment & Environment',         order: 3 },
    ],
    items: [
      { label: 'Hand hygiene practiced before and after patient contact',          section: 'Hand Hygiene & Infection Control', order: 1, isMandatory: true  },
      { label: 'Alcohol-based hand rub available at point of care',                section: 'Hand Hygiene & Infection Control', order: 2, isMandatory: true  },
      { label: 'PPE worn appropriately during procedures',                         section: 'Hand Hygiene & Infection Control', order: 3                     },
      { label: 'Sharps disposed in puncture-proof containers',                     section: 'Hand Hygiene & Infection Control', order: 4, isMandatory: true  },
      { label: 'Bio-medical waste bins colour-coded and labelled correctly',       section: 'Hand Hygiene & Infection Control', order: 5                     },
      { label: 'Patient identification (wristband / ID card) in place',            section: 'Patient Safety & Documentation',  order: 1, isMandatory: true  },
      { label: 'Consent forms signed before procedures',                           section: 'Patient Safety & Documentation',  order: 2, isMandatory: true  },
      { label: 'Medication orders legibly written and signed',                     section: 'Patient Safety & Documentation',  order: 3, isMandatory: true  },
      { label: 'Adverse events / near-miss incidents reported promptly',           section: 'Patient Safety & Documentation',  order: 4                     },
      { label: 'Fall risk assessment completed for all admitted cases',            section: 'Patient Safety & Documentation',  order: 5                     },
      { label: 'Emergency trolley / crash cart stocked and seal intact',           section: 'Equipment & Environment',         order: 1, isMandatory: true  },
      { label: 'Medical equipment cleaned and maintained as per schedule',         section: 'Equipment & Environment',         order: 2                     },
      { label: 'Adequate lighting available in all care areas',                    section: 'Equipment & Environment',         order: 3                     },
      { label: 'Fire extinguishers accessible and within expiry date',             section: 'Equipment & Environment',         order: 4                     },
      { label: 'Walkways and exits free from obstructions',                        section: 'Equipment & Environment',         order: 5                     },
    ],
  },
  {
    key: 'NURSING',
    name: 'Nursing Services Audit',
    description: 'Daily nursing quality and care standards audit for Nursing Services department.',
    deptCodes: ['NUS'],
    isCommon: false,
    sections: [
      { name: 'Nursing Care Standards',    order: 1 },
      { name: 'Medication Administration', order: 2 },
    ],
    items: [
      { label: 'Nursing notes updated every shift',                                section: 'Nursing Care Standards',    order: 1, isMandatory: true  },
      { label: 'Vital signs recorded at prescribed intervals',                     section: 'Nursing Care Standards',    order: 2, isMandatory: true  },
      { label: 'Bedridden patients repositioned every 2 hours',                   section: 'Nursing Care Standards',    order: 3                     },
      { label: 'IV lines, catheters and tubes labelled with insertion date',       section: 'Nursing Care Standards',    order: 4, isMandatory: true  },
      { label: 'Call bell within reach of every patient',                          section: 'Nursing Care Standards',    order: 5                     },
      { label: '5 Rights of medication administration followed',                   section: 'Medication Administration', order: 1, isMandatory: true  },
      { label: 'High-alert medications stored in locked area with clear label',    section: 'Medication Administration', order: 2, isMandatory: true  },
      { label: 'Expired medications removed from shelves',                         section: 'Medication Administration', order: 3, isMandatory: true  },
      { label: 'Drug allergies documented and communicated to the team',           section: 'Medication Administration', order: 4, isMandatory: true  },
    ],
  },
  {
    key: 'SURGICAL',
    name: 'Surgical Department Checklist',
    description: 'Pre/post-operative and OT quality standards audit for General Surgery.',
    deptCodes: ['GS'],
    isCommon: false,
    sections: [
      { name: 'Pre-Operative Checks',           order: 1 },
      { name: 'OT Environment & Sterilisation', order: 2 },
    ],
    items: [
      { label: 'Surgical Safety Checklist (WHO) completed before incision',       section: 'Pre-Operative Checks',           order: 1, isMandatory: true  },
      { label: 'Site marking verified by surgeon before OT',                      section: 'Pre-Operative Checks',           order: 2, isMandatory: true  },
      { label: 'Patient identity and consent verified in OT',                     section: 'Pre-Operative Checks',           order: 3, isMandatory: true  },
      { label: 'Anaesthesia machine checked before first case of the day',        section: 'Pre-Operative Checks',           order: 4, isMandatory: true  },
      { label: 'Blood availability confirmed for high-risk surgeries',            section: 'Pre-Operative Checks',           order: 5                     },
      { label: 'OT cleaned and fumigated as per schedule',                        section: 'OT Environment & Sterilisation', order: 1, isMandatory: true  },
      { label: 'Instruments sterilised and CSSD record maintained',               section: 'OT Environment & Sterilisation', order: 2, isMandatory: true  },
      { label: 'OT temperature and humidity within prescribed range',             section: 'OT Environment & Sterilisation', order: 3                     },
      { label: 'Instrument count (sponge / needle) documented',                   section: 'OT Environment & Sterilisation', order: 4, isMandatory: true  },
    ],
  },
  {
    key: 'ORTHO',
    name: 'Orthopedics Quality Checklist',
    description: 'Quality and safety standards audit specific to the Orthopedics department.',
    deptCodes: ['ORTHO'],
    isCommon: false,
    sections: [
      { name: 'Pre-Operative Checks',           order: 1 },
      { name: 'Post-Operative & Rehabilitation', order: 2 },
      { name: 'Equipment & Sterilisation',       order: 3 },
    ],
    items: [
      { label: 'Surgical Safety Checklist completed before orthopaedic procedure', section: 'Pre-Operative Checks',            order: 1, isMandatory: true  },
      { label: 'Implant / prosthesis verified against surgical plan',              section: 'Pre-Operative Checks',            order: 2, isMandatory: true  },
      { label: 'Patient allergy to metal / latex checked and documented',          section: 'Pre-Operative Checks',            order: 3, isMandatory: true  },
      { label: 'Tourniquet time recorded and within safe limit',                   section: 'Pre-Operative Checks',            order: 4                     },
      { label: 'Post-operative neurovascular checks performed and documented',     section: 'Post-Operative & Rehabilitation', order: 1, isMandatory: true  },
      { label: 'DVT prophylaxis prescribed and administered as per protocol',      section: 'Post-Operative & Rehabilitation', order: 2, isMandatory: true  },
      { label: 'Physiotherapy referral made within 24 hrs of surgery',             section: 'Post-Operative & Rehabilitation', order: 3                     },
      { label: 'Wound dressing changed as per scheduled interval',                 section: 'Post-Operative & Rehabilitation', order: 4, isMandatory: true  },
      { label: 'Orthopaedic instruments cleaned and sterilised after each use',    section: 'Equipment & Sterilisation',       order: 1, isMandatory: true  },
      { label: 'C-arm / imaging equipment functional and calibrated',              section: 'Equipment & Sterilisation',       order: 2                     },
    ],
  },
];

// ─── Remarks pool for NO responses ─────────────────────────────────────────────
const REMARKS_NO = [
  'Stock not replenished — requisition raised',
  'Staff reminded verbally; re-training scheduled',
  'Maintenance request logged',
  'Equipment sent for calibration',
  'Pending supply delivery — expected within 2 days',
  'Checklist missed due to shift overlap; corrected on next round',
  'Bin label damaged — replaced immediately',
  'Documentation incomplete — staff counselled',
  'Expired stock identified and removed',
];

const CORRECTIVE = [
  'Immediate replenishment of supplies done',
  'Staff instructed and re-trained on protocol',
  'Maintenance team alerted; temporary measure in place',
  'Expired items segregated and disposed properly',
  'Documentation corrected and counter-signed by supervisor',
  'Equipment replaced with functional unit from store',
];

const PREVENTIVE = [
  'Weekly stock audit checklist introduced',
  'Refresher training scheduled for all staff',
  'Monthly maintenance schedule updated',
  'Expiry date monitoring added to daily rounds',
  'Double-check step added to documentation SOP',
  'Backup equipment kept ready on every shift',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  await connectDB();

  // ── 1. Wipe all collections ─────────────────────────────────────────────────
  console.log('\n🗑️  Clearing all data...');
  await Promise.all([
    AuditSubmission.deleteMany({}),
    ChecklistItem.deleteMany({}),
    FormTemplate.deleteMany({}),
    ChiefDoctor.deleteMany({}),
    Notification.deleteMany({}),
    Patient.deleteMany({}),
    Admission.deleteMany({}),
    Location.deleteMany({}),
    Shift.deleteMany({}),
    User.deleteMany({}),
    Department.deleteMany({}),
    MasterData.deleteMany({}),
  ]);
  console.log('✅  Cleared.\n');

  // ── 2. Departments ──────────────────────────────────────────────────────────
  console.log('🏥  Departments...');
  const deptDocs = await Department.insertMany(DEPARTMENTS.map(d => ({ ...d, isActive: true })));
  const deptByCode = {};
  deptDocs.forEach(d => { deptByCode[d.code] = d; });
  console.log(`   ${deptDocs.length} departments created.`);

  // ── 3. MasterData ───────────────────────────────────────────────────────────
  await MasterData.create({
    key: 'default',
    designations: ['Quality Auditor', 'Staff Auditor', 'Unit Supervisor', 'Department Head', 'Quality Officer', 'Infection Control Officer', 'Nursing In-charge', 'Other'],
    wards: ['Ward A', 'Ward B', 'Ward C', 'ICU', 'CCU'],
    units: ['Unit 1', 'Unit 2', 'Unit 3'],
  });

  // ── 4. Locations ────────────────────────────────────────────────────────────
  console.log('📍  Locations...');
  const locDocs = await Location.insertMany(LOCATIONS.map(l => ({ ...l, isActive: true })));
  const locByName = {};
  locDocs.forEach(l => { locByName[l.areaName] = l; });
  console.log(`   ${locDocs.length} locations created.`);

  // ── 5. Shifts ───────────────────────────────────────────────────────────────
  console.log('🕐  Shifts...');
  const shiftModel = require('../models/Shift');
  const shiftDocs = await shiftModel.insertMany(SHIFTS.map(s => ({ name: s.name, startTime: s.startTime, endTime: s.endTime })));
  const shiftByName = {};
  shiftDocs.forEach(s => { shiftByName[s.name] = s; });
  console.log(`   ${shiftDocs.length} shifts created.`);

  // ── 6. Super Admin ──────────────────────────────────────────────────────────
  console.log('\n👑  Super Admin...');
  const adminUser = await User.create({
    name: 'Super Admin', email: 'admin@hospital.com',
    passwordHash: await hash(PASSWORD), role: 'SUPER_ADMIN',
    designation: 'Administrator', isActive: true,
  });
  console.log('   admin@hospital.com');

  // ── 7. QA ────────────────────────────────────────────────────────────────────
  console.log('🔍  QA...');
  const qaUser = await User.create({
    name: 'QA Officer', email: 'qa@hospital.com',
    passwordHash: await hash(PASSWORD), role: 'QA',
    designation: 'Quality Officer',
    department: deptByCode['QUALITY']._id, isActive: true,
  });
  console.log('   qa@hospital.com');

  // ── 8. Supervisors ───────────────────────────────────────────────────────────
  console.log('\n👔  Supervisors...');
  const supervisorDocs = {};
  for (const sup of SUPERVISORS) {
    const dept = deptByCode[sup.deptCode];
    const email = emailOf(sup.name);
    const u = await User.create({
      name: sup.name, email,
      passwordHash: await hash(PASSWORD),
      role: 'SUPERVISOR', designation: sup.designation,
      department: dept._id, isActive: true,
    });
    await ChiefDoctor.create({ name: sup.name, designation: sup.designation, department: dept._id });
    supervisorDocs[sup.deptCode] = u;
    console.log(`   ${email}  →  ${dept.name}`);
  }

  // ── 9. Staff ─────────────────────────────────────────────────────────────────
  console.log('\n👤  Staff...');
  const staffDocs = {};
  for (const s of STAFF) {
    const dept = deptByCode[s.deptCode];
    const email = emailOf(s.name);
    const u = await User.create({
      name: s.name, email,
      passwordHash: await hash(PASSWORD),
      role: 'STAFF', designation: s.designation,
      department: dept._id, isActive: true,
    });
    staffDocs[s.deptCode] = u;
    console.log(`   ${email}  →  ${dept.name}`);
  }

  // ── 10. Form templates + checklist items ──────────────────────────────────────
  //
  // Cross-audit assignments (staff only audit OTHER departments' forms):
  //   GM  form  → audited by Suresh (GS) + Divya (ORTHO)
  //   NUS form  → audited by Meera  (GM) + Suresh (GS)
  //   GS  form  → audited by Meera  (GM) + Divya (ORTHO)
  //   ORTHO form→ audited by Suresh (GS) + Meera  (GM)
  //
  console.log('\n📝  Forms & Checklist Items...');
  const formMap = {};     // key → FormTemplate doc
  const itemsMap = {};    // key → { deptCode → [ChecklistItem] }

  // Explicit cross-department assignments per form key
  // (populated after staffDocs are built)
  const FORM_ASSIGNED_STAFF = {
    DAILY:    ['GS', 'ORTHO'],  // GM form  → GS + ORTHO staff audit it
    NURSING:  ['GM', 'GS'],     // NUS form → GM + GS staff audit it
    SURGICAL: ['GM', 'ORTHO'],  // GS form  → GM + ORTHO staff audit it
    ORTHO:    ['GS', 'GM'],     // ORTHO form → GS + GM staff audit it
  };

  for (const formDef of FORMS) {
    const deptIds = formDef.deptCodes.map(c => deptByCode[c]._id);

    // Cross-department assigned auditors only
    const assignedStaffCodes = FORM_ASSIGNED_STAFF[formDef.key] || [];
    const assignedUserIds = assignedStaffCodes
      .map(code => staffDocs[code]?._id)
      .filter(Boolean);

    const form = await FormTemplate.create({
      name: formDef.name,
      description: formDef.description,
      departments: deptIds,
      isCommon: formDef.isCommon,
      sections: formDef.sections,
      assignedUsers: assignedUserIds,
      isActive: true,
    });
    formMap[formDef.key] = form;
    itemsMap[formDef.key] = {};

    for (const code of formDef.deptCodes) {
      const dept = deptByCode[code];
      const docs = await ChecklistItem.insertMany(
        formDef.items.map(it => ({
          label: it.label,
          departmentScope: 'SINGLE',
          department: dept._id,
          formTemplate: form._id,
          section: it.section,
          responseType: 'YES_NO',
          order: it.order,
          isMandatory: !!it.isMandatory,
          isActive: true,
        }))
      );
      itemsMap[formDef.key][code] = docs;
    }

    console.log(`   ✓ "${form.name}" — ${formDef.items.length} items, assigned to: ${assignedStaffCodes.join(', ') || 'none'}`);
  }

  // ── 11. Audit submissions (7 days of realistic data) ─────────────────────────
  console.log('\n📊  Generating audit submissions (7 days)...');

  // Each submission plan: { staffCode, formKey, day, shift, location, noItemIndexes }
  // noItemIndexes = which items should be answered NO (rest = YES)
  // Cross-audit submissions:
  //  staffCode   = who submits (their own dept is submission.department)
  //  formKey     = which form template
  //  itemDeptCode= which dept's checklist items to use (= form's single dept)
  const submissionPlans = [
    // Meera Joseph (GM) audits the GS Surgical Department Checklist
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 1, shiftName: 'Morning',   loc: 'OT Block', noAt: [1]    },
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 2, shiftName: 'Morning',   loc: 'OT Block', noAt: [5]    },
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 3, shiftName: 'Afternoon', loc: 'Floor 2',  noAt: []     },
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 4, shiftName: 'Morning',   loc: 'OT Block', noAt: [2, 7] },
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 5, shiftName: 'Morning',   loc: 'Zone C',   noAt: []     },
    { staffCode: 'GM', formKey: 'SURGICAL', itemDeptCode: 'GS', day: 6, shiftName: 'Night',     loc: 'OT Block', noAt: []     },

    // Suresh Kumar (GS) audits the General Medicine Daily Checklist
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 1, shiftName: 'Morning',   loc: 'Zone A',  noAt: [4]    },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 2, shiftName: 'Morning',   loc: 'Ward A',  noAt: [2]    },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 3, shiftName: 'Afternoon', loc: 'Zone B',  noAt: []     },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 4, shiftName: 'Afternoon', loc: 'Floor 1', noAt: [9]    },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 5, shiftName: 'Morning',   loc: 'Zone A',  noAt: [3]    },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 6, shiftName: 'Morning',   loc: 'Ward B',  noAt: []     },
    { staffCode: 'GS', formKey: 'DAILY', itemDeptCode: 'GM', day: 7, shiftName: 'Morning',   loc: 'Floor 1', noAt: []     },

    // Divya Menon (ORTHO) audits the Nursing Services Audit (NUS)
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 1, shiftName: 'Morning',   loc: 'Ward A',  noAt: []     },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 2, shiftName: 'Morning',   loc: 'Ward B',  noAt: [3, 6] },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 3, shiftName: 'Afternoon', loc: 'Floor 3', noAt: [7]    },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 4, shiftName: 'Morning',   loc: 'Ward A',  noAt: []     },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 5, shiftName: 'Morning',   loc: 'Zone A',  noAt: [1]    },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 6, shiftName: 'Night',     loc: 'Ward B',  noAt: []     },
    { staffCode: 'ORTHO', formKey: 'NURSING', itemDeptCode: 'NUS', day: 7, shiftName: 'Afternoon', loc: 'Zone C',  noAt: []     },
  ];

  let totalSubDocs = 0;
  const noSubmissions = []; // track for adding corrective/preventive later

  for (const plan of submissionPlans) {
    const staffUser = staffDocs[plan.staffCode];
    const form      = formMap[plan.formKey];
    // Items come from the FORM's department (itemDeptCode), not the staff's dept
    const items     = itemsMap[plan.formKey][plan.itemDeptCode || plan.staffCode];
    const shift     = shiftByName[plan.shiftName];
    const loc       = locByName[plan.loc];
    // submission.department = staff's own department (who performed the audit)
    const dept      = deptByCode[plan.staffCode];

    if (!items || items.length === 0) continue;

    const shiftDef = SHIFTS.find(s => s.name === plan.shiftName);
    const hour     = shiftDef ? shiftDef.hours[0] : 9;
    const ts       = daysAgo(plan.day, hour, Math.floor(Math.random() * 30));

    const docs = items.map((item, idx) => {
      const isNo   = plan.noAt.includes(idx);
      const val    = isNo ? 'NO' : 'YES';
      const doc = {
        department:    dept._id,
        formTemplate:  form._id,
        locationId:    loc?._id,
        shiftId:       shift?._id,
        location:      loc?.areaName || '',
        shift:         shift?.name || '',
        checklistItemId: item._id,
        yesNoNa:       val,
        responseValue: val,
        remarks:       isNo ? rand(REMARKS_NO) : '',
        submittedBy:   staffUser._id,
        submittedAt:   ts,
        auditDate:     new Date(Date.UTC(ts.getFullYear(), ts.getMonth(), ts.getDate())),
        auditTime:     `${String(hour).padStart(2,'0')}:${String(Math.floor(Math.random()*30)).padStart(2,'0')}`,
        isLocked:      true,
      };
      return { doc, isNo };
    });

    const inserted = await AuditSubmission.insertMany(docs.map(d => d.doc));
    totalSubDocs += inserted.length;

    // Collect NO submissions for corrective/preventive actions
    docs.forEach((d, idx) => {
      if (d.isNo) {
        noSubmissions.push({
          submissionId: inserted[idx]._id,
          staffUserId:  staffUser._id,
          supUser:      supervisorDocs[plan.staffCode],
          day:          plan.day,
        });
      }
    });
  }

  console.log(`   ${submissionPlans.length} sessions × avg items = ${totalSubDocs} total submission rows`);

  // ── 12. Corrective / Preventive actions (supervisors review some NO items) ────
  console.log('\n✍️   Adding corrective/preventive actions on NO responses...');

  // Supervisors review ~70% of NO items (simulate realistic review)
  const toReview = pick(noSubmissions, Math.ceil(noSubmissions.length * 0.7));
  let actionCount = 0;
  const notifDocs = [];

  for (const item of toReview) {
    if (!item.supUser) continue;
    const cor  = rand(CORRECTIVE);
    const prev = rand(PREVENTIVE);
    const ts   = daysAgo(item.day - 1, 11, 0);   // Supervisor reviews next day

    await AuditSubmission.findByIdAndUpdate(item.submissionId, {
      corrective: cor,
      preventive: prev,
      correctivePreventiveBy: item.supUser._id,
      correctivePreventiveAt: ts,
    });
    actionCount++;

    // Notification to the staff member
    notifDocs.push({
      user:    item.staffUserId,
      title:   'Corrective & Preventive Actions Added',
      message: `Your supervisor has reviewed your checklist submission and added corrective/preventive actions.`,
      type:    'action',
      isRead:  false,
      createdAt: ts,
    });
  }

  if (notifDocs.length > 0) await Notification.insertMany(notifDocs);
  console.log(`   ${actionCount} actions added → ${notifDocs.length} notifications sent`);

  // ── 13. Summary ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('✅  Seed complete!\n');
  console.log(`  Password (all):  ${PASSWORD}\n`);
  console.log('  SUPER_ADMIN   →  admin@hospital.com');
  console.log('  QA            →  qa@hospital.com');
  for (const sup of SUPERVISORS) {
    console.log(`  SUPERVISOR    →  ${emailOf(sup.name).padEnd(32)}  ${deptByCode[sup.deptCode].name}`);
  }
  for (const s of STAFF) {
    console.log(`  STAFF         →  ${emailOf(s.name).padEnd(32)}  ${deptByCode[s.deptCode].name}`);
  }
  console.log('\n  Forms (each scoped to 1 department):');
  for (const f of FORMS) {
    console.log(`    📝  ${f.name}  →  ${f.deptCodes[0]}`);
  }
  console.log(`\n  Locations : ${LOCATIONS.map(l => l.areaName).join(', ')}`);
  console.log(`  Shifts    : Morning · Afternoon · Night`);
  console.log(`  Submissions: ${totalSubDocs} rows (${submissionPlans.length} sessions, 7 days)`);
  console.log(`  Actions   : ${actionCount} corrective/preventive`);
  console.log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
