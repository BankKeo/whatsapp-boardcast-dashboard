"use client";

import * as React from "react";

type SetHeaderAction = (node: React.ReactNode | null) => void;

const HeaderActionContext = React.createContext<SetHeaderAction | null>(null);

export function HeaderActionProvider({
  setHeaderAction,
  children,
}: {
  setHeaderAction: SetHeaderAction;
  children: React.ReactNode;
}) {
  return (
    <HeaderActionContext.Provider value={setHeaderAction}>
      {children}
    </HeaderActionContext.Provider>
  );
}

/**
 * Registers the contextual primary action rendered in the app header and clears
 * it on unmount.
 *
 * Re-registering on every page render is safe: `AppShell` receives its page
 * content as a stable `children` element, so updating the header's own state
 * does not re-render the page subtree (and therefore cannot loop). Keeping the
 * effect keyed on the node means the header always shows the current action for
 * the page's state, for example after a campaign is simulated.
 */
export function useHeaderAction(node: React.ReactNode | null, dependencies: unknown[] = []) {
  const setHeaderAction = React.useContext(HeaderActionContext);
  React.useEffect(() => {
    if (!setHeaderAction) return;
    setHeaderAction(node);
    return () => setHeaderAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderAction, node, ...dependencies]);
}
