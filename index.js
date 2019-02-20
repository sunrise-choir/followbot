var SecretStack = require('secret-stack')
var SsbDB = require('ssb-db')
var SsbConfig = require('ssb-config/inject')
var SsbClient = require('ssb-client')
var caps = require('ssb-server/caps')
var Path = require('path')
var Obv = require('obv')
var fs = require('fs')
var extend = require('xtend')

module.exports = function (appName, { rootAppName = 'ssb', config, plugins = [] }, cb) {
  var since = Obv()

  console.log('---->', appName)

  var createServer = SecretStack({ caps }).use(SsbDB)

  var rootConfig = SsbConfig(rootAppName)
  var resolvedConfig = SsbConfig(appName, extend(config, {
    keys: rootConfig.keys,
    rootLogOffsetPath: Path.join(rootConfig.path, 'flume', 'log.offset')
  }))

  var manifestFile = Path.join(resolvedConfig.path, 'manifest.json')

  resolvedConfig.since = since

  SsbClient(rootConfig, function (err, rootClient) {
    if (err) return cb && cb(err)

    rootClient.manifest((err, rootManifest) => {
      if (err) return cb && cb(err)

      rootClient.status((err, status) => {
        if (err) return cb && cb(err)
        since.set(status.sync.since)

        // rootClient pass-throughs
        createServer.use({
          init: (ssb, config) => {
            ssb.publish = rootClient.publish
            ssb.blobs = rootClient.blobs
            ssb.gossip = rootClient.gossip
            ssb.replicate = rootClient.replicate
          },
          manifest: {
            blobs: rootManifest.blobs,
            gossip: rootManifest.gossip,
            replicate: rootManifest.replicate
          }
        })

        // apply plugins
        plugins.forEach(plugin => {
          createServer.use(plugin)
        })

        // create server and handle callback
        createServer.use({
          init: (ssb, config) => {
            // handle the final callback here!
            fs.writeFileSync(manifestFile, JSON.stringify(ssb.getManifest(), null, 2))
            cb(null, ssb, rootClient)
          }
        })(resolvedConfig)
      })
    })
  })
}
