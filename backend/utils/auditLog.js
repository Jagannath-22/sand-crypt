// backend/utils/auditLog.js
import AdminAction from '../models/adminAction.model.js';

export const audit = async ({ adminId, action, target = null, details = {}, req = null }) => {
  try {
    const entry = new AdminAction({
      adminId,
      action,
      target,
      details,
      ip: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
    await entry.save();
  } catch (err) {
    console.error('Audit log error:', err);
  }
};
