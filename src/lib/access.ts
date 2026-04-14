export interface SessionUser {
  uid?: string;
  role?: string;
  type?: string;
  displayName?: string;
  photoURL?: string;
}

const normalize = (value?: string) => (value || '').toLowerCase();

export const isAdminLike = (user?: SessionUser | null) => {
  const role = normalize(user?.role);
  const type = normalize(user?.type);
  return role === 'admin' || role === 'mentor' || type === 'admin' || type === 'mentor';
};

export const isTeacher = (user?: SessionUser | null) => {
  const role = normalize(user?.role);
  const type = normalize(user?.type);
  return role === 'teacher' || type === 'teacher';
};

export const isParent = (user?: SessionUser | null) => normalize(user?.type) === 'parent';

export const isStudent = (user?: SessionUser | null) => normalize(user?.type) === 'student';

export const getAllowedRoutes = (user?: SessionUser | null): string[] => {
  if (isAdminLike(user)) {
    return [
      '/dashboard',
      '/dashboard/students',
      '/dashboard/attendance',
      '/dashboard/recitation',
      '/dashboard/tests',
      '/dashboard/plans',
      '/dashboard/visits',
      '/dashboard/users',
      '/dashboard/reports',
      '/dashboard/settings',
    ];
  }

  if (isTeacher(user)) {
    return [
      '/dashboard',
      '/dashboard/students',
      '/dashboard/attendance',
      '/dashboard/recitation',
      '/dashboard/tests',
      '/dashboard/settings',
    ];
  }

  if (isParent(user) || isStudent(user)) {
    return ['/dashboard', '/dashboard/students', '/dashboard/settings'];
  }

  return ['/dashboard', '/dashboard/settings'];
};

export const canAccessRoute = (pathname: string, user?: SessionUser | null) => {
  const allowed = getAllowedRoutes(user);
  return allowed.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};
