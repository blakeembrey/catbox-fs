import catbox = require('catbox')
import rimraf = require('rimraf')
import FsCache = require('./index')
import { join } from 'path'

const directory = join(__dirname, '__cache__')
const trimInterval = 500

describe('catbox fs', () => {
  const store = new catbox.Client<string>(new FsCache<string>({ directory, trimInterval }))
  const cache = new catbox.Policy<string>(undefined, store, 'test')

  beforeAll((cb) => {
    return store.start(cb as () => void)
  })

  it('should be ready', () => {
    expect(cache.isReady()).toBe(true)
  })

  it('should insert into cache', (done) => {
    cache.set('test', 'test', Infinity, (err) => {
      expect(err).toBeUndefined()

      cache.get('test', (err, value) => {
        expect(value).toBe('test')

        return done && done(err)
      })
    })
  })

  it('should drop from the cache', (done) => {
    cache.drop('test', (err) => {
      expect(err).toBeUndefined()

      cache.get('test', (err, value) => {
        expect(value).toBeNull()

        return done && done(err)
      })
    })
  })

  it('should not fail dropping inknown cache item', (done) => {
    cache.drop('unknown', (err) => {
      expect(err).toBeUndefined()

      return done && done()
    })
  })

  it('should automatically clear stale items', (done) => {
    cache.set('test1', 'again1', 100, (err) => {
      expect(err).toBeUndefined()

      cache.set('test2', 'again2', 1000, (err) => {
        expect(err).toBeUndefined()

        setTimeout(
          () => {
            cache.get('test1', (err, value) => {
              expect(err).toBeNull()
              expect(value).toBeNull()

              cache.get('test2', (err, value) => {
                expect(value).toBe('again2')

                return done && done(err)
              })
            })
          },
          500
        )
      })
    })
  })

  afterAll((cb) => {
    store.stop()

    rimraf(directory, cb as () => void)
  })
})
