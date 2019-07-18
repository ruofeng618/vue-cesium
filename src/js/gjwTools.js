/**
 * @author HpuGIS
 * time 2019
 * https://blog.csdn.net/weixin_40184249
 * qq/wx:1506069345
 */
import Cesium from 'cesium/Cesium'
export default class GJWTools {
// 私有静态方法
  static _AddCircleScanPostStage (viewer, cartographicCenter, maxRadius, scanColor, duration) {
    var ScanSegmentShader =
            'uniform sampler2D colorTexture;\n' +
            'uniform sampler2D depthTexture;\n' +
            'varying vec2 v_textureCoordinates;\n' +
            'uniform vec4 u_scanCenterEC;\n' +
            'uniform vec3 u_scanPlaneNormalEC;\n' +
            'uniform float u_radius;\n' +
            'uniform vec4 u_scanColor;\n' +
            'vec4 toEye(in vec2 uv, in float depth)\n' +
            ' {\n' +
            ' vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n' +
            ' vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n' +
            ' posInCamera =posInCamera / posInCamera.w;\n' +
            ' return posInCamera;\n' +
            ' }\n' +
            'vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n' +
            '{\n' +
            'vec3 v01 = point -planeOrigin;\n' +
            'float d = dot(planeNormal, v01) ;\n' +
            'return (point - planeNormal * d);\n' +
            '}\n' +
            'float getDepth(in vec4 depth)\n' +
            '{\n' +
            'float z_window = czm_unpackDepth(depth);\n' +
            'z_window = czm_reverseLogDepth(z_window);\n' +
            'float n_range = czm_depthRange.near;\n' +
            'float f_range = czm_depthRange.far;\n' +
            'return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n' +
            '}\n' +
            'void main()\n' +
            '{\n' +
            'gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n' +
            'float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));\n' +
            'vec4 viewPos = toEye(v_textureCoordinates, depth);\n' +
            'vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n' +
            'float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n' +
            'if(dis < u_radius)\n' +
            '{\n' +
            'float f = 1.0 -abs(u_radius - dis) / u_radius;\n' +
            'f = pow(f, 4.0);\n' +
            'gl_FragColor = mix(gl_FragColor, u_scanColor, f);\n' +
            '}\n' +
            '}\n'

    var _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter)
    var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1)
    var _CartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500)
    var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1)
    var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1)
    var _time = (new Date()).getTime()
    var _scratchCartesian4Center = new Cesium.Cartesian4()
    var _scratchCartesian4Center1 = new Cesium.Cartesian4()
    var _scratchCartesian3Normal = new Cesium.Cartesian3()
    var ScanPostStage = new Cesium.PostProcessStage({
      fragmentShader: ScanSegmentShader,
      uniforms: {
        u_scanCenterEC: function () {
          return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
        },
        u_scanPlaneNormalEC: function () {
          var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
          var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1)
          _scratchCartesian3Normal.x = temp1.x - temp.x
          _scratchCartesian3Normal.y = temp1.y - temp.y
          _scratchCartesian3Normal.z = temp1.z - temp.z
          Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal)
          return _scratchCartesian3Normal
        },
        u_radius: function () {
          return maxRadius * (((new Date()).getTime() - _time) % duration) / duration
        },
        u_scanColor: scanColor
      }
    })
    viewer.scene.postProcessStages.add(ScanPostStage)
    return (ScanPostStage)
  }
  // 圆形扩大扫描圈
  static addCircleScan (viewer, data) {
    viewer.scene.globe.depthTestAgainstTerrain = true // 防止移动、放大缩小会视觉偏移depthTestAgainstTerrain // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。
    var CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(data.lon), Cesium.Math.toRadians(data.lat), 0) // 中心位子
    return this._AddCircleScanPostStage(viewer, CartographicCenter, data.r, data.scanColor, data.interval)
  }
  static _AddRadarScanPostStage (viewer, cartographicCenter, radius, scanColor, duration) {
    var ScanSegmentShader =
        'uniform sampler2D colorTexture;\n' +
        'uniform sampler2D depthTexture;\n' +
        'varying vec2 v_textureCoordinates;\n' +
        'uniform vec4 u_scanCenterEC;\n' +
        'uniform vec3 u_scanPlaneNormalEC;\n' +
        'uniform vec3 u_scanLineNormalEC;\n' +
        'uniform float u_radius;\n' +
        'uniform vec4 u_scanColor;\n' +
        'vec4 toEye(in vec2 uv, in float depth)\n' +
        ' {\n' +
        ' vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n' +
        ' vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n' +
        ' posInCamera =posInCamera / posInCamera.w;\n' +
        ' return posInCamera;\n' +
        ' }\n' +
        'bool isPointOnLineRight(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n' +
        '{\n' +
        'vec3 v01 = testPt - ptOnLine;\n' +
        'normalize(v01);\n' +
        'vec3 temp = cross(v01, lineNormal);\n' +
        'float d = dot(temp, u_scanPlaneNormalEC);\n' +
        'return d > 0.5;\n' +
        '}\n' +
        'vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n' +
        '{\n' +
        'vec3 v01 = point -planeOrigin;\n' +
        'float d = dot(planeNormal, v01) ;\n' +
        'return (point - planeNormal * d);\n' +
        '}\n' +
        'float distancePointToLine(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n' +
        '{\n' +
        'vec3 tempPt = pointProjectOnPlane(lineNormal, ptOnLine, testPt);\n' +
        'return length(tempPt - ptOnLine);\n' +
        '}\n' +
        'float getDepth(in vec4 depth)\n' +
        '{\n' +
        'float z_window = czm_unpackDepth(depth);\n' +
        'z_window = czm_reverseLogDepth(z_window);\n' +
        'float n_range = czm_depthRange.near;\n' +
        'float f_range = czm_depthRange.far;\n' +
        'return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n' +
        '}\n' +
        'void main()\n' +
        '{\n' +
        'gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n' +
        'float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));\n' +
        'vec4 viewPos = toEye(v_textureCoordinates, depth);\n' +
        'vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n' +
        'float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n' +
        'float twou_radius = u_radius * 2.0;\n' +
        'if(dis < u_radius)\n' +
        '{\n' +
        'float f0 = 1.0 -abs(u_radius - dis) / u_radius;\n' +
        'f0 = pow(f0, 64.0);\n' +
        'vec3 lineEndPt = vec3(u_scanCenterEC.xyz) + u_scanLineNormalEC * u_radius;\n' +
        'float f = 0.0;\n' +
        'if(isPointOnLineRight(u_scanCenterEC.xyz, u_scanLineNormalEC.xyz, prjOnPlane.xyz))\n' +
        '{\n' +
        'float dis1= length(prjOnPlane.xyz - lineEndPt);\n' +
        'f = abs(twou_radius -dis1) / twou_radius;\n' +
        'f = pow(f, 3.0);\n' +
        '}\n' +
        'gl_FragColor = mix(gl_FragColor, u_scanColor, f + f0);\n' +
        '}\n' +
        '}\n'

    var _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter)
    var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1)
    var _CartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500)
    var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1)
    var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1)
    var _CartographicCenter2 = new Cesium.Cartographic(cartographicCenter.longitude + Cesium.Math.toRadians(0.001), cartographicCenter.latitude, cartographicCenter.height)
    var _Cartesian3Center2 = Cesium.Cartographic.toCartesian(_CartographicCenter2)
    var _Cartesian4Center2 = new Cesium.Cartesian4(_Cartesian3Center2.x, _Cartesian3Center2.y, _Cartesian3Center2.z, 1)
    var _RotateQ = new Cesium.Quaternion()
    var _RotateM = new Cesium.Matrix3()
    var _time = (new Date()).getTime()
    var _scratchCartesian4Center = new Cesium.Cartesian4()
    var _scratchCartesian4Center1 = new Cesium.Cartesian4()
    var _scratchCartesian4Center2 = new Cesium.Cartesian4()
    var _scratchCartesian3Normal = new Cesium.Cartesian3()
    var _scratchCartesian3Normal1 = new Cesium.Cartesian3()
    var ScanPostStage = new Cesium.PostProcessStage({
      fragmentShader: ScanSegmentShader,
      uniforms: {
        u_scanCenterEC: function () {
          return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
        },
        u_scanPlaneNormalEC: function () {
          var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
          var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1)
          _scratchCartesian3Normal.x = temp1.x - temp.x
          _scratchCartesian3Normal.y = temp1.y - temp.y
          _scratchCartesian3Normal.z = temp1.z - temp.z
          Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal)
          return _scratchCartesian3Normal
        },
        u_radius: radius,
        u_scanLineNormalEC: function () {
          var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
          var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1)
          var temp2 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center2, _scratchCartesian4Center2)
          _scratchCartesian3Normal.x = temp1.x - temp.x
          _scratchCartesian3Normal.y = temp1.y - temp.y
          _scratchCartesian3Normal.z = temp1.z - temp.z
          Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal)
          _scratchCartesian3Normal1.x = temp2.x - temp.x
          _scratchCartesian3Normal1.y = temp2.y - temp.y
          _scratchCartesian3Normal1.z = temp2.z - temp.z
          var tempTime = (((new Date()).getTime() - _time) % duration) / duration
          Cesium.Quaternion.fromAxisAngle(_scratchCartesian3Normal, tempTime * Cesium.Math.PI * 2, _RotateQ)
          Cesium.Matrix3.fromQuaternion(_RotateQ, _RotateM)
          Cesium.Matrix3.multiplyByVector(_RotateM, _scratchCartesian3Normal1, _scratchCartesian3Normal1)
          Cesium.Cartesian3.normalize(_scratchCartesian3Normal1, _scratchCartesian3Normal1)
          return _scratchCartesian3Normal1
        },
        u_scanColor: scanColor
      }
    })
    viewer.scene.postProcessStages.add(ScanPostStage)
    return (ScanPostStage)
  }
  // 区域雷达扫描
  static addRadarScan (viewer, data) {
    viewer.scene.globe.depthTestAgainstTerrain = true // 防止移动、放大缩小会视觉偏移depthTestAgainstTerrain // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。
    var CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(data.lon), Cesium.Math.toRadians(data.lat), 0) // 中心位子
    return this._AddRadarScanPostStage(viewer, CartographicCenter, data.r, data.scanColor, data.interval)
  }
  // 两个圆扩散纹理
  static addCircleRipple (viewer, data) {
    let r1 = data.minR
    let r2 = data.minR
    function changeR1 () { // 这是callback，参数不能内传
      r1 = r1 + data.deviationR
      console.log(r1)
      if (r1 >= data.maxR) {
        r1 = data.minR
      }

      return r1
    }
    function getR1 () {
      return r1
    }
    function changeR2 () {
      r2 = r2 + data.deviationR
      if (r2 >= data.maxR) {
        r2 = data.minR
      }
      return r2
    }
    function getR2 () {
      return r2
    }
    viewer.entities.add({
      id: data.id,
      name: '',
      position: Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.height),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(changeR1, false),
        semiMinorAxis: new Cesium.CallbackProperty(getR1, false),
        height: data.height,
        material: new Cesium.ImageMaterialProperty({
          image: data.imageUrl,
          repeat: new Cesium.Cartesian2(1.0, 1.0),
          transparent: true,
          color: new Cesium.CallbackProperty(function () {
            var alp = 1 - r1 / data.maxR
            return Cesium.Color.WHITE.withAlpha(alp) // entity的颜色透明 并不影响材质，并且 entity也会透明哦
          }, false)
        })
      }
    })
    setTimeout(function () {
      viewer.entities.add({
        name: '',
        position: Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.height),
        ellipse: {
          semiMinorAxis: new Cesium.CallbackProperty(getR2, false),
          semiMajorAxis: new Cesium.CallbackProperty(changeR2, false),
          height: data.height,
          material: new Cesium.ImageMaterialProperty({
            image: data.imageUrl,
            repeat: new Cesium.Cartesian2(1.0, 1.0),
            transparent: true,
            color: new Cesium.CallbackProperty(function () {
              var alp = 1
              alp = 1 - r2 / data.maxR
              return Cesium.Color.WHITE.withAlpha(alp)
            }, false)
          })
        }
      })
    }, data.eachInterval)
  }
}
