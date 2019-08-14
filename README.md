# useAsyncEffect

[![npm](https://img.shields.io/npm/v/@n1ru4l/use-async-effect.svg)](https://www.npmjs.com/package/@n1ru4l/use-async-effect)
[![NPM](https://img.shields.io/npm/dm/@n1ru4l/use-async-effect.svg)](https://www.npmjs.com/package/@n1ru4l/use-async-effect)
[![CircleCI](https://img.shields.io/circleci/build/github/n1ru4l/use-async-effect.svg)](https://circleci.com/gh/n1ru4l/use-async-effect)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Simplify your async `useEffect` code with a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [The problem](#the-problem)
- [Example](#example)
  - [Before 😖](#before-)
  - [After 🤩](#after-)
- [Usage](#usage)
  - [Install Instructions](#install-instructions)
  - [Usage Instructions](#usage-instructions)
    - [Basic Usage](#basic-usage)
    - [Cancelling an in-flight `fetch` request](#cancelling-an-in-flight-fetch-request)
- [API](#api)
  - [`useAsyncEffect`](#useasynceffect)
- [Contributing](#contributing)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## The problem

Doing async stuff with `useEffect` clutters your code:

- You cannot pass an async function to `useEffect`
- You have to manually keep track whether you can set state or not
- You cannot cancel an async function

This micro library tries to solve this issue by using generator functions:

- Pass a generator to `useAsyncEffect`
- Automatically stop running the generator after the dependency list has changed or the component did unmount
- Optional cancelation handling via events e.g. for canceling your `fetch` request with [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController#Examples)

## Example

### Before 😖

```jsx
import React, { useEffect } from "react";

const MyComponent = ({ filter }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isCanceled = false;
    let isFetchPending = false;

    const runHandler = async () => {
      const controller = new AbortController();
      try {
        isFetchPending = true;
        const data = await fetch("/data?filter=" + filter, {
          signal: controller.signal
        }).then(res => res.json());
        isFetchPending = false;
        if (isCanceled) {
          return;
        }
        setData(data);
      } catch (err) {
        isFetchPending = false;
        if (err.name === "AbortError") {
          return;
        }
        // identify and handle other errors here
      }
    };

    runHandler();
    return () => {
      isCanceled = true;
      if (isFetchPending) {
        controller.abort();
      }
    };
  }, [setError, setData]);
};
```

### After 🤩

```jsx
import React from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyComponent = ({ filter }) => {
  const [data, setData] = useState(null);

  useAsyncEffect(
    function*(onCancel) {
      const controller = new AbortController();

      onCancel(
        () => {
          controller.abort();
        },
        err => {
          if (err.name === "AbortError") {
            return;
          }
          // handle unexpected errors raised during cancel here
        }
      );

      const data = yield fetch("/data?filter=" + filter, {
        signal: controller.signal
      }).then(res => res.json());

      setData(data);
    },
    [setError, setData]
  );
};
```

## Usage

### Install Instructions

`yarn add -E @n1ru4l/use-async-effect`

or

`npm install -E @n1ru4l/use-async-effect`

### Usage Instructions

Works like `useEffect`, but with a generator function and without a cleanup function.

#### Basic Usage

```jsx
import React, { useState } from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyDoggoImage = () => {
  const [doggoImageSrc, setDoggoImageSrc] = useState(null);
  useAsyncEffect(
    function*() {
      const { message } = yield fetch(
        "https://dog.ceo/api/breeds/image/random"
      ).then(res => res.json());
      setDoggoImageSrc(message);
    },
    [setDoggoImageSrc]
  );

  return doggoImageSrc ? <img src={doggoImageSrc} /> : null;
};
```

[![Edit use-async-effect doggo demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-async-effect-doggo-demo-qrqix?fontsize=14)

#### Cancelling an in-flight `fetch` request

You can react to cancels, that might occur while a promise has not resolved yet, by registering a handler via `onCancel`.
After an async operation has been processed, the `onCancel` handler is automatically being unset.

```jsx
import React, { useState } from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";

const MyDoggoImage = () => {
  const [doggoImageSrc, setDoggoImageSrc] = useState(null);
  useAsyncEffect(
    function*(onCancel) {
      const abortController = new AbortController();
      onCancel(() => {
        abortController.abort();
      });
      const { message } = yield fetch(
        "https://dog.ceo/api/breeds/image/random",
        { signal: abortController.signal }
      );
      setDoggoImageSrc(message);
    },
    [setDoggoImageSrc]
  );

  return doggoImageSrc ? <img src={doggoImageSrc} /> : null;
};
```

[![Edit use-async-effect doggo cancel demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-async-effect-doggo-cancel-demo-6rxvd?fontsize=14)

## API

### `useAsyncEffect`

Runs a effect that includes async operations. The effect ins cancelled upon dependency change/unmount.

```ts
function useAsyncEffect(
  generator: (
    setCancelHandler?: (
      onCancel?: null | (() => void),
      onCancelError?: null | ((err: Error) => void)
    ) => void
  ) => IterableIterator<any>,
  dependencyList: React.DependencyList
): void;
```

## Contributing

Please check our contribution guides [Contributing](CONTRIBUTING.md).

## LICENSE

MIT
