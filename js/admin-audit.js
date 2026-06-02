async function recordAdminAudit(entityType, entityId, action, summary, metadata = {}) {
  try {
    const { error } = await window.nymSupabase.from("admin_audit_log").insert([
      {
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        action,
        summary,
        metadata,
        user_id: currentUser?.id || null,
        user_email: currentUser?.email || null,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.warn("Admin audit log unavailable:", error.message || error);
  }
}
