# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.11-13](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-12...v0.0.11-13) (2023-09-12)


### Bug Fixes

* add jest.config.ts to ts exclude ([d0672f3](https://github.com/solidchain-tech/badge-buddy-processor/commit/d0672f3517bc885c9660a4efd1d4861d4b662a5f))


### Refactor

* remove unused imports ([db27147](https://github.com/solidchain-tech/badge-buddy-processor/commit/db27147a4b0f6a193090ca0618e923723617bd35))

### [0.0.11-12](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-11...v0.0.11-12) (2023-09-09)


### Bug Fixes

* docker build ([58f2946](https://github.com/solidchain-tech/badge-buddy-processor/commit/58f294684a86dba3a6b5e733a16a61e0f4665fc5))

### [0.0.11-11](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-10...v0.0.11-11) (2023-09-09)


### Tests

* add test:cov to staging and production ([e1030da](https://github.com/solidchain-tech/badge-buddy-processor/commit/e1030da0a07cf1a42bfeec13df4e5a14ddb5a55e))

### [0.0.11-10](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-9...v0.0.11-10) (2023-09-09)


### Performance

* upgrade common -> 1.0.1 ([54745fc](https://github.com/solidchain-tech/badge-buddy-processor/commit/54745fcfa8e10a6bd4eae5ba224c01c0bdf02f33))


### Refactor

* update workflow to use parseReleaseUtil() ([7fded73](https://github.com/solidchain-tech/badge-buddy-processor/commit/7fded7341cd890ed3faf60d0b855f9fed25edc55))

### [0.0.11-9](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-8...v0.0.11-9) (2023-09-06)


### Tests

* add full test coverage for EventsProcessorService ([1ad67df](https://github.com/solidchain-tech/badge-buddy-processor/commit/1ad67dfcf87fb5167b6a893cc128b03577b200e1))

### [0.0.11-8](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-7...v0.0.11-8) (2023-09-06)


### Refactor

* use proper redis cache class ([155a5db](https://github.com/solidchain-tech/badge-buddy-processor/commit/155a5db6b1149506b140215b6aa98684dfa23a03))

### [0.0.11-7](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-6...v0.0.11-7) (2023-09-04)


### Docs

* rename participants.md heading ([65e5c96](https://github.com/solidchain-tech/badge-buddy-processor/commit/65e5c9654fc784d40bb0dc994a65809d7a886c40))


### Performance

* pull user from db in case not found in cache ([7ee548d](https://github.com/solidchain-tech/badge-buddy-processor/commit/7ee548d2c03890ebd18462beb443337e549ae909))

### [0.0.11-6](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-5...v0.0.11-6) (2023-09-04)


### Tests

* add first test for event-tracking.service.ts ([32ee90f](https://github.com/solidchain-tech/badge-buddy-processor/commit/32ee90fe9cbd875808723c16edc96eef7c97c6e3))
* add full test coverage for event-tracking.service.ts ([8744e9f](https://github.com/solidchain-tech/badge-buddy-processor/commit/8744e9f18814939bc3c70a20bbac44a7f84b3dbf))
* add test for hopping active events ([ae582d8](https://github.com/solidchain-tech/badge-buddy-processor/commit/ae582d87ddf85f8dff7c48f2dfb355af8cf1f959))
* add tests and add conditions check ([9f15108](https://github.com/solidchain-tech/badge-buddy-processor/commit/9f151083b2b2c3d7dfa4f9f1000da6a79af8f5d1))

### [0.0.11-5](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-4...v0.0.11-5) (2023-09-02)


### Features

* handle event tracking impl ([cbbc8ce](https://github.com/solidchain-tech/badge-buddy-processor/commit/cbbc8ce06722442af1a1a5b7de199f4509d8cad2))

### [0.0.11-4](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-3...v0.0.11-4) (2023-09-02)


### Bug Fixes

* use next @solidchain/badge-buddy-common ([a2ae2ec](https://github.com/solidchain-tech/badge-buddy-processor/commit/a2ae2ec4b0b91de6e9202111738af8a7d8a6a914))


### Performance

* update deps ([5644ed3](https://github.com/solidchain-tech/badge-buddy-processor/commit/5644ed338ca18cc2600bd169939cf3f051878722))

### [0.0.11-3](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-2...v0.0.11-3) (2023-08-31)


### Refactor

* remove express dep ([63b4b6d](https://github.com/solidchain-tech/badge-buddy-processor/commit/63b4b6d066f8cc4136014edb8d099e943838ec9f))


### Performance

* import @jest/globals ([9ad2d64](https://github.com/solidchain-tech/badge-buddy-processor/commit/9ad2d6462d6beea2aea6a163b5027d6ef6ac3c07))


### Tests

* add basic jest cases for EventsProcessor.start ([5e7d45d](https://github.com/solidchain-tech/badge-buddy-processor/commit/5e7d45d8b74f83f987d89dc7deeba1570c0f0788))

### [0.0.11-2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-1...v0.0.11-2) (2023-08-29)


### Performance

* enhance dockerfile steps ([367511e](https://github.com/solidchain-tech/badge-buddy-processor/commit/367511e51c033bf7872e62d869c107f5d1d1a7be))
* upgrade deps ([5a732b5](https://github.com/solidchain-tech/badge-buddy-processor/commit/5a732b5ec63b48f3d9aa4f03f13cee7b332e6b8d))

### [0.0.11-1](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.11-0...v0.0.11-1) (2023-08-29)


### Bug Fixes

* bump @solidchain/badge-buddy-common -> 0.1.3-3 ([be21e14](https://github.com/solidchain-tech/badge-buddy-processor/commit/be21e142409833e6569e0ba6375a4ca30251479f))


### Refactor

* remove github action dep for package.json ([bfb5127](https://github.com/solidchain-tech/badge-buddy-processor/commit/bfb5127fe1d917272a1debc2d9d195ca069771b8))

### [0.0.11-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.10...v0.0.11-0) (2023-08-28)


### Features

* complete processing for start and end event ([1fd1080](https://github.com/solidchain-tech/badge-buddy-processor/commit/1fd1080d00d3ed317082d6d9493fb6dc4412a9da))

### [0.0.10](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.9...v0.0.10) (2023-08-28)


### Bug Fixes

* discord keys ([59f3b02](https://github.com/solidchain-tech/badge-buddy-processor/commit/59f3b020ab0aeb4b544328902a54f86520026c24))

### [0.0.10-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.9...v0.0.10-0) (2023-08-28)


### Bug Fixes

* discord keys ([59f3b02](https://github.com/solidchain-tech/badge-buddy-processor/commit/59f3b020ab0aeb4b544328902a54f86520026c24))

### [0.0.9](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.8...v0.0.9) (2023-08-28)


### Bug Fixes

* prod workflow, remove specific tag in docker push tag command ([7643fe3](https://github.com/solidchain-tech/badge-buddy-processor/commit/7643fe32156851606edf569bfa98668bb1b772dd))

### [0.0.9-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.8...v0.0.9-0) (2023-08-28)


### Bug Fixes

* prod workflow, remove specific tag in docker push tag command ([7643fe3](https://github.com/solidchain-tech/badge-buddy-processor/commit/7643fe32156851606edf569bfa98668bb1b772dd))

### [0.0.8](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.7...v0.0.8) (2023-08-28)


### Bug Fixes

* manually docker push all tags ([add3302](https://github.com/solidchain-tech/badge-buddy-processor/commit/add3302283a28f866da74e6b5e472738c27566a1))

### [0.0.8-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.7...v0.0.8-0) (2023-08-28)


### Bug Fixes

* manually docker push all tags ([add3302](https://github.com/solidchain-tech/badge-buddy-processor/commit/add3302283a28f866da74e6b5e472738c27566a1))

### [0.0.7](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.6...v0.0.7) (2023-08-28)


### Features

* partial processing for end event ([c120ff5](https://github.com/solidchain-tech/badge-buddy-processor/commit/c120ff5eb07013081d59c0a6bd9a3b724e77d41a))
* processing for start event ([0e50a25](https://github.com/solidchain-tech/badge-buddy-processor/commit/0e50a25e6f2e0a8a1def932b73d58e08fc0d00cf))


### Bug Fixes

* add missing standard-version package.json field ([1f0b326](https://github.com/solidchain-tech/badge-buddy-processor/commit/1f0b3261962ea751ea02401934ab16635369e2b5))
* add release.md and changes.md .gitignore ([e9710bd](https://github.com/solidchain-tech/badge-buddy-processor/commit/e9710bdcc6408043faa572aa96dbc4dbdc2e87c5))
* github var ([fc93fc8](https://github.com/solidchain-tech/badge-buddy-processor/commit/fc93fc83c60d3b73760b382ad32f75e7fbe64aa4))
* reog staging and prod workflow ([4c730e2](https://github.com/solidchain-tech/badge-buddy-processor/commit/4c730e289a187ec4b1838b1d354351c0adcb8346))
* try push directly instead of load in workflow prod ([d7a46c1](https://github.com/solidchain-tech/badge-buddy-processor/commit/d7a46c18e92ae24ac37e6451c34353c432a1f1f8))


### Docs

* **participants:** add not entry ([ac45f2c](https://github.com/solidchain-tech/badge-buddy-processor/commit/ac45f2c18c730985fa8e30588cdafd19dbf55763))


### Refactor

* add logging to start processing ([5007923](https://github.com/solidchain-tech/badge-buddy-processor/commit/500792337372a3eef81644abe0f5d5ffd41e0339))


### Performance

* update to node 20.5.1 and pnpm 8.7.0 ([a5b3411](https://github.com/solidchain-tech/badge-buddy-processor/commit/a5b341103a0ad501e641f9d90f1b42274275756e))
* upgrade node + pnpm version, enhance workflow staging notes ([5df5006](https://github.com/solidchain-tech/badge-buddy-processor/commit/5df500680cd0bd17368fdaec843a106eaad41b1e))

### [0.0.7-2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.7-1...v0.0.7-2) (2023-08-28)


### Bug Fixes

* github var ([fc93fc8](https://github.com/solidchain-tech/badge-buddy-processor/commit/fc93fc83c60d3b73760b382ad32f75e7fbe64aa4))

### [0.0.7-1](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.7-0...v0.0.7-1) (2023-08-28)


### Bug Fixes

* try push directly instead of load in workflow prod ([d7a46c1](https://github.com/solidchain-tech/badge-buddy-processor/commit/d7a46c18e92ae24ac37e6451c34353c432a1f1f8))

### [0.0.7-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.6...v0.0.7-0) (2023-08-28)


### Features

* partial processing for end event ([c120ff5](https://github.com/solidchain-tech/badge-buddy-processor/commit/c120ff5eb07013081d59c0a6bd9a3b724e77d41a))
* processing for start event ([0e50a25](https://github.com/solidchain-tech/badge-buddy-processor/commit/0e50a25e6f2e0a8a1def932b73d58e08fc0d00cf))


### Bug Fixes

* add missing standard-version package.json field ([1f0b326](https://github.com/solidchain-tech/badge-buddy-processor/commit/1f0b3261962ea751ea02401934ab16635369e2b5))
* add release.md and changes.md .gitignore ([e9710bd](https://github.com/solidchain-tech/badge-buddy-processor/commit/e9710bdcc6408043faa572aa96dbc4dbdc2e87c5))
* reog staging and prod workflow ([4c730e2](https://github.com/solidchain-tech/badge-buddy-processor/commit/4c730e289a187ec4b1838b1d354351c0adcb8346))


### Docs

* **participants:** add not entry ([ac45f2c](https://github.com/solidchain-tech/badge-buddy-processor/commit/ac45f2c18c730985fa8e30588cdafd19dbf55763))


### Refactor

* add logging to start processing ([5007923](https://github.com/solidchain-tech/badge-buddy-processor/commit/500792337372a3eef81644abe0f5d5ffd41e0339))


### Performance

* update to node 20.5.1 and pnpm 8.7.0 ([a5b3411](https://github.com/solidchain-tech/badge-buddy-processor/commit/a5b341103a0ad501e641f9d90f1b42274275756e))
* upgrade node + pnpm version, enhance workflow staging notes ([5df5006](https://github.com/solidchain-tech/badge-buddy-processor/commit/5df500680cd0bd17368fdaec843a106eaad41b1e))

### [0.0.6](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5...v0.0.6) (2023-08-23)


### Bug Fixes

* use --prerelease ([54cb662](https://github.com/solidchain-tech/badge-buddy-processor/commit/54cb662214e94b4f9aaf228572c2bd3523ceb94e))

### [0.0.6-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5...v0.0.6-0) (2023-08-23)


### Bug Fixes

* use --prerelease ([54cb662](https://github.com/solidchain-tech/badge-buddy-processor/commit/54cb662214e94b4f9aaf228572c2bd3523ceb94e))

### [0.0.5](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.4...v0.0.5) (2023-08-22)


### Bug Fixes

* add missing pnpm step ([c0507c4](https://github.com/solidchain-tech/badge-buddy-processor/commit/c0507c46cc4172af341f9ae56bda9d4f8c5cfba8))
* include zip step ([09af09b](https://github.com/solidchain-tech/badge-buddy-processor/commit/09af09b31ca40316dfe3864276861782c10e25d7))
* move some deps to peerDeps ([acf6276](https://github.com/solidchain-tech/badge-buddy-processor/commit/acf6276c7ecf5d049e7d3ab1a6f491a1781eb0ad))
* remove port ([7bbd6f6](https://github.com/solidchain-tech/badge-buddy-processor/commit/7bbd6f60165944346fabe658d854dd01808d1a17))
* reverse frozen lock args ([2d01761](https://github.com/solidchain-tech/badge-buddy-processor/commit/2d01761fbb8b01a7ab6b522eb2be9c529b5cede8))
* sync deps in package.json ([b83a4db](https://github.com/solidchain-tech/badge-buddy-processor/commit/b83a4db9fe871c83c15d0c18e7777ae45d36cc36))
* type in release.md ([9054b25](https://github.com/solidchain-tech/badge-buddy-processor/commit/9054b253b7b607c1cd943a074ae8349d6d33f1ab))
* use correct @solidchain/badge-buddy-common ([ad33334](https://github.com/solidchain-tech/badge-buddy-processor/commit/ad333348e665518810e6a33953cad054db811173))

### [0.0.5-6](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-5...v0.0.5-6) (2023-08-22)


### Bug Fixes

* type in release.md ([9054b25](https://github.com/solidchain-tech/badge-buddy-processor/commit/9054b253b7b607c1cd943a074ae8349d6d33f1ab))

### [0.0.5-5](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-4...v0.0.5-5) (2023-08-22)

### [0.0.5-4](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-3...v0.0.5-4) (2023-08-22)

### [0.0.5-3](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-2...v0.0.5-3) (2023-08-22)


### Bug Fixes

* reverse frozen lock args ([2d01761](https://github.com/solidchain-tech/badge-buddy-processor/commit/2d01761fbb8b01a7ab6b522eb2be9c529b5cede8))

### [0.0.5-2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-1...v0.0.5-2) (2023-08-22)


### Bug Fixes

* add missing pnpm step ([c0507c4](https://github.com/solidchain-tech/badge-buddy-processor/commit/c0507c46cc4172af341f9ae56bda9d4f8c5cfba8))
* include zip step ([09af09b](https://github.com/solidchain-tech/badge-buddy-processor/commit/09af09b31ca40316dfe3864276861782c10e25d7))

### [0.0.5-1](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.5-0...v0.0.5-1) (2023-08-22)


### Bug Fixes

* use correct @solidchain/badge-buddy-common ([ad33334](https://github.com/solidchain-tech/badge-buddy-processor/commit/ad333348e665518810e6a33953cad054db811173))

### [0.0.5-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.4...v0.0.5-0) (2023-08-20)


### Bug Fixes

* move some deps to peerDeps ([acf6276](https://github.com/solidchain-tech/badge-buddy-processor/commit/acf6276c7ecf5d049e7d3ab1a6f491a1781eb0ad))
* remove port ([7bbd6f6](https://github.com/solidchain-tech/badge-buddy-processor/commit/7bbd6f60165944346fabe658d854dd01808d1a17))
* sync deps in package.json ([b83a4db](https://github.com/solidchain-tech/badge-buddy-processor/commit/b83a4db9fe871c83c15d0c18e7777ae45d36cc36))

### [0.0.4](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.4-2...v0.0.4) (2023-08-18)

### [0.0.4-2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.4-1...v0.0.4-2) (2023-08-18)


### Bug Fixes

* set redis envs as optional ([1cfa95a](https://github.com/solidchain-tech/badge-buddy-processor/commit/1cfa95a81e26f176a3012f08cec9a1d03824b0bc))

### [0.0.4-1](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.4-0...v0.0.4-1) (2023-08-18)


### Bug Fixes

* github release only production ([39041d0](https://github.com/solidchain-tech/badge-buddy-processor/commit/39041d04653d47cf943acf169b8a291eabf48031))

### [0.0.4-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.3...v0.0.4-0) (2023-08-18)


### Bug Fixes

* optimize config files ([86cacf4](https://github.com/solidchain-tech/badge-buddy-processor/commit/86cacf4db7d240b79bcd76bb5277e338b37f786a))
* pass release to release generation ([97274c1](https://github.com/solidchain-tech/badge-buddy-processor/commit/97274c19e9e10911c9c3004a6a5d8b452e005e8f))

### [0.0.3](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.3-0...v0.0.3) (2023-08-18)

### [0.0.3-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.2...v0.0.3-0) (2023-08-18)


### Bug Fixes

* add missing prod tokens ([7df81c5](https://github.com/solidchain-tech/badge-buddy-processor/commit/7df81c5651a1a244f9502926b348d1e1be631bed))

### [0.0.2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.2-0...v0.0.2) (2023-08-18)

### [0.0.2-0](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.1...v0.0.2-0) (2023-08-18)


### Bug Fixes

* publish-deploy workflow env naming ([d0c9e10](https://github.com/solidchain-tech/badge-buddy-processor/commit/d0c9e10235fbf34ced4606ecaa424bc8638040c4))

### [0.0.1](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.1-3...v0.0.1) (2023-08-18)

### [0.0.1-3](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.1-2...v0.0.1-3) (2023-08-18)


### Bug Fixes

* rename publish-deploy workflow titles ([a94cacf](https://github.com/solidchain-tech/badge-buddy-processor/commit/a94cacff4dc5d6f9fc8ff36c85f0b16fe036f0ff))

### [0.0.1-2](https://github.com/solidchain-tech/badge-buddy-processor/compare/v0.0.1-1...v0.0.1-2) (2023-08-18)


### Bug Fixes

* remove release/main ([5d75bce](https://github.com/solidchain-tech/badge-buddy-processor/commit/5d75bce8ba678a47d229cf39a801f9b7d15e95b0))
* review workflows create-pr, publish-deploy-qa, publish-deploy ([2685016](https://github.com/solidchain-tech/badge-buddy-processor/commit/26850162cdf4f20a6a2c3070e3638eebe4718378))
* small rename of pr title ([02e22e7](https://github.com/solidchain-tech/badge-buddy-processor/commit/02e22e7e3e480180f99499705d64f0f3d16e9958))

### 0.0.1-1 (2023-08-17)


### Features

* add docker setup ([9de0366](https://github.com/solidchain-tech/badge-buddy-processor/commit/9de0366c971104d20f2a1fe1effe259ab95fb2d5))
* add processors ([f99b37b](https://github.com/solidchain-tech/badge-buddy-processor/commit/f99b37be16a12107556bd1cba8ef3d6f14d2a422))
* setup deployment ([64adbaf](https://github.com/solidchain-tech/badge-buddy-processor/commit/64adbafbf09faef44aab0460933162bb18ecd69f))


### Bug Fixes

* assign dotenv key ([87fc6ab](https://github.com/solidchain-tech/badge-buddy-processor/commit/87fc6abab19845a1161e13e7e85486e5355f91d3))
* create logger module for pino logging ([8f76b5e](https://github.com/solidchain-tech/badge-buddy-processor/commit/8f76b5ea1bc7a6081c02706f92ccb0af31709ca5))
* docker name ([054131f](https://github.com/solidchain-tech/badge-buddy-processor/commit/054131fe2f8dbceb0cda1b5d3f1588ff47a8e842))
* enhance workflows ([79b7dc7](https://github.com/solidchain-tech/badge-buddy-processor/commit/79b7dc73a9ea4f05c3275c52a9e64ed0fc53a83c))
* export CommonPinoLogger ([035fc3e](https://github.com/solidchain-tech/badge-buddy-processor/commit/035fc3e746bfae969bc9b6ab20430143df6e8acd))
* fetch tags ([d18c0f5](https://github.com/solidchain-tech/badge-buddy-processor/commit/d18c0f5e3ecc3ef6398224b6e9e47c274d0c0298))
* finalize create-pr.yml ([c73e4af](https://github.com/solidchain-tech/badge-buddy-processor/commit/c73e4afafd602ed93e2b4512aab32ccdde7ae4e1))
* fix docker tag variable for create-pr.yml ([e80d7d5](https://github.com/solidchain-tech/badge-buddy-processor/commit/e80d7d5e3f70ebeadd6c5fb5601e8831fa3177c9))
* nvm ([7d081e2](https://github.com/solidchain-tech/badge-buddy-processor/commit/7d081e2b925aef24d9d4f97a70ac70eb44007fd3))
* only pass DOTENV_KEY in workflow ([22dfe1b](https://github.com/solidchain-tech/badge-buddy-processor/commit/22dfe1b201d8c2fa7254ac996a366420fd8e23c5))
* organize code ([49fc493](https://github.com/solidchain-tech/badge-buddy-processor/commit/49fc493a8fb90bb586675391444e7bd9404f0527))
* remove build args ([04abee3](https://github.com/solidchain-tech/badge-buddy-processor/commit/04abee3ffc425bfd7bfba27a62abbc8d4a9a621f))
* remove handlebars in workflow ([77e3d91](https://github.com/solidchain-tech/badge-buddy-processor/commit/77e3d91361cb41b84b956f0200b4ff3be1b73750))
* remove pipe for tags ([2b1740a](https://github.com/solidchain-tech/badge-buddy-processor/commit/2b1740acf43c0cc0fdc0eeb2e2e4932c3402994a))
* try additional needs entry ([677f8d0](https://github.com/solidchain-tech/badge-buddy-processor/commit/677f8d044cfd88703e7bc7b1d64a2890e2e7a88d))
* try using scp of appleboy ([b90575f](https://github.com/solidchain-tech/badge-buddy-processor/commit/b90575f22127f5ecbc4bc1553dff078c9afcc945))
* update .env.vault ([061b518](https://github.com/solidchain-tech/badge-buddy-processor/commit/061b51861a75a911b7cb8a499ac52d98e59afe22))
* use enhanced pino logging service ([bea3f2b](https://github.com/solidchain-tech/badge-buddy-processor/commit/bea3f2b4dd8595f130d1736ece04bb239e6612a2))
* wrap all of tags in single double quotes ([1e35ddd](https://github.com/solidchain-tech/badge-buddy-processor/commit/1e35ddd542d4cb7aa638bcaa8bb1d12c220b4ea0))
* wrap tags field in double quotes ([827ef6c](https://github.com/solidchain-tech/badge-buddy-processor/commit/827ef6cb6bd39aca72284dea8c1b19092a75f045))
