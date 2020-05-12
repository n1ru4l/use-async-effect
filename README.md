# useAsyncEffect

[![npm](https://img.shields.io/npm/v/@n1ru4l/use-async-effect.svg)](https://www.npmjs.com/package/@n1ru4l/use-async-effect)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@n1ru4l/use-async-effect)](https://bundlephobia.com/result?p=@n1ru4l/use-async-effect)
[![Dependencies](https://img.shields.io/david/n1ru4l/use-async-effect)](https://www.npmjs.com/package/@n1ru4l/use-async-effect)
[![NPM](https://img.shields.io/npm/dm/@n1ru4l/use-async-effect.svg)](https://www.npmjs.com/package/@n1ru4l/use-async-effect)
[![CircleCI](https://img.shields.io/circleci/build/github/n1ru4l/use-async-effect.svg)](https://circleci.com/gh/n1ru4l/use-async-effect)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Simple type-safe async effects for React powered by [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

```tsx
import React from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyComponent = ({ filter }) => {
  const [data, setData] = React.useState(null);

  useAsyncEffect(
    function* (onCancel, c) {
      const controller = new AbortController();

      onCancel(() => controller.abort());

      const data = yield* c(
        fetch("/data?filter=" + filter, {
          signal: controller.signal,
        }).then((res) => res.json())
      );

      setData(data);
    },
    [filter]
  );

  return data ? <RenderData data={data} /> : null;
};
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install Instructions](#install-instructions)
- [The problem](#the-problem)
- [Example](#example)
  - [Before 😖](#before-)
  - [After 🤩](#after-)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Cancel handler (Cancelling an in-flight `fetch` request)](#cancel-handler-cancelling-an-in-flight-fetch-request)
  - [Cleanup Handler](#cleanup-handler)
  - [Setup eslint for `eslint-plugin-react-hooks`](#setup-eslint-for-eslint-plugin-react-hooks)
  - [TypeScript](#typescript)
- [API](#api)
  - [`useAsyncEffect` Hook](#useasynceffect-hook)
- [Contributing](#contributing)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install Instructions

`yarn add -E @n1ru4l/use-async-effect`

or

`npm install -E @n1ru4l/use-async-effect`

## The problem

Doing async stuff with `useEffect` clutters your code:

- 😖 You cannot pass an async function to `useEffect`
- 🤢 You cannot cancel an async function
- 🤮 You have to manually keep track whether you can set state or not

This micro library tries to solve this issue by using generator functions:

- ✅ Pass a generator to `useAsyncEffect`
- ✅ Return cleanup function from generator function
- ✅ Automatically stop running the generator after the dependency list has changed or the component did unmount
- ✅ Optional cancelation handling via events e.g. for canceling your `fetch` request with [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController#Examples)

## Example

### Before 😖

```jsx
import React, { useEffect } from "react";

const MyComponent = ({ filter }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isCanceled = false;
    const controller = new AbortController();

    const runHandler = async () => {
      try {
        const data = await fetch("/data?filter=" + filter, {
          signal: controller.signal,
        }).then((res) => res.json());
        if (isCanceled) {
          return;
        }
        setData(data);
      } catch (err) {}
    };

    runHandler();
    return () => {
      isCanceled = true;
      controller.abort();
    };
  }, [filter]);

  return data ? <RenderData data={data} /> : null;
};
```

### After 🤩

```jsx
import React from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyComponent = ({ filter }) => {
  const [data, setData] = useState(null);

  useAsyncEffect(
    function* (onCancel, c) {
      const controller = new AbortController();

      onCancel(() => controller.abort());

      const data = yield* c(
        fetch("/data?filter=" + filter, {
          signal: controller.signal,
        }).then((res) => res.json())
      );

      setData(data);
    },
    [filter]
  );

  return data ? <RenderData data={data} /> : null;
};
```

## Usage

Works like `useEffect`, but with a generator function.

### Basic Usage

```jsx
import React, { useState } from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyDoggoImage = () => {
  const [doggoImageSrc, setDoggoImageSrc] = useState(null);
  useAsyncEffect(function* (_, c) {
    const { message } = yield* c(
      fetch("https://dog.ceo/api/breeds/image/random").then((res) => res.json())
    );
    setDoggoImageSrc(message);
  }, []);

  return doggoImageSrc ? <img src={doggoImageSrc} /> : null;
};
```

[![Edit use-async-effect doggo demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-async-effect-doggo-demo-qrqix?fontsize=14)

### Cancel handler (Cancelling an in-flight `fetch` request)

You can react to cancels, that might occur while a promise has not resolved yet, by registering a handler via `onCancel`.
After an async operation has been processed, the `onCancel` handler is automatically being unset.

```jsx
import React, { useState } from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyDoggoImage = () => {
  const [doggoImageSrc, setDoggoImageSrc] = useState(null);
  useAsyncEffect(function* (onCancel, c) {
    const abortController = new AbortController();
    onCancel(() => abortController.abort());
    const { message } = yield c(
      fetch("https://dog.ceo/api/breeds/image/random", {
        signal: abortController.signal,
      }).then((res) => res.json())
    );
    setDoggoImageSrc(message);
  }, []);

  return doggoImageSrc ? <img src={doggoImageSrc} /> : null;
};
```

[![Edit use-async-effect doggo cancel demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-async-effect-doggo-cancel-demo-6rxvd?fontsize=14)

### Cleanup Handler

Similar to `React.useEffect` you can return a cleanup function from your generator function.
It will be called once the effect dependencies change or the component is unmounted.
Please take note that the whole generator must be executed before the cleanup handler can be invoked.
In case you setup event listeners etc. earlier you will also have to clean them up by specifiying a cancel handler.

```jsx
import React, { useState } from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyDoggoImage = () => {
  const [doggoImageSrc, setDoggoImageSrc] = useState(null);
  useAsyncEffect(function* (_, c) {
    const { message } = yield* c(
      fetch("https://dog.ceo/api/breeds/image/random").then((res) => res.json())
    );
    setDoggoImageSrc(message);

    const listener = () => {
      console.log("I LOVE DOGGIES", message);
    };
    window.addEventListener("mousemove", listener);
    return () => window.removeEventListener("mousemove", listener);
  }, []);

  return doggoImageSrc ? <img src={doggoImageSrc} /> : null;
};
```

[![Edit use-async-effect cleanup doggo demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-async-effect-doggo-demo-w1zlh?fontsize=14)

### Setup eslint for `eslint-plugin-react-hooks`

You need to configure the `react-hooks/exhaustive-deps` plugin to treat `useAsyncEffect` as a hook with dependencies.

Add the following to your eslint config file:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        "additionalHooks": "useAsyncEffect"
      }
    ]
  }
}
```

### TypeScript

We expose a helper function for TypeScript that allows interferring the correct Promise resolve type. It uses some type-casting magic under the hood and requires you to use the `yield*` keyword instead of the `yield` keyword.

```tsx
useAsyncEffect(function* (setErrorHandler, c) {
  const numericValue = yield* c(Promise.resolve(123));
  // type of numericValue is number 🎉
});
```

## API

### `useAsyncEffect` Hook

Runs a effect that includes async operations. The effect ins cancelled upon dependency change/unmount.

```ts
function useAsyncEffect(
  createGenerator: (
    setCancelHandler: (
      onCancel?: null | (() => void),
      onCancelError?: null | ((err: Error) => void)
    ) => void,
    cast: <T>(promise: Promise<T>) => Generator<Promise<T>, T>
  ) => Iterator<any, any, any>,
  deps: React.DependencyList
): void;
```

## Contributing

Please check our contribution guides [Contributing](https://github.com/n1ru4l/use-async-effect/blob/master/Contributing.md).

## LICENSE

[MIT](https://github.com/n1ru4l/use-async-effect/blob/master/LICENSE).
