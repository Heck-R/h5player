import debug from './debug'
import hookJs from '../libs/hookJs'
/**
 * 禁止对playbackRate进行锁定
 * 部分播放器会阻止修改playbackRate
 * 通过hackDefineProperty来反阻止playbackRate的修改
 * 参考： https://greasyfork.org/zh-CN/scripts/372673
 */

function hackDefineProperCore (target, key, option) {
  if (option && target && target instanceof Element && typeof key === 'string' && key.indexOf('on') >= 0) {
    option.configurable = true
  }

  if (target instanceof HTMLVideoElement) {
    const unLockProperties = ['playbackRate', 'currentTime', 'volume', 'muted']
    if (unLockProperties.includes(key)) {
      if (!option.configurable) {
        debug.log(`禁止对${key}进行锁定`)
        option.configurable = true
        key = key + '_hack'
      }
    }
  }

  return [target, key, option]
}

function hackDefineProperty () {
  hookJs.before(Object, 'defineProperty', function (args, parentObj, methodName, originMethod, execInfo, ctx) {
    const option = args[2]
    const ele = args[0]
    const key = args[1]
    const afterArgs = hackDefineProperCore(ele, key, option)
    afterArgs.forEach((arg, i) => {
      args[i] = arg
    })
  })

  hookJs.before(Object, 'defineProperties', function (args, parentObj, methodName, originMethod, execInfo, ctx) {
    const properties = args[1]
    const ele = args[0]
    if (ele && ele instanceof Element) {
      Object.keys(properties).forEach(key => {
        const option = properties[key]
        const afterArgs = hackDefineProperCore(ele, key, option)
        args[0] = afterArgs[0]
        delete properties[key]
        properties[afterArgs[1]] = afterArgs[2]
      })
    }
  })

  // const hookJsPro = hookJs.hookJsPro()
  // hookJs.before(window.EventTarget.prototype, 'addEventListener', function (args) {
  //   const type = args[0]
  //   const listener = args[1]
  //   const eventFilter = ['click', 'mouse', 'touch', 'key', 'toggle', 'change', 'reset', 'resize', 'error']
  //
  //   let isHitEventFilter = false
  //   for (let i = 0; i < eventFilter.length; i++) {
  //     const str = eventFilter[i]
  //     if (type && type.startsWith && type.startsWith(str)) {
  //       isHitEventFilter = true
  //       break
  //     }
  //   }
  //
  //   if (!listener || isHitEventFilter) {
  //     return false
  //   }
  //
  //   // debug.info('addEventListener:', type)
  // })
}

export default hackDefineProperty
