import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type GeneratorReturnValueType = void | (() => void);

function* cast<T>(input: Promise<T>): Generator<Promise<T>, T> {
  // eslint-disable-next-line
  // @ts-ignore
  return yield input;
}

export const useAsyncEffect = (
  createGenerator: (
    setCancelHandler: (
      onCancel?: null | (() => void),
      onCancelError?: null | ((err: Error) => void)
    ) => void,
    cast: <T>(promise: Promise<T>) => Generator<Promise<T>, T>
  ) => Iterator<unknown, GeneratorReturnValueType>,
  deps: React.DependencyList
): void => {
  const generatorRef = useRef(createGenerator);

  useEffect(() => {
    generatorRef.current = createGenerator;
  });

  useEffect(() => {
    let isCanceled = false;
    let onCancel = noop;
    let onCancelError = noop as (err: Error) => void;
    const generator = generatorRef.current(
      (cancelHandler, cancelErrorHandler) => {
        onCancel = cancelHandler || noop;
        onCancelError = cancelErrorHandler || noop;
      },
      cast
    );
    let cleanupHandler = noop;

    const run = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: IteratorResult<any> = { value: undefined, done: false };
      let lastError: Error | undefined = undefined;

      do {
        try {
          result = !lastError
            ? generator.next(result.value)
            : generator.throw(lastError);
          lastError = undefined;

          if (result.value && result.value.then) {
            try {
              result.value = await result.value;
            } catch (err) {
              if (isCanceled) {
                onCancelError(err);
                return;
              }

              lastError = err;
            }
          }
          if (isCanceled) {
            return;
          }
          onCancel = noop;
          onCancelError = noop;
        } catch (err) {
          console.error(`[use-async-effect] Unhandled promise rejection.`);
          console.error(err);
          return;
        }
      } while (result.done === false);
      if (result.value) {
        cleanupHandler = result.value;
      }
    };
    run();

    return () => {
      isCanceled = true;
      onCancel();
      cleanupHandler();
    };
  }, deps);
};
