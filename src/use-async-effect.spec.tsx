import React from "react";
import { useAsyncEffect } from "./use-async-effect";
import { cleanup, render, act } from "@testing-library/react";

afterEach(cleanup);

it("can be used", () => {
  const TestComponent: React.FC<{}> = () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    useAsyncEffect(function*() {}, []);
    return null;
  };
  render(<TestComponent />);
});

it("calls the generator", () => {
  const callable = jest.fn();
  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      callable();
    }, []);
    return null;
  };
  render(<TestComponent />);
  expect(callable).toHaveBeenCalledTimes(1);
});

it("calls the generator again once a dependency changes", () => {
  const callable = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let setState = (str: string) => {};

  const TestComponent: React.FC<{}> = () => {
    const [state, _setState] = React.useState<string>("hello");
    useAsyncEffect(
      function*() {
        callable();
      },
      [state]
    );
    setState = _setState;
    return null;
  };

  render(<TestComponent />);

  act(() => {
    setState("bye");
  });
  expect(callable).toHaveBeenCalledTimes(2);
});

it("yield can resolve a non promise object", () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      const value: string = yield "foobars";
      callable(value);
    }, []);
    return null;
  };

  render(<TestComponent />);

  expect(callable).toHaveBeenCalledWith("foobars");
});

it("yield can resolve a promise object", async () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      const value: string = yield Promise.resolve("foobars");
      callable(value);
    }, []);
    return null;
  };

  render(<TestComponent />);

  // wait until next tick
  await Promise.resolve();

  expect(callable).toHaveBeenCalledWith("foobars");
});

it("effect can be canceled", async () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      const value: string = yield Promise.resolve("foobars");
      callable(value);
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);

  // unmount to initiate the cancel
  unmount();

  // wait until next tick
  await Promise.resolve();

  // the promise is resolved but the generator call-loop is suspended
  // therefore callable should never be called
  expect(callable).toHaveBeenCalledTimes(0);
});

it("calls a handler for canceling", async () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(() => {
        callable("cancel");
      });
      yield Promise.resolve("foobars");
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  unmount();

  // wait until next tick
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(1);
  expect(callable).toHaveBeenCalledWith("cancel");
});

it("does not call a undefined handler", async () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(() => {
        callable("cancel");
      });
      onCancel();
      yield Promise.resolve("foobars");
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  unmount();

  // wait until next tick
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(0);
});

it("does override cancel handler", async () => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(() => {
        callable("cancel");
      });
      onCancel(() => {
        callable("aye");
      });
      yield Promise.resolve("foobars");
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  unmount();

  // wait until next tick
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(1);
  expect(callable).toHaveBeenCalledWith("aye");
});

it("does resolve multiple yields in a row", async done => {
  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      const value: string = yield Promise.resolve("foobars");
      const value2: string = yield Promise.resolve("henlo");
      const value3: string = yield Promise.resolve("ay");
      expect(value).toEqual("foobars");
      expect(value2).toEqual("henlo");
      expect(value3).toEqual("ay");
      done();
    }, []);
    return null;
  };
  render(<TestComponent />);
});

it("does throw promise rejections", async done => {
  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      try {
        yield Promise.reject(new Error("Something went wrong."));
        done.fail("Should throw");
      } catch (err) {
        expect(err.message).toEqual("Something went wrong.");
        done();
      }
    }, []);
    return null;
  };
  render(<TestComponent />);
});

it("logs warnings about uncatched promises to the console", async done => {
  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      yield Promise.reject(new Error("Something went wrong."));
      done.fail("Should throw.");
    }, []);
    return null;
  };
  const spy = jest.spyOn(console, "error").mockImplementation();
  render(<TestComponent />);
  await Promise.resolve();
  expect(console.error).toHaveBeenCalledTimes(1);
  spy.mockRestore();
  done();
});

it("onCancel is resetted after each yield", async done => {
  const callable = jest.fn();
  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(() => {
        callable("foo");
      });
      yield Promise.resolve("yey");
      yield Promise.resolve("ay");
    }, []);
    return null;
  };
  const { unmount } = render(<TestComponent />);
  await Promise.resolve();
  unmount();
  await Promise.resolve();
  expect(callable).toHaveBeenCalledTimes(0);
  done();
});

it("onCancel is run before a promise is resolved", async done => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(() => {
        callable("onCancel");
      });
      yield Promise.resolve().then(() => {
        callable("promise");
      });
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  unmount();

  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(2);
  expect(callable).toHaveBeenNthCalledWith(1, "onCancel");
  expect(callable).toHaveBeenNthCalledWith(2, "promise");

  done();
});

it("onCancel second parameter for error handling", async done => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*(onCancel) {
      onCancel(
        () => {},
        err => {
          callable(err.message);
        }
      );
      yield Promise.reject(new Error("lel"));
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  unmount();
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(1);
  expect(callable).toHaveBeenNthCalledWith(1, "lel");

  done();
});

it("calls a cleanup function returned by the generator when unmounting", async done => {
  const callable = jest.fn();

  const TestComponent: React.FC<{}> = () => {
    useAsyncEffect(function*() {
      yield Promise.resolve();
      return () => {
        callable();
      };
    }, []);
    return null;
  };

  const { unmount } = render(<TestComponent />);
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(0);

  unmount();
  expect(callable).toHaveBeenCalledTimes(1);
  done();
});

it("calls a clenup function returned by the generator when dependencies change", async done => {
  const callable = jest.fn();

  let setState: (i: number) => void = () => 1;

  const TestComponent: React.FC<{}> = () => {
    const [state, _setState] = React.useState(0);
    setState = _setState;
    useAsyncEffect(
      function*() {
        yield Promise.resolve();
        return () => {
          callable();
        };
      },
      [state]
    );
    return null;
  };

  const { unmount } = render(<TestComponent />);
  await Promise.resolve();

  act(() => {
    setState(1);
  });
  await Promise.resolve();

  expect(callable).toHaveBeenCalledTimes(1);
  unmount();
  expect(callable).toHaveBeenCalledTimes(2);
  done();
});
