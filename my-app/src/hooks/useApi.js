import { useState, useEffect, useCallback } from "react";

/**
 * useApi — reusable hook for API calls with loading, error, and data states.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => usersApi.getUsers());
 *
 * With params:
 *   const { data, loading, error } = useApi(
 *     () => workItemsApi.getWorkItems({ projectId }),
 *     [projectId]   // re-fetches when deps change
 *   );
 *
 * Manual fetch (don't auto-fetch on mount):
 *   const { data, loading, execute } = useApi(() => usersApi.createUser(form), [], false);
 *   // then call execute() on form submit
 *
 * @param {Function} apiFn      — function that returns a promise (Axios call)
 * @param {Array}    deps       — dependency array for auto re-fetch (default: [])
 * @param {boolean}  immediate  — whether to fetch on mount (default: true)
 */
const useApi = (apiFn, deps = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      const result = response?.data?.data ?? response?.data ?? response;
      setData(result);
      return result;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, loading, error, setData, refetch: execute, execute };
};

export default useApi;
