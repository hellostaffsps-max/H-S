import { useState, useEffect } from 'react';

interface AdminAuthState {
  permissions: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    permissions: [],
    isSuperAdmin: false,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchAdminAuth() {
      try {
        const res = await fetch('/api/admin/check');
        const json = await res.json();
        if (json.success) {
          setState({
            permissions: json.permissions || [],
            isSuperAdmin: json.isSuperAdmin || false,
            isAdmin: json.isAdmin || false,
            loading: false,
          });
        } else {
          setState({ permissions: [], isSuperAdmin: false, isAdmin: false, loading: false });
        }
      } catch {
        setState({ permissions: [], isSuperAdmin: false, isAdmin: false, loading: false });
      }
    }
    fetchAdminAuth();
  }, []);

  const hasPermission = (permission: string) => {
    return state.isSuperAdmin || state.permissions.includes(permission);
  };

  return { ...state, hasPermission };
}
