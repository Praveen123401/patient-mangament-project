import { useCallback, useEffect, useState } from "react";
import { errMsg } from "../api/axios";

// const { data, loading, error, reload } = useFetch(() => getPatients({ page }), [page]);
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetcher()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, deps);

  useEffect(() => load(), [load]);

  return { data, loading, error, reload: load, setData };
}