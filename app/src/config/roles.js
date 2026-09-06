const PERMISSIONS = {
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_DELETE: 'reports:delete',
  EVENTS_WRITE: 'events:write',
  USERS_ACCESS: 'users:access'
};

const ROLES = {
  viewer: {
    label: 'Viewer',
    permissions: [PERMISSIONS.REPORTS_VIEW]
  },
  analyst: {
    label: 'Analyst',
    permissions: [
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.EVENTS_WRITE,
      PERMISSIONS.USERS_ACCESS
    ]
  },
  superadmin: {
    label: 'Super Admin',
    permissions: [
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_DELETE,
      PERMISSIONS.EVENTS_WRITE,
      PERMISSIONS.USERS_ACCESS
    ]
  }
};

// Which target roles an actor role may create / edit / delete on the users page.
const USER_ADMIN = {
  analyst: { targets: ['viewer'], actions: ['create', 'delete'] },
  superadmin: { targets: ['viewer', 'analyst'], actions: ['create', 'edit', 'delete'] }
};

const DEFAULT_ROLE = 'viewer';

function roleExists(slug) {
  return Object.prototype.hasOwnProperty.call(ROLES, slug);
}

function roleCan(slug, permission) {
  const role = ROLES[slug];
  return Boolean(role && role.permissions.includes(permission));
}

function roleLabel(slug) {
  return ROLES[slug] ? ROLES[slug].label : slug;
}

function canUserAction(actorSlug, action, targetRoleSlug) {
  const rule = USER_ADMIN[actorSlug];
  return Boolean(
    rule && rule.actions.includes(action) && rule.targets.includes(targetRoleSlug)
  );
}

function assignableRoleOptions(actorSlug) {
  const rule = USER_ADMIN[actorSlug];
  return rule ? rule.targets.map((slug) => ({ slug, label: roleLabel(slug) })) : [];
}

module.exports = {
  PERMISSIONS,
  ROLES,
  DEFAULT_ROLE,
  roleExists,
  roleCan,
  roleLabel,
  canUserAction,
  assignableRoleOptions
};
