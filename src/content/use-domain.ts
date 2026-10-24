import { useEffect, useState } from "react";
import { cachedDomain, loadDomain } from "./load";
export function useDomain(id: string | undefined) {
  const [state, setState] = useState(() => ({
    domain: cachedDomain(id),
    error: "",
  }));
  useEffect(() => {
    let active = true;
    if (!id) return;
    const cached = cachedDomain(id);
    if (cached) {
      setState({ domain: cached, error: "" });
      return;
    }
    setState({ domain: undefined, error: "" });
    void loadDomain(id)
      .then((domain) => {
        if (active) setState({ domain, error: "" });
      })
      .catch(() => {
        if (active)
          setState({
            domain: undefined,
            error:
              "This lesson could not be loaded. Check your connection and reload to try again.",
          });
      });
    return () => {
      active = false;
    };
  }, [id]);
  return state.domain?.id === id
    ? state
    : { domain: undefined, error: state.error };
}
