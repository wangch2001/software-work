<template>
  <div>
    <div class="mapHeader">
      <button class="el-icon-share buttonStyle" @click="startMeasure">距离测量</button>
      <button class="el-icon-menu buttonStyle" @click="startAreaMeasure">面积测量</button>
      <button class="el-icon-circle-plus-outline buttonStyle" @click="markPoint">绘制点</button>
      <button class="el-icon-minus buttonStyle" @click="markLine">绘制线</button>
      <button class="el-icon-data-board buttonStyle" @click="markArea">绘制面</button>
      <button class="el-icon-close buttonStyle" @click="stopMarking">停止添加</button>
      <button class="buttonStyle" @click="showMarkedPoints">显示/关闭</button>
      <button class="el-icon-close buttonStyle" @click="clearAddThing">清空标注</button>
      <button class="el-icon-chat-dot-square buttonStyle" @click="popupmessage">弹出消息</button>
      <button @click="toggleView" class="buttonStyle">
        {{ is3DView ? '切换至2D' : '切换至3D' }}
      </button>
      <button @click="flytoschool" class="el-icon-location buttonStyle buttonStyle">回到学校</button>
    </div>
    <div class="coordinates" v-if="coordinates">
      经纬度：[{{ coordinates.lng }},{{ coordinates.lat }}]
    </div>
    <div v-if="distance" class="detailDisplay">
      <div v-if="startPoint">起始点经纬度：[{{ startPoint[0].toFixed(5) }},{{ startPoint[1].toFixed(5) }}]</div>
      <div v-if="endPoint">结束点经纬度：[{{ endPoint[0].toFixed(5) }},{{ endPoint[1].toFixed(5) }}]</div>
      距离: {{ distance }} 公里
    </div>
    <div id="mapCon"  style="width: 100%; height: 700px;"></div>
    <div class="detailDisplay" v-if="area">
      面积: {{ area }}
    </div>
    <div class="listDisplay" v-if="showPoints">
      <div v-for="(point, index) in markedPoints" :key="index">
        点 {{ index + 1 }} 经纬度：[{{ point[0].toFixed(7) }},{{ point[1].toFixed(7) }}]
      </div>
    </div>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'; // 引入mapbox
import 'mapbox-gl/dist/mapbox-gl.css'; // 引入样式
import MapboxLanguage from '@mapbox/mapbox-gl-language'; // 引入中文语言
import * as turf from '@turf/turf'; // 引入turf
import {MapboxStyleSwitcherControl} from "mapbox-gl-style-switcher"; // 引入地图样式切换控件
import "mapbox-gl-style-switcher/styles.css";// 引入样式
import "mapbox-gl-infobox/styles.css";// 引入样式

import "mapbox-gl-controls/lib/controls.css";// 引入样式
import { RulerControl } from 'mapbox-gl-controls'; // 引入测距控件

import * as THREE from 'three'; // 引入three
import { GLTFLoader } from 'three-gltf-loader'; // 引入gltf加载器

