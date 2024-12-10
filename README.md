# StoryHunt SDK Guide

## StoryHunt SDK to work with V3 Contracts
1. Liquidity
2. Swap

## Continuous Integration

### GitHub Actions

Two actions are added:

- `main` which installs deps w/ cache, lints, tests, and builds on all pushes against a Node and OS matrix
- `size` which comments cost comparison of your library on every pull request using [`size-limit`](https://github.com/ai/size-limit)

## Publishing to NPM

We recommend using [np](https://github.com/sindresorhus/np).
