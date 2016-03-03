ES2015 EventEmitter3
===

This is a direct port of [EventEmitter3](https://github.com/primus/eventemitter3) to es2015. It passes the tests exactly (see Caveats below).

This aims to be a drop in replacement for 99% of use cases.

Caveats
---

Because we are now using a class instead of a prototype, [util.inherits](https://nodejs.org/docs/latest/api/util.html) now does not work. If you find a solution to this, please file a pull request.

Similarly because we are now exporting a class, the exported object is slightly different. It now does not contain proxies for `EventEmitter2` and `EventEmitter3`.

TODO
---
allow usage with `npm`, `bower`, and `component`.