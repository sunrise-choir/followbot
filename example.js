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
  // sbot.publish({
  //   type: 'test',
  //   text: 'HELLO FROM FOLLOWBOT!'
  // }, (err, msg) => {
  //   console.log(err, msg)
  // })
  pull(
    sbot.createLogStream({reverse: true, limit: 10}),
    pull.drain(msg => console.log(msg))
  )
})
