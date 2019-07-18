import Cesium from 'cesium/Cesium'
export default class DrawTools {
  constructor (viewer) {
    this.activeShape = null
    this.firstPoint = null
    this.activeShapePoints = []
    this.floatingPoint = null
    this.idPotions = {}
    this.drawingMode = 'polygon'
    this.viewer = viewer
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    this.createPoint = this.createPoint.bind(this)
    this.drawShape = this.drawShape.bind(this)
    this.initHander = this.initHander.bind(this)
    this.terminateShape = this.terminateShape.bind(this)
    this.initHander('', '')
  }
  createPoint (worldPosition) {
    let point = this.viewer.entities.add({
      position: worldPosition,
      point: {
        color: Cesium.Color.WHITE,
        pixelSize: 5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
    return point
  }
  drawShape (positionData) {
    let shape
    if (this.drawingMode === 'line') {
      shape = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => { return positionData }, false),
          clampToGround: true,
          width: 3
        }
      })
    } else if (this.drawingMode === 'polygon') {
      shape = this.viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.CallbackProperty(() => { return positionData }, false),
          material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7))
        }
      })
    } else if (this.drawingMode === 'circle') {
      let start = this.activeShapePoints[0]
      let end = this.activeShapePoints[this.activeShapePoints.length - 1]
      let r = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2))
      r = r || r + 1
      shape = this.viewer.entities.add({
        position: this.activeShapePoints[0],
        name: 'Blue translucent, rotated, and extruded ellipse with outline',
        type: 'Selection tool',
        ellipse: {
          semiMinorAxis: new Cesium.CallbackProperty(function () {
            let value = typeof positionData.getValue === 'function' ? positionData.getValue(0) : positionData
            var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2))
            return r || r + 1
          }, false),
          semiMajorAxis: new Cesium.CallbackProperty(function () {
            let value = typeof positionData.getValue === 'function' ? positionData.getValue(0) : positionData
            var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2))
            return r || r + 1
          }, false),
          material: Cesium.Color.BLUE.withAlpha(0.5),
          outline: true
        }
      })
      this.idPotions[shape.id] = positionData
    }
    return shape
  }
  terminateShape () {
    this.activeShapePoints.pop()
    this.drawShape(this.activeShapePoints)
    this.viewer.entities.remove(this.floatingPoint)
    this.viewer.entities.remove(this.activeShape)
    this.floatingPoint = undefined
    this.activeShape = undefined
    this.activeShapePoints = []
  }
  initHander (drawtype, callback) {
    this.handler.setInputAction((event) => {
      let ray = this.viewer.camera.getPickRay(event.position)
      let earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
      if (Cesium.defined(earthPosition)) {
        if (this.activeShapePoints.length === 0) {
          this.floatingPoint = this.createPoint(earthPosition)
          this.firstPoint = this.floatingPoint
          this.activeShapePoints.push(earthPosition)
          let dynamicPositions = this.activeShapePoints
          this.activeShape = this.drawShape(dynamicPositions)
        }
        this.activeShapePoints.push(earthPosition)
        this.createPoint(earthPosition)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.handler.setInputAction((event) => {
      if (Cesium.defined(this.floatingPoint)) {
        let ray = this.viewer.camera.getPickRay(event.endPosition)
        let newPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
        if (Cesium.defined(newPosition)) {
          this.floatingPoint.position.setValue(newPosition)
          this.activeShapePoints.pop()
          this.activeShapePoints.push(newPosition)
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.handler.setInputAction((event) => {
      this.terminateShape()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }
  deatoryHandler () {
    this.handler.destory()
  }
  clearShape () {
    this.viewer.entities.remove(this.activeShape)
  }
  drawGaphic (drawtype) {
    this.drawingMode = drawtype
  }
}
