import test from "node:test";
import assert from "node:assert/strict";
import { createConfirmationGate } from "../src/lib/admin/confirmation.ts";

test("confirmation yields while waiting, then explicitly authorizes the action", async () => {
  const gate = createConfirmationGate();
  let opened = false;
  let action = false;
  const decision = gate.request(() => { opened = true; }).then(accepted => { action = accepted; });
  assert.equal(opened, true);
  await Promise.resolve();
  assert.equal(action, false);
  assert.equal(gate.settle(true), true);
  await decision;
  assert.equal(action, true);
});

test("cancel or Escape leaves an action unauthorized and clears the pending choice", async () => {
  const gate = createConfirmationGate();
  const first = gate.request(() => {});
  assert.equal(gate.settle(false), true);
  assert.equal(await first, false);
  assert.equal(gate.settle(true), false);
  const second = gate.request(() => {});
  gate.settle(true);
  assert.equal(await second, true);
});

test("parallel confirmation requests cannot replace or authorize an outstanding choice", async () => {
  const gate = createConfirmationGate();
  const first = gate.request(() => {});
  let secondOpened = false;
  const second = gate.request(() => { secondOpened = true; });
  assert.equal(await second, false);
  assert.equal(secondOpened, false);
  gate.settle(false);
  assert.equal(await first, false);
});
