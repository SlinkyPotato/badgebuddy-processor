├ù skip version bump on first release
ΓêÜ outputting changes to CHANGELOG.md

---
## [1.0.0](https://github.com/SlinkyPotato/badge-buddy/compare/v0.0.10...v1.0.0) (2024-07-03)


### Features

* add auth-api interceptors ([8a377a0](https://github.com/SlinkyPotato/badge-buddy/commit/8a377a0a54552afd9159c519979b4df9bc2f22ab))
* add cron-job service ([fbd0cee](https://github.com/SlinkyPotato/badge-buddy/commit/fbd0ceef81a45c2becc3db7fb5f5150b752acf69))
* complete processing for start and end event ([1fd1080](https://github.com/SlinkyPotato/badge-buddy/commit/1fd1080d00d3ed317082d6d9493fb6dc4412a9da))
* handle event tracking impl ([cbbc8ce](https://github.com/SlinkyPotato/badge-buddy/commit/cbbc8ce06722442af1a1a5b7de199f4509d8cad2))
* integrate auth request interceptor ([761fb3b](https://github.com/SlinkyPotato/badge-buddy/commit/761fb3b0eaced4d03adf244ea0d73d71618fa3ae))


### Bug Fixes

* add jest.config.ts to ts exclude ([d0672f3](https://github.com/SlinkyPotato/badge-buddy/commit/d0672f3517bc885c9660a4efd1d4861d4b662a5f))
* bump @solidchain/badge-buddy-common -> 0.1.3-3 ([be21e14](https://github.com/SlinkyPotato/badge-buddy/commit/be21e142409833e6569e0ba6375a4ca30251479f))
* class-validator and class-transformer placement ([65e0060](https://github.com/SlinkyPotato/badge-buddy/commit/65e0060ba3273b51b6c8b8cd07e13fa065a3a054))
* discord bot tokens ([14ef5b3](https://github.com/SlinkyPotato/badge-buddy/commit/14ef5b3f9fde5c0f591ebf57f66c16f195f4a60c))
* docker build ([58f2946](https://github.com/SlinkyPotato/badge-buddy/commit/58f294684a86dba3a6b5e733a16a61e0f4665fc5))
* env name for badge_buddy_host ([c20b4c0](https://github.com/SlinkyPotato/badge-buddy/commit/c20b4c092a31a25154400d5646b58826debf955e))
* gh actions ([15494f0](https://github.com/SlinkyPotato/badge-buddy/commit/15494f09585ebd2280701fc349527332511e4e85))
* insert participant in db ([ddaedbf](https://github.com/SlinkyPotato/badge-buddy/commit/ddaedbf4604ce61df55cc6b19d94f3414f9375ef))
* remove turbo ([ac2036a](https://github.com/SlinkyPotato/badge-buddy/commit/ac2036a97bde010a8a6ddea55eca9794c1fd3406))
* set redis host as optional ([38447e8](https://github.com/SlinkyPotato/badge-buddy/commit/38447e84e38411396b0c69b1ab3fe309084f6172))
* use next @solidchain/badge-buddy-common ([a2ae2ec](https://github.com/SlinkyPotato/badge-buddy/commit/a2ae2ec4b0b91de6e9202111738af8a7d8a6a914))


### Docs

* rename participants.md heading ([65e5c96](https://github.com/SlinkyPotato/badge-buddy/commit/65e5c9654fc784d40bb0dc994a65809d7a886c40))


### Tests

* add basic jest cases for EventsProcessor.start ([5e7d45d](https://github.com/SlinkyPotato/badge-buddy/commit/5e7d45d8b74f83f987d89dc7deeba1570c0f0788))
* add coverage for community-events-queue.service.ts ([3950971](https://github.com/SlinkyPotato/badge-buddy/commit/39509717140e94b6bf158606ac32593f411c6a62))
* add first test for event-tracking.service.ts ([32ee90f](https://github.com/SlinkyPotato/badge-buddy/commit/32ee90fe9cbd875808723c16edc96eef7c97c6e3))
* add full test coverage for event-tracking.service.ts ([8744e9f](https://github.com/SlinkyPotato/badge-buddy/commit/8744e9f18814939bc3c70a20bbac44a7f84b3dbf))
* add full test coverage for EventsProcessorService ([1ad67df](https://github.com/SlinkyPotato/badge-buddy/commit/1ad67dfcf87fb5167b6a893cc128b03577b200e1))
* add test for hopping active events ([ae582d8](https://github.com/SlinkyPotato/badge-buddy/commit/ae582d87ddf85f8dff7c48f2dfb355af8cf1f959))
* add test:cov to staging and production ([e1030da](https://github.com/SlinkyPotato/badge-buddy/commit/e1030da0a07cf1a42bfeec13df4e5a14ddb5a55e))
* add tests and add conditions check ([9f15108](https://github.com/SlinkyPotato/badge-buddy/commit/9f151083b2b2c3d7dfa4f9f1000da6a79af8f5d1))
* finish start event tests ([caa1a43](https://github.com/SlinkyPotato/badge-buddy/commit/caa1a43ab7f7a424ce8d76e7d84a08b79f479231))
* finish voice-state-update spec units ([e08c286](https://github.com/SlinkyPotato/badge-buddy/commit/e08c286d33f6d30a1cf7c17ebb45837e2cf02e09))
* fix start job tests ([3ab43fd](https://github.com/SlinkyPotato/badge-buddy/commit/3ab43fd53579c5fa1534495773afac7218b65ac5))


### Performance

* enhance dockerfile steps ([367511e](https://github.com/SlinkyPotato/badge-buddy/commit/367511e51c033bf7872e62d869c107f5d1d1a7be))
* import @jest/globals ([9ad2d64](https://github.com/SlinkyPotato/badge-buddy/commit/9ad2d6462d6beea2aea6a163b5027d6ef6ac3c07))
* migrate build system to swc ([e8a74ae](https://github.com/SlinkyPotato/badge-buddy/commit/e8a74ae7dc3e6034ac1e716f36e117e5f7986b6d))
* pull user from db in case not found in cache ([7ee548d](https://github.com/SlinkyPotato/badge-buddy/commit/7ee548d2c03890ebd18462beb443337e549ae909))
* remove sourcefiles for prod ([486fe10](https://github.com/SlinkyPotato/badge-buddy/commit/486fe10cacffd0818da005b9874453333f908adb))
* update deps ([b7f8329](https://github.com/SlinkyPotato/badge-buddy/commit/b7f8329db302b1299653eb1b7a748ee116d88d75))
* update deps ([5644ed3](https://github.com/SlinkyPotato/badge-buddy/commit/5644ed338ca18cc2600bd169939cf3f051878722))
* upgrade common -> 1.0.1 ([54745fc](https://github.com/SlinkyPotato/badge-buddy/commit/54745fcfa8e10a6bd4eae5ba224c01c0bdf02f33))
* upgrade deps ([5a732b5](https://github.com/SlinkyPotato/badge-buddy/commit/5a732b5ec63b48f3d9aa4f03f13cee7b332e6b8d))
* upgrade node ([ee668bb](https://github.com/SlinkyPotato/badge-buddy/commit/ee668bba655d52593b3b521948747225305f5e8e))


### Refactor

* add husky ([a2afdf0](https://github.com/SlinkyPotato/badge-buddy/commit/a2afdf0828411a8c3f476c5fd39b1876e9449e29))
* add prettier and adjust eslint ([8b83289](https://github.com/SlinkyPotato/badge-buddy/commit/8b83289da03c3ead22e4d9ad0b27abc6b69fa4be))
* add scripts and move configs ([b810eb3](https://github.com/SlinkyPotato/badge-buddy/commit/b810eb3cbe3ce0f0db6cbcd203346f3d04bb425b))
* bump node version to 20.11.1 ([f12fe3a](https://github.com/SlinkyPotato/badge-buddy/commit/f12fe3a39d43829a50dc921abcbfddd5dbacfb6e))
* import typeorm common module ([63ddd6c](https://github.com/SlinkyPotato/badge-buddy/commit/63ddd6c4ef63d8e022cde26cf60592f1b73860ad))
* migrate from mongo to mysql with typeorm ([afdb335](https://github.com/SlinkyPotato/badge-buddy/commit/afdb335f0384a844a6089891dceed3c7333098ff))
* pnpm lint ([ad7c23a](https://github.com/SlinkyPotato/badge-buddy/commit/ad7c23addcf013475651f5fa0f643ee19a29b41a))
* pnpm up ([ca7e707](https://github.com/SlinkyPotato/badge-buddy/commit/ca7e707a77dd2a48a97f670e86353c6d191d3834))
* pnpm up ([b3f109b](https://github.com/SlinkyPotato/badge-buddy/commit/b3f109b967c30b660a9c969aa5a748a43e4f3a0a))
* production pipeline ([90fe310](https://github.com/SlinkyPotato/badge-buddy/commit/90fe310ea0559084283b99f970fb238d828085c3))
* remove express dep ([63b4b6d](https://github.com/SlinkyPotato/badge-buddy/commit/63b4b6d066f8cc4136014edb8d099e943838ec9f))
* remove github action dep for package.json ([bfb5127](https://github.com/SlinkyPotato/badge-buddy/commit/bfb5127fe1d917272a1debc2d9d195ca069771b8))
* remove repository usage in queue in favor of dataSource ([c701165](https://github.com/SlinkyPotato/badge-buddy/commit/c701165376412d363a0b41e37c1e8a373d400622))
* remove unused imports ([db27147](https://github.com/SlinkyPotato/badge-buddy/commit/db27147a4b0f6a193090ca0618e923723617bd35))
* rename actions and pipeline ([57c87c4](https://github.com/SlinkyPotato/badge-buddy/commit/57c87c48f903442fce62876e33847829be41ed77))
* rename staging_server -> stage_server ([e3671f0](https://github.com/SlinkyPotato/badge-buddy/commit/e3671f01196b6e77e3b8a0c5d219f4b2ec85540d))
* rename start:docker dev:docker ([47e53d3](https://github.com/SlinkyPotato/badge-buddy/commit/47e53d361e61bf6858685ebfb8ea41580bddf030))
* set to stable typescript 5.3.3 ([327c4ea](https://github.com/SlinkyPotato/badge-buddy/commit/327c4ea4ce099ba7f01833165e4aeae0087ddf27))
* specify env requirement ([9b99e61](https://github.com/SlinkyPotato/badge-buddy/commit/9b99e618b27b7a021a6eb563636ee0afd8401f01))
* specify redis configs ([f6c69d4](https://github.com/SlinkyPotato/badge-buddy/commit/f6c69d43582e70416e212d4220e28b972d56a933))
* staging pipeline ([c7ae0d1](https://github.com/SlinkyPotato/badge-buddy/commit/c7ae0d12823ff66d029dc23fba8c1e67b40d243e))
* update @badgebuddy/common ([4b8ed4f](https://github.com/SlinkyPotato/badge-buddy/commit/4b8ed4fc8d56eb76192b18b5d3c51484723accd4))
* update deps and integrate new common ([a1d08ff](https://github.com/SlinkyPotato/badge-buddy/commit/a1d08ffe1e1e907b0b3e5bc5d0a84a75bf85379b))
* update docker compose namespace ([8c88fd2](https://github.com/SlinkyPotato/badge-buddy/commit/8c88fd228bf69ba577faf311cd45f16a5e7408da))
* update local env ([a8c8528](https://github.com/SlinkyPotato/badge-buddy/commit/a8c8528290a8851af28ede975a63728ffd77d8ce))
* update workflow to use parseReleaseUtil() ([7fded73](https://github.com/SlinkyPotato/badge-buddy/commit/7fded7341cd890ed3faf60d0b855f9fed25edc55))
* upgrade common ([fd53ca3](https://github.com/SlinkyPotato/badge-buddy/commit/fd53ca3a6f78ab7eaaa527082d7edac143de7ab2))
* use proper redis cache class ([155a5db](https://github.com/SlinkyPotato/badge-buddy/commit/155a5db6b1149506b140215b6aa98684dfa23a03))
* use vars for github actions ([56a5424](https://github.com/SlinkyPotato/badge-buddy/commit/56a5424f94047dccfdcc4d527e1c54bb0d9b3e69))
---

ΓêÜ committing CHANGELOG.md
ΓêÜ tagging release v1.0.0
i Run `git push --follow-tags origin release/dev` to publish
