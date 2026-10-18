import { lazy, type ComponentProps, type ComponentType } from 'react';

/**
 * Like `React.lazy`, but a failed load can be tried again. `lazy` keeps the
 * rejection forever, so after a network error or a deploy that dropped the old
 * chunks the component could never load until the page was reloaded. `reset`
 * throws that lazy away; the next mount asks for the chunk again.
 */
// `any` is the bound React.lazy itself uses.
export function createRetryableLazy<C extends ComponentType<any>>(load: () => Promise<{ default: C }>) {
  let Inner = lazy(load);

  // Reads `Inner` on every mount, so a mount after `reset` gets the fresh lazy.
  function RetryableLazy(props: ComponentProps<C>) {
    return <Inner {...(props as ComponentProps<typeof Inner>)} />;
  }
  RetryableLazy.reset = () => {
    Inner = lazy(load);
  };
  return RetryableLazy;
}
