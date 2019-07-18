<template>
  <div id="cesiumContainer" ref="cesiumContainer">
    <div id="overview" class="leaflet-control-minimap"></div>  
  </div>
</template>
<script type="text/javascript">
import widgets from 'cesium/Widgets/widgets.css'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import Cesium from 'cesium/Cesium'
import MeasureTools from '../js/MeasureTools'
import CesiumOverviewMapControl from '../js/OverViewerMap'
import Tools from '../js/gjwTools'
import DrawTools from '../js/Draw'
export default {
  name: "cesiumViewer",
  mounted() {
  this.viewer=this.initMap();
  this.initOverview(this.viewer);
  Tools.addCircleRipple(this.viewer,{ //默认只绘制两个圆圈叠加 如遇绘制多个，请自行源码内添加。
        id:"111",
        lon:116,
        lat:39,
        height:0,
        maxR:3000,
        minR:0,//最好为0
        deviationR:20,//差值 差值也大 速度越快
        eachInterval:1000,//两个圈的时间间隔
        imageUrl:"../static/redCircle2.png"
    });
  },
  methods:{
  download_picture:function () {
      var canvas = this.viewer.scene.canvas;
      var genimg = downloadpicture.convertToImage(canvas, 2000, 2000 * canvas.height / canvas.width, 'png');
      var image = document.getElementById('image');
      image.src = genimg.src;
   }, 
   initOverview: function (viewer) {
        var url = "http://mt0.google.cn/vt/lyrs=t,r&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}";
        var layer = new L.TileLayer(url, {
            minZoom: 0,
            maxZoom: 20
        });
        var container = document.getElementById("overview");
        var options = {
            container: container,
            toggleDisplay: true,
            width: 150,
            height: 150,
            position: "topright",
            aimingRectOptions: {
                color: "#ff1100",
                weight: 3
            },
            shadowRectOptions: {
                color: "#0000AA",
                weight: 1,
                opacity: 0,
                fillOpacity: 0
            }
        };       
       var overviewCtr =new CesiumOverviewMapControl(viewer, layer, options);
    } ,
    initMap:function(){
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MTIzNzY5OC1hOWM2LTRiMWMtYTc5YS1lNjFmZmJhNDcxZjEiLCJpZCI6MTEzNjIsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1NjAxMzMzOTZ9.u3sp8GEkT7NjKeexeoUzMjgND6FHk0iGhdV-YxrJw-o';
    var viewer = new Cesium.Viewer("cesiumContainer",{
    baseLayerPicker: false,
    contextOptions: {
            webgl: {
                alpha: true,
                depth: false,
                stencil: true,
                antialias: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: true, //通过canvas.toDataURL()实现截图需要将该项设置为true
                failIfMajorPerformanceCaveat: true
            },
            allowTextureFilterAnisotropic: true
        }
    });
    viewer.scene.globe.depthTestAgainstTerrain = false;
    var layer = new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.dark',
      accessToken: 'pk.eyJ1IjoibGltb2d1IiwiYSI6ImNqeHllNXYyZzA0bWozb3FqMmZ3dXhidjQifQ.uxlgcYOHUlTY6cTlONffyA'
    })
  viewer.imageryLayers.remove(viewer.imageryLayers.get(0))
  viewer.imageryLayers.addImageryProvider(layer)
  var promise = Cesium.GeoJsonDataSource.load('http://localhost:8080/geoserver/cite/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=cite%3AbeijingBoundary&maxFeatures=200&outputFormat=application%2Fjson');
    promise.then(function(dataSource) {     
        viewer.dataSources.add(dataSource);
        //Get the array of entities
        var entities = dataSource.entities.values;
        var entity = entities[0]; 
        entity.polygon.fill=false       
        entity.polygon.outline = true
        entity.polygon.outlineWidth=100
        entity.polygon.outlineColor=new Cesium.PolylineOutlineMaterialProperty({
            color : Cesium.Color.ORANGE,
            outlineWidth : 2,
            outlineColor : Cesium.Color.BLACK
        })
        //entity.polygon.extrudedHeight = entity.properties.citycode / 100.0;       
    }).otherwise(function(error){
        //Display any errrors encountered while loading.
        window.alert(error);
    });
    var longitude = 108.9592389524902;
var latitude = 34.21890250978677;
var height = 0;
var heading = 0;
var tileset = new Cesium.Cesium3DTileset({
    url: 'http://localhost:9002/api/folder/24f1beb2fbaa464aaa7afb95805cdaf9/tileset.json'
});
viewer.scene.primitives.add(tileset);
tileset.readyPromise.then(function(argument) {
    var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(heading)));
    Cesium.Matrix4.multiply(mat, rotationX, mat);
    tileset._root.transform = mat;
    viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000)});
});
    return viewer;
  } 
  },
}
</script>
<style>
@import '../css/Control.MiniMap.css';
#overview {
            z-index: 99998;
            width: 150px;
            height: 150px;
            position: absolute;
            right: 10px;
            bottom: 50px;
        }
#cesiumContainer {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#menu {
  position: absolute;
  top: 80px;
  left: 10px;
  z-index: 999;
}
</style>