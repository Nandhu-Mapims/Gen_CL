/**
 * Past submissions keep frozen checklist/form labels at submit time.
 * When displaying, merge snapshots so edits or soft-deletes do not show null on old reports.
 */
function applySubmissionSnapshot(sub) {
  const doc = sub && typeof sub.toObject === 'function' ? sub.toObject() : { ...(sub || {}) };

  const checklistRef =
    doc.checklistItemId && typeof doc.checklistItemId === 'object'
      ? { ...doc.checklistItemId }
      : doc.checklistItemId
        ? { _id: doc.checklistItemId }
        : {};

  if (doc.checklistLabel) checklistRef.label = doc.checklistLabel;
  else if (checklistRef.label) doc.checklistLabel = checklistRef.label;

  if (doc.checklistSection !== undefined && doc.checklistSection !== null && doc.checklistSection !== '') {
    checklistRef.section = doc.checklistSection;
  } else if (checklistRef.section) doc.checklistSection = checklistRef.section;

  if (doc.checklistResponseType) checklistRef.responseType = doc.checklistResponseType;
  else if (checklistRef.responseType) doc.checklistResponseType = checklistRef.responseType;

  if (doc.checklistOrder !== undefined && doc.checklistOrder !== null) {
    checklistRef.order = doc.checklistOrder;
  } else if (checklistRef.order !== undefined) doc.checklistOrder = checklistRef.order;

  doc.checklistItemId = checklistRef;

  const formRef =
    doc.formTemplate && typeof doc.formTemplate === 'object'
      ? { ...doc.formTemplate }
      : doc.formTemplate
        ? { _id: doc.formTemplate }
        : null;

  if (doc.formTemplateName) {
    doc.formTemplate = formRef ? { ...formRef, name: doc.formTemplateName } : { name: doc.formTemplateName };
  } else if (formRef?.name) {
    doc.formTemplateName = formRef.name;
    doc.formTemplate = formRef;
  }

  return doc;
}

function applySubmissionSnapshots(list) {
  return (Array.isArray(list) ? list : []).map(applySubmissionSnapshot);
}

/** Persist snapshots for legacy rows that only stored checklistItemId reference. */
async function backfillMissingSnapshots(submissions, AuditSubmission) {
  if (!AuditSubmission) return;
  const bulk = [];
  for (const sub of submissions) {
    const id = sub._id;
    const populated = sub.checklistItemId && typeof sub.checklistItemId === 'object' ? sub.checklistItemId : null;
    const formPopulated = sub.formTemplate && typeof sub.formTemplate === 'object' ? sub.formTemplate : null;
    if (!id) continue;
    if (sub.checklistLabel) continue;
    if (!populated?.label) continue;
    bulk.push({
      updateOne: {
        filter: { _id: id, checklistLabel: { $in: [null, ''] } },
        update: {
          $set: {
            checklistLabel: populated.label || '',
            checklistSection: populated.section || '',
            checklistResponseType: populated.responseType || 'YES_NO',
            checklistOrder: populated.order ?? 0,
            ...(formPopulated?.name && !sub.formTemplateName ? { formTemplateName: formPopulated.name } : {}),
          },
        },
      },
    });
  }
  if (bulk.length > 0) {
    await AuditSubmission.bulkWrite(bulk, { ordered: false });
  }
}

module.exports = { applySubmissionSnapshot, applySubmissionSnapshots, backfillMissingSnapshots };
