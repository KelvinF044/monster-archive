// One outstanding explicit choice at a time. Unlike window.confirm(), the
// returned promise yields the event loop while the editor considers the action.
export function createConfirmationGate() {
  let resolvePending: ((confirmed: boolean) => void) | null = null;

  function request(show: () => void): Promise<boolean> {
    if (resolvePending) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      resolvePending = resolve;
      show();
    });
  }

  function settle(confirmed: boolean): boolean {
    const resolve = resolvePending;
    if (!resolve) return false;
    resolvePending = null;
    resolve(confirmed);
    return true;
  }

  return { request, settle };
}
