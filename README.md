# followbot - experimental ssb-server nesting

Start an `ssb-server` on top of another `ssb-server` (sbot). 

Specify a different `appname` and `port` to run on. Will wrap the default ssb-server. You can now choose which custom plugins and flumeviews you want to run.

**DANGER: VERY EXPERIMENTAL AND A MASSIVE HACK RIGHT NOW**

Context: [Consensus Free Scuttlestack](https://github.com/sunrise-choir/meta/blob/master/newsletters/2019-02-01.md#matt-a-consensus-free-scuttlestack-lessbot)

```js
var followbot = require('./')
var pull = require('pull-stream')

followbot('ssb-followtest', {
  config: {
    port: 48008,
    ws: {
      port: 48989
    }
  },
  rootAppName: 'ssb',
  plugins: [
    require('ssb-server/plugins/unix-socket'),
    require('ssb-server/plugins/no-auth'),
    require('ssb-server/plugins/master'),
    // require('ssb-friends'),
    require('ssb-server/plugins/logging'),
    require('ssb-query'),
    require('ssb-ws')
  ]
}, (err, sbot) => {
  if (err) throw err
  console.log('server started')

  // publish via root scuttlebot
  sbot.publish({
    type: 'test',
    text: 'HELLO FROM FOLLOWBOT!'
  }, (err, msg) => {
    console.log(err, msg)
  })

  // read from log.offset file directly in process (not via muxrpc)
  pull(
    sbot.createLogStream({reverse: true, limit: 10}),
    pull.drain(msg => console.log(msg))
  )
})
```