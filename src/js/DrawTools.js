import Cesium from 'cesium/Cesium'
export default{
  Draw (drawtype = 'circle', viewer) {
    let firstPoint
    let activeShapePoints = []
    let activeShape
    let floatingPoint
    let idPotions = {}
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    function createPoint (worldPosition) {
      var point = viewer.entities.add({
        position: worldPosition,
        point: {
          color: Cesium.Color.WHITE,
          pixelSize: 5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      return point
    }
    var drawingMode = drawtype
    function drawShape (positionData) {
      var shape
      if (drawingMode === 'line') {
        shape = viewer.entities.add({
          polyline: {
            positions: positionData,
            clampToGround: true,
            width: 3
          }
        })
      } else if (drawingMode === 'polygon') {
        shape = viewer.entities.add({
          polygon: {
            hierarchy: positionData,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7))
          }
        })
      } else if (drawingMode === 'circle') {
        var start = activeShapePoints[0]
        var end = activeShapePoints[activeShapePoints.length - 1]
        console.log(start.x)
        console.log(end.x)
        var r = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2))
        r = r || r + 1
        shape = viewer.entities.add({
          position: activeShapePoints[0],
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
        idPotions[shape.id] = positionData
      }
      return shape
    }
    handler.setInputAction(function (event) {
      let ray = viewer.camera.getPickRay(event.position)
      var earthPosition = viewer.scene.globe.pick(ray, viewer.scene)
      if (Cesium.defined(earthPosition)) {
        if (activeShapePoints.length === 0) {
          floatingPoint = createPoint(earthPosition)
          firstPoint = floatingPoint
          activeShapePoints.push(earthPosition)
          var dynamicPositions = new Cesium.CallbackProperty(function () {
            return activeShapePoints
          }, false)
          activeShape = drawShape(dynamicPositions)
        }
        activeShapePoints.push(earthPosition)
        createPoint(earthPosition)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (event) {
      if (Cesium.defined(floatingPoint)) {
        let ray = viewer.camera.getPickRay(event.endPosition)
        let newPosition = viewer.scene.globe.pick(ray, viewer.scene)
        if (Cesium.defined(newPosition)) {
          floatingPoint.position.setValue(newPosition)
          activeShapePoints.pop()
          activeShapePoints.push(newPosition)
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    function terminateShape () {
      activeShapePoints.pop()
      drawShape(activeShapePoints)
      viewer.entities.remove(floatingPoint)
      viewer.entities.remove(activeShape)
      floatingPoint = undefined
      activeShape = undefined
      activeShapePoints = []
    }
    handler.setInputAction(function (event) {
      terminateShape()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }
}