export default {
  name: 'Mapbox2D',
  data: () => ({
    // map: null,
    coordinates: null,
    measurePoints: [],
    distance: null,
    startPoint: null,
    endPoint: null,
    area: null,
    markedPoints: [],
    showPoints: false,
    calculateAreaFlag: false,
    is3DView: false,
  }),
  methods: {// 方法
    initMap() {// 初始化地图
      mapboxgl.accessToken = 'pk.eyJ1IjoiamllZ2lzZXJnZyIsImEiOiJjanExcmJjMTYxMGlxM3hueG9lZjQ4eng5In0.F4Ia4OCMj8HZV8scGQvSfQ';
      this.map = new mapboxgl.Map({
        container: 'mapCon',
        style: 'mapbox://styles/mapbox/navigation-preview-day-v4',
        center: [116.241089901, 40.21640959],
        zoom: 14,
        pitch: 45,// 地图倾斜角度
        bearing: -17.6,// 地图旋转角度
        antialias: true, // 抗锯齿
      });
      this.map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }))// 添加中文语言
      this.map.addControl(new mapboxgl.FullscreenControl(), "top-right");// 添加全屏控件
      this.map.addControl(new mapboxgl.NavigationControl(), "top-right");// 添加导航控件
      this.map.addControl(new MapboxStyleSwitcherControl(// 添加地图样式切换控件
          [
            { title: "街道底图",
              uri: "mapbox://styles/mapbox/streets-v12",
            },
            { title: "户外底图",
              uri: "mapbox://styles/mapbox/outdoors-v12",
            },
            { title: "亮色底图",
              uri: "mapbox://styles/mapbox/light-v11",
            },
            { title: "暗色底图",
              uri: "mapbox://styles/mapbox/dark-v11",
            },
            { title: "卫星底图",
              uri: "mapbox://styles/mapbox/satellite-v9",
            },
            { title: "卫星街道混合底图",
              uri: "mapbox://styles/mapbox/satellite-streets-v12",
            },
          ]
      ))
      this.map.on('mousemove', e => { // 监听鼠标移动事件
        this.coordinates = e.lngLat; // 获取经纬度
      });

      const scale = new mapboxgl.ScaleControl({ // 添加比例尺
        maxWidth: 100, // 最大宽度
        unit: 'metric' // 单位
      }, 'bottom-left');
      this.map.addControl(scale); // 添加比例尺

      this.map.on('ruler.on', () => console.log('ruler: on'));
      this.map.on('ruler.off', () => console.log('ruler: off'));
      this.map.addControl(new RulerControl({units: 'kilometers',labelFormat: n => `${n.toFixed(2)} km`,}), 'top-right');

    },
    toggleView() { // 切换视图
      if (this.is3DView) {
        // 切换到二维视图
        this.map.easeTo({ pitch: 0, bearing: 0 });
        // 隐藏三维建筑图层
        this.map.setLayoutProperty('3d-buildings', 'visibility', 'none');
      } else {
        // 切换到三维视图
        this.map.easeTo({ pitch: 45, bearing: -17.6 });
        // 显示三维建筑图层
        this.map.setLayoutProperty('3d-buildings', 'visibility', 'visible');
      }
      // 切换视图状态
      this.is3DView = !this.is3DView;
    },
    switchTo2D() {
      // 切换到二维视图
      this.map.easeTo({
        pitch: 0,
        bearing: 0
      });
    },
    switchTo3D() {
      // 切换回三维视图
      this.map.easeTo({
        pitch: 45,
        bearing: -17.6
      });
    },
    customMap() {
      const scaleElement = document.querySelector('.mapboxgl-ctrl-scale');
      if (scaleElement) {
        scaleElement.style.height = '15px'; // 设置比例尺高度
        scaleElement.style.backgroundColor = 'transparent'; // 设置比例尺背景色
        scaleElement.style.lineHeight = '10%'; // 设置比例尺行高
        scaleElement.style.textAlign = 'center'; // 设置比例尺文本居中
      }

      const attribButton = document.querySelector('.mapboxgl-ctrl-attrib-button');// 地图属性按钮
      if (attribButton) {
        attribButton.remove();// 移除地图属性按钮
      }
      const attriDiv = document.querySelector('.mapboxgl-ctrl-attrib-inner');// 地图属性div
      if (attriDiv) {
        attriDiv.remove();
      }
      const logo = document.querySelector('.mapboxgl-ctrl-logo'); // 地图logo
      if (logo) {
        logo.remove();
      }
    },
    clearLayerAndSource() { // 清除图层和数据源
      const layersToRemove = ['measure-points', 'measure-lines', 'area-measure-points', 'area-measure-lines'];
      layersToRemove.forEach(layer => {
        if (this.map.getLayer(layer)) {
          this.map.removeLayer(layer);
        }
        if (this.map.getSource(layer)) {
          this.map.removeSource(layer);
        }
      });
      this.measurePoints = [];
      this.distance = null;
      this.startPoint = null;
      this.endPoint = null;
      this.area = null;
    },
    startMeasure() {
      this.showPoints = false; // 隐藏标注点
      this.calculateAreaFlag = false; // 停止面积测量
      this.stopMarking(); // 停止添加
      this.setupAreaMeasureLayers(); // 设置面积测量图层
      this.clearLayerAndSource(); // 清除图层和数据源
      this.setupMeasureLayers(); // 设置测量图层
      this.clearMeasurements(); // 清除测量数据
      this.map.getCanvas().style.cursor = 'crosshair'; // 设置鼠标样式 crosshair 十字线
      this.measurePoints = []; // 清空测量点
      this.map.on('click', this.handleMapClick); // 监听地图点击事件
      this.map.on('mousemove', this.handleMapMouseMove); // 监听鼠标移动事件
    },
    setupMeasureLayers() {
      if (!this.map.getSource('measure-points')) {
        this.map.addSource('measure-points', { // 添加数据源
          type: 'geojson',  // 数据源类型
          data: {
            type: 'FeatureCollection',  // 数据类型
            features: [], // 数据
          },
        });
        this.map.addLayer({
          id: 'measure-points', // 图层id
          type: 'circle', // 图层类型
          source: 'measure-points',
          paint: {
            'circle-radius': 5,
            'circle-color': '#007cbf',
          },
        });
      }

      if (!this.map.getSource('measure-lines')) {
        this.map.addSource('measure-lines', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
        this.map.addLayer({
          id: 'measure-lines',
          type: 'line',
          source: 'measure-lines',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#c2c7c6',
            'line-width': 2,
          },
        });
      }
    },
    handleMapClick(e) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      this.measurePoints.push(coords);

      if (this.measurePoints.length === 1) {
        this.startPoint = coords;
      } else if (this.measurePoints.length === 2) {
        this.endPoint = coords;
        this.calculateDistance();
        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.handleMapMouseMove);
        this.map.getCanvas().style.cursor = '';
      }

      this.updateMeasureLayers();
    },
    handleMapMouseMove(e) {
      if (this.measurePoints.length != 0) {
        const line = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [this.measurePoints[this.measurePoints.length - 1], [e.lngLat.lng, e.lngLat.lat]],
          },
        };
        this.map.getSource('measure-lines').setData({
          type: 'FeatureCollection',
          features: [line],
        });
      }
    },
    updateMeasureLayers() {
      const points = this.measurePoints.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point,
        },
      }));

      const lines = [];
      for (let i = 1; i < this.measurePoints.length; i++) {
        lines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [this.measurePoints[i - 1], this.measurePoints[i]],
          },
        });
      }

      this.map.getSource('measure-points').setData({
        type: 'FeatureCollection',
        features: points,
      });

      this.map.getSource('measure-lines').setData({
        type: 'FeatureCollection',
        features: lines,
      });
    },
    calculateDistance() {
      const from = turf.point(this.measurePoints[0]);
      const to = turf.point(this.measurePoints[1]);
      const options = { units: 'kilometers' };
      const distance = turf.distance(from, to, options);
      this.distance = distance.toFixed(2);
    },

    //面积测量-----------------------------------------------------------------------------------------------------------------------
    handleMapAreaClick(e) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      this.measurePoints.push(coords);

      this.updateMeasureArea();
      this.updateMeasureLayersArea();
    },
    handleMapMouseAreaMove(e) {
      // 实时绘制多边形
      if (this.measurePoints.length > 1) {
        const movingPoint = [e.lngLat.lng, e.lngLat.lat];
        this.updateMeasureArea(movingPoint);
      }
    },
    startAreaMeasure() {
      this.calculateAreaFlag = true;

      this.showPoints = false;
      this.stopMarking();

      this.clearLayerAndSource()
      this.setupMeasureLayers();
      this.measurePoints = [];

      this.clearMeasurements();
      this.map.getCanvas().style.cursor = 'crosshair';
      this.map.doubleClickZoom.disable();
      this.setupAreaMeasureLayers();
      this.map.on('click', this.handleMapAreaClick);
      this.map.on('mousemove', this.handleMapMouseAreaMove);
    },

    setupAreaMeasureLayers() {
      if (!this.map.getSource('area-measure-points')) { // 添加数据源
        this.map.addSource('area-measure-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        this.map.addLayer({
          id: 'area-measure-points',
          type: 'circle',
          source: 'area-measure-points',
          paint: {
            'circle-radius': 5,
            'circle-color': '#000'
          }
        });
      }
    },
    updateMeasureLayersArea() {
      const points = this.measurePoints.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point,
        },
      }));

      const lines = [];
      for (let i = 1; i < this.measurePoints.length; i++) {
        lines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [this.measurePoints[i - 1], this.measurePoints[i]],
          },
        });
      }

      this.map.getSource('area-measure-points').setData({
        type: 'FeatureCollection',
        features: points,
      });

      this.map.getSource('area-measure-points').setData({
        type: 'FeatureCollection',
        features: lines,
      });
    },
    updateMeasureArea(temporaryPoint = null) {
      let points = [...this.measurePoints];
      if (temporaryPoint) {
        points.push(temporaryPoint);
      }
      if (points.length > 2) {
        let areaPolygon = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [points.concat([points[0]])]
          }
        };
        // 确保多边形图层存在
        if (!this.map.getSource('area-measure-polygon')) {
          this.map.addSource('area-measure-polygon', {
            type: 'geojson',
            data: areaPolygon
          });
          this.map.addLayer({
            id: 'area-measure-polygon',
            type: 'fill',
            source: 'area-measure-polygon',
            paint: {
              'fill-color': '#ff0000',
              'fill-opacity': 0.5
            }
          });
        } else {
          this.map.getSource('area-measure-polygon').setData(areaPolygon);
        }
      }
      // 更新面积信息
      if (this.measurePoints.length > 2 && !temporaryPoint) {
        if (this.calculateAreaFlag) this.area = this.calculateArea(this.measurePoints) + ' m²';
      }

      this.map.on('dblclick', () => {
        this.map.off('click', this.handleMapAreaClick);
        this.map.off('mousemove', this.handleMapMouseAreaMove);
        this.map.getCanvas().style.cursor = '';
        this.showPoints = false;
        setTimeout(() => {
          this.map.doubleClickZoom.enable();
        }, 200);
      });
    },
    addAreaPoint(coords) {
      // Ensure that the source is defined before accessing its data
      if (this.map && this.map.getSource('area-measure-points')) {
        let pointFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        };
        let data = this.map.getSource('area-measure-points').getData();
        data.features.push(pointFeature);
        this.map.getSource('area-measure-points').setData(data);
      } else {
        // If the source is not available, log an error or handle it accordingly
        console.error('Source "area-measure-points" is not defined.');
      }
    },
    calculateArea(points) {
      let polygon = turf.polygon([points.concat([points[0]])]);
      let calculatedArea = turf.area(polygon);
      return calculatedArea.toFixed(2); // Return area in square meters
    },
    clearMeasurements() {
      this.measurePoints = [];
      this.area = null;
      if (this.map.getSource('area-measure-polygon')) {
        this.map.removeLayer('area-measure-polygon');
        this.map.removeSource('area-measure-polygon');
      }
    },
    // 添加点-----------------------------------------------------------------------------------------------
    markPoint() {
      this.showPoints = false;
      this.stopMarking();
      this.setupAreaMeasureLayers();
      this.clearLayerAndSource()
      this.setupMeasureLayers();
      this.clearMeasurements();
      this.map.getCanvas().style.cursor = 'crosshair';
      this.measurePoints = [];
      this.map.getCanvas().style.cursor = 'crosshair';
      this.map.on('click', this.addMarker);
    },
    addMarker(e) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      this.markedPoints.push(coords);

      const marker = new mapboxgl.Marker()// 创建标注
          .setLngLat(coords)
          .addTo(this.map);

      if (!this.map.markers) {// 添加标注点
        this.map.markers = [];
      }
      this.map.markers.push(marker); // 添加标注点
    },
    stopMarking() { // 停止添加

      this.map.getCanvas().style.cursor = ''; // 设置鼠标样式
      this.map.off('click', this.addMarker); // 移除点击事件监听
      this.map.off('click', this.addLinePoint); // 移除点击事件监听
      this.map.off('mousemove', this.handleMapMouseMove); // 移除鼠标移动事件监听
    },
    clearAddThing() { // 清空标注

      // this.calculateAreaFlag = false; // 停止面积测量

      // this.showPoints = false;// 隐藏标注点
      // this.stopMarking();// 停止添加

      this.clearLayerAndSource()  // 清除图层和数据源
      this.setupMeasureLayers();  // 设置测量图层
      this.measurePoints = [];  // 清空测量点

      this.clearMeasurements(); // 清除测量数据
      // this.map.getCanvas().style.cursor = 'crosshair';
      this.map.doubleClickZoom.disable(); // 禁用双击放大
      this.setupAreaMeasureLayers();  // 设置面积测量图层
      this.markedPoints = []; // 清空标注点
      if (this.map && this.map.markers) { // 移除标注点
        this.map.markers.forEach(marker => marker.remove());
        this.map.markers = [];
      }
      this.measurePoints = [];  // 清空测量点
      if (this.map.getSource('lineSource')) {   // 移除线
        this.map.removeLayer('lineLayer');
        this.map.removeSource('lineSource');
      }
    },
    showMarkedPoints() {
      this.showPoints = !this.showPoints;
    },
    // 添加线-----------------------------------------------------------------------------------------------
    markLine() {
      this.showLines = false;
      this.stopMarking();
      this.setupAreaMeasureLayers();
      this.clearLayerAndSource()
      this.setupMeasureLayers();
      this.clearMeasurements();
      this.map.getCanvas().style.cursor = 'crosshair';
      this.measurePoints = [];
      this.map.getCanvas().style.cursor = 'crosshair';
      this.map.on('click', this.addLinePoint);
      this.map.on('click', this.addMarker);
      this.map.on('mousemove', this.handleMapMouseMove);

      this.map.doubleClickZoom.disable();
      this.map.on('dblclick', () => {
        this.map.off('mousemove', this.handleMapMouseMove);
        this.stopMarking();
        this.map.getCanvas().style.cursor = '';
        this.showPoints = false;
        setTimeout(() => {
          this.map.doubleClickZoom.enable();
        }, 200);
      });
    },
    addLinePoint(e) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      this.measurePoints.push(coords);

      // 当点的数量大于1时，绘制线段
      if (this.measurePoints.length > 1) {
        const line = {
          'type': 'Feature',
          'geometry': {
            'type': 'LineString',
            'coordinates': this.measurePoints
          }
        };

        if (!this.map.getSource('lineSource')) {
          this.map.addSource('lineSource', {
            'type': 'geojson',
            'data': line
          });

          this.map.addLayer({
            'id': 'lineLayer',
            'type': 'line',
            'source': 'lineSource',
            'layout': {},
            'paint': {
              'line-color': '#ff0000',
              'line-width': 2
            }
          });
        } else {
          this.map.getSource('lineSource').setData(line);
        }
      }
    },
    showMarkedLines() {
      this.showLines = !this.showLines;
    },
    // 添加面
    markArea() {
      this.calculateAreaFlag = false; // 停止面积测量
      this.showPoints = false; // 隐藏标注点
      this.stopMarking(); // 停止添加

      this.clearLayerAndSource() // 清除图层和数据源
      this.setupMeasureLayers(); // 设置测量图层
      this.measurePoints = []; // 清空测量点

      this.clearMeasurements(); // 清除测量数据
      this.map.getCanvas().style.cursor = 'crosshair'; // 设置鼠标样式 crosshair 十字线
      this.map.doubleClickZoom.disable(); // 禁用双击放大
      this.setupAreaMeasureLayers(); // 设置面积测量图层
      this.map.on('click', this.handleMapAreaClick); // 监听地图点击事件
      this.map.on('mousemove', this.handleMapMouseAreaMove);  // 监听鼠标移动事件
    },
    structureShow() {
      this.map.on('load', () => {
        // 添加三维建筑图层
        this.map.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',

            // 使用 'fill-extrusion-height' 属性来设置建筑的高度
            'fill-extrusion-height': [
              "interpolate", ["linear"], ["zoom"],
              15, 0,
              15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
              "interpolate", ["linear"], ["zoom"],
              15, 0,
              15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
          }
        });
      });
    },
    //回到学校
    flytoschool() {
      this.map.flyTo({
        center: [116.241089901, 40.21640959],
        zoom: 14,
        pitch: 45,
        bearing: 0
      });
    },
    //弹出消息
    popupmessage() {
      new mapboxgl.Popup({ closeOnClick: true })// 创建弹出框
          .setLngLat([116.241089901, 40.21640959])
          .setHTML("<img src='https://tse4-mm.cn.bing.net/th/id/OIP-C.qv7NN3Ix9siX0Fkl6jCXLwHaEo?rs=1&pid=ImgDetMain' width=250px alt='中国石油大学（北京）'>")
          .addTo(this.map);
    },
    //添加实体模型
    // 添加实体模型
    addModel_(e){
      const coords = [e.lngLat.lng, e.lngLat.lat];
      // this.markedPoints.push(coords); // 添加标注点

      // 自定义标记的 HTML 元素，这里使用一个红色的 div 元素
      const customMarkerElement = document.createElement('div');
      customMarkerElement.className = 'custom-marker';

      // 创建自定义标记
      const customMarker = new mapboxgl.Marker(customMarkerElement)
          .setLngLat(coords)
          .addTo(this.map);

      if (!this.map.markers) {
        this.map.markers = [];
      }
      this.map.markers.push(customMarker);
    },

    addModel() {
      this.showPoints = false; // 隐藏标注点
      this.stopMarking();
      this.setupAreaMeasureLayers();
      this.clearLayerAndSource();
      this.setupMeasureLayers();
      this.clearMeasurements();
      this.map.getCanvas().style.cursor = 'crosshair'; // 设置鼠标样式 crosshair 十字线
      this.measurePoints = []; // 清空测量点
      this.map.getCanvas().style.cursor = 'crosshair'; // 设置鼠标样式 crosshair 十字线
      this.map.on('click', this.addMarker); // 监听地图点击事件
      },

  },

  mounted() {// 执行时间为实例被创建后
    this.initMap();
    this.customMap();
    this.structureShow();
  },
  computed: {
    formattedCoordinates() {
      if (this.coordinates) {
        return {
          lng: this.coordinates.lng.toFixed(5), // 保留5位小数
          lat: this.coordinates.lat.toFixed(5)
        };
      }
      return null;
    }
  }

}
</script>

