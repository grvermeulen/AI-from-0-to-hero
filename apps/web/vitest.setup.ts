import React from 'react';
(globalThis as any).React = React;

export async function flushTimers() {
  await Promise.resolve();
}


