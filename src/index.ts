import { createHash } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'
import { readdir, readFile, writeFile, unlink } from 'fs'
import lockfile = require('lockfile')
import mkdirp = require('mkdirp')

/**
 * Create a cache interface for files.
 */
class FsCache <T> {
  directory: string
  trimInterval: number
  timer: NodeJS.Timer | undefined
  expires: { [path: string]: number } = {}

  constructor (options: FsCache.Options<T> = {}) {
    this.directory = options.directory || join(tmpdir(), 'catbox-fs')
    this.trimInterval = options.trimInterval || 30000 // 30 secs.
  }

  start (cb: (err?: Error) => void) {
    return mkdirp(this.directory, (err) => {
      if (err) {
        return cb(err)
      }

      this.timer = setInterval(() => this.clear(), this.trimInterval)

      return cb()
    })
  }

  stop () {
    if (this.timer) {
      clearInterval(this.timer)

      this.timer = undefined
    }
  }

  clear () {
    return readdir(this.directory, (err, files) => {
      if (err) {
        return
      }

      const now = Date.now()
      const oldExpires = this.expires

      // Reset the expiration object to automatically trim unlinked files
      // controlled by a different `catbox-fs` instance.
      this.expires = {}

      // Execute every callback to handle trimming all entries.
      const trim = (path: string, expiration: number) => {
        // Update the expiration date or set it for a future attempt.
        if (expiration < now) {
          this.unlink(path, () => undefined)
        } else {
          this.expires[path] = expiration
        }
      }

      files.forEach((file) => {
        const path = join(this.directory, file)

        // Skip known file expiration.
        if (oldExpires[path]) {
          return trim(path, oldExpires[path])
        }

        return readFile(path, 'utf8', (err, data) => {
          if (err) {
            return
          }

          try {
            const result = JSON.parse(data)

            return trim(path, result.stored + this.toTtl(result.ttl))
          } catch (e) { /* Ignore errors. */ }
        })
      })
    })
  }

  validateSegmentName (name: string): Error | null {
     if (!name) {
       return new TypeError('Empty string')
     }

     return null
  }

  toCachePath (key: FsCache.Key) {
    return join(this.directory, this.encodeFileName(`${key.segment}!${key.id}`))
  }

  encodeFileName (name: string) {
    return createHash('sha512').update(name).digest('hex')
  }

  toTtl (value: number) {
    return typeof value === 'number' ? value : Infinity
  }

  isReady () {
    return !!this.timer
  }

  get (key: FsCache.Key, cb: (err: Error | null, value: FsCache.Result<T> | null) => void) {
    const path = this.toCachePath(key)

    return lockfile.lock(`${path}.lock`, (err) => {
      if (err) {
        return cb(err, null)
      }

      return readFile(path, 'utf8', (err, data) => {
        return lockfile.unlock(`${path}.lock`, (lockErr) => {
          if (err) {
            if (err.code === 'ENOENT') {
              return cb(lockErr, null)
            }

            return cb(err, null)
          }

          try {
            const result = JSON.parse(data)

            return cb(lockErr, {
              item: result.item,
              ttl: this.toTtl(result.ttl),
              stored: result.stored
            })
          } catch (e) {
            return cb(e, null)
          }
        })
      })
    })
  }

  set (key: FsCache.Key, item: T, ttl: number, cb: (err?: Error | null) => void) {
    const path = this.toCachePath(key)
    const stored = Date.now()

    return lockfile.lock(`${path}.lock`, (err) => {
      if (err) {
        return cb(err)
      }

      try {
        const data = JSON.stringify({ item, ttl, stored })

        return writeFile(path, data, (err) => {
          if (!err) {
            this.expires[path] = stored + ttl
          }

          return lockfile.unlock(`${path}.lock`, (lockErr) => {
            return cb(err || lockErr)
          })
        })
      } catch (e) {
        return cb(e)
      }
    })
  }

  drop (key: FsCache.Key, cb: (err?: Error | null) => void) {
    const path = this.toCachePath(key)

    return this.unlink(path, cb)
  }

  unlink (path: string, cb: (err?: Error | null) => void) {
    return unlink(path, (err) => {
      delete this.expires[path]

      if (err && err.code !== 'ENOENT') {
        return cb(err)
      }

      return cb()
    })
  }
}

namespace FsCache {
  export interface Options <T> {
    directory?: string
    trimInterval?: number
  }

  export interface Result <T> {
    item: T
    stored: number
    ttl: number
  }

  export interface Key {
    segment: string
    id: string
  }
}

export = FsCache
