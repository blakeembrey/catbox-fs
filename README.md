# Catbox FS

[![Greenkeeper badge](https://badges.greenkeeper.io/blakeembrey/catbox-fs.svg)](https://greenkeeper.io/)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Filesystem adapter for catbox

## Installation

```
npm install catbox-fs --save
```

## Options

* `trimInterval` _(number, default: 30000)_ The interval at which to trim expired cache entries from `directory`
* `directory` _(string, default: `${os.tmp()}/catbox-fs`)_ The directory where files are cached

## License

MIT

[npm-image]: https://img.shields.io/npm/v/catbox-fs.svg?style=flat
[npm-url]: https://npmjs.org/package/catbox-fs
[downloads-image]: https://img.shields.io/npm/dm/catbox-fs.svg?style=flat
[downloads-url]: https://npmjs.org/package/catbox-fs
[travis-image]: https://img.shields.io/travis/blakeembrey/catbox-fs.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/catbox-fs
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/catbox-fs.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/catbox-fs?branch=master