<style scoped>
.mapHeader {
  margin: 0;
  height: 60px;
  width: 80%;
  display: flex;
  align-items: center;
}

#mapCon {
  height: calc(100% - 50px);
  /* 减去空白div的高度 */
  width: 100%;
}

.selectInfo {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* 经纬度 */
.coordinates {
  position: absolute;
  top: 880px;
  left: 1400px;
  background-color: rgba(233, 235, 153, 0.8);
  padding: 5px;
  border-radius: 5px;
  z-index: 1;
}

.detailDisplay {
  position: absolute;
  top: 100px;
  left: 160px;
  background-color: rgba(233, 235, 153, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 1;
}

/* 点经纬度列表 */
.listDisplay {
  position: absolute;
  top: 750px;
  right: 20px;
  background-color: rgba(233, 235, 153, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 1;
}

.buttonStyle {
  margin-left: 10px;
  width: 100px;
  height: 40px;
  font-size: 14px;
  font-weight: bold;
  color: #020202;
  /*边框加粗 圆角 右下阴影*/
  /* border: 2px solid #3725d4; */
  /* border-radius: 5px; */
  /* box-shadow: 2px 2px 2px #c08765; */
}

.custom-marker >>> .custom-marker {
  background-color: rgba(233, 235, 153, 0.8);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgb(0, 0, 0);
  cursor: pointer;
}

.pointsDisplay {
  position: absolute;
  top: 150px;
  left: 160px;
  background-color: rgba(0, 89, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 999;
  max-height: 300px;
  overflow-y: auto;
}

</style>