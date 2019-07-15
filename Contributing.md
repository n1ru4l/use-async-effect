# Contributing

Thanks for being willing to contribute!

Before setting up you project consider the following:

- Please do not send any feature request/pull-request before discussing them in issues.
- Please cover every bug fix with a test.
- Please fill out the issues/pull-request templates.

## Project setup

1.  Fork and clone the repo
2.  Run `yarn install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr/your-branch-name`

> Tip: Keep your `master` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```
> git remote add upstream https://github.com/n1ru4l/use-async-effect.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `master`
> branch to use the upstream master branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `master` branch.
> Whenever you want to update your version of `master`, do a regular `git pull`.

## Committing and Pushing changes

Please make sure to run the tests before you commit your changes. You can run them with
`yarn test`.

There is a pre-commit hook that will run the tests and format the files before commiting.

In case you want to skip the test run, e.g. by first pushing a failing tests, you can skip the hook with `git commit --no-verify`.
