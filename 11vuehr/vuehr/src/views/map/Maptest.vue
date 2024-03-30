<template>
  <div>
  <div class="mapHeader">
    <button class="buttonStyle" @click="startMeasure">距离测量</button>
    <button class="buttonStyle" @click="startAreaMeasure">面积测量</button>
    <button class="buttonStyle" @click="markPoint">绘制点</button>
    <button class="buttonStyle" @click="markLine">绘制线</button>
    <button class="buttonStyle" @click="markArea">绘制面</button>
    <button class="buttonStyle" @click="stopMarking">停止添加</button>
    <button class="buttonStyle" @click="showMarkedPoints">显示/关闭点</button>
    <button class="buttonStyle" @click="clearAddThing">清空标注</button>
    <button @click="toggleView" class="dimensionChangeButton">
      {{ is3DView ? '切换至2D' : '切换至3D' }}
    </button>


  </div>
  <div class="coordinates" v-if="coordinates">
    经纬度：[{{ coordinates.lng }},{{ coordinates.lat }}]
  </div>
  <div v-if="distance" class="detailDisplay">
    <div v-if="startPoint">起始点经纬度：[{{ startPoint[0].toFixed(5) }},{{ startPoint[1].toFixed(5) }}]</div>
    <div v-if="endPoint">结束点经纬度：[{{ endPoint[0].toFixed(5) }},{{ endPoint[1].toFixed(5) }}]</div>
    距离: {{ distance }} 公里
  </div>
  <div id="mapCon" style="width: 100%; height: 700px;"></div>
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
import mapboxgl from '../mapbox'
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
console.log(mapboxgl.version);
import * as turf from '@turf/turf';

export default {
  name: 'Test_Map',
  data: () => ({
    map: null,
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
  methods: {
    initMap() {
      mapboxgl.accessToken = 'pk.eyJ1IjoiamllZ2lzZXJnZyIsImEiOiJjanExcmJjMTYxMGlxM3hueG9lZjQ4eng5In0.F4Ia4OCMj8HZV8scGQvSfQ';
      this.map = new mapboxgl.Map({
        container: 'mapCon',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [116.241189901, 40.21720959],
        zoom: 16, //是地图的缩放级别
        pitch: 0, // 地图倾斜角度
        bearing: 0, // 地图旋转角度
        antialias: false, // 抗锯齿
        attributionControl: false // 是否显示属性控件
      });
      // this.map.addControl(new MapboxLanguage({defaultLanguage: 'zh-Hans'}))// 添加中文语言
      // this.map.addControl(new mapboxgl.FullscreenControl(), "top-right");// 添加全屏控件
      // this.map.addControl(new mapboxgl.NavigationControl(), "top-right");// 添加导航控件
      /*const scale = new mapboxgl.ScaleControl({ // 添加比例尺
        maxWidth: 100, // 最大宽度
        unit: 'metric' // 单位
      }, 'bottom-left');*/
      // this.map.addControl(scale); // 添加比例尺
      // this.map.on('mousemove', e => { // 监听鼠标移动事件
      //   this.coordinates = e.lngLat; // 获取经纬度
      // });
    },
    // customMap() {
    //   // map.on('load', () => {// 地图加载完毕后执行
    //   //   const layers = map.getStyle().layers
    //   //   let labelLayerId
    //   //   for (var i = 0; i < layers.length; i++) {
    //   //     if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
    //   //       labelLayerId = layers[i].id
    //   //       break
    //   //     }
    //   //   }
    //   //
    //   // })
    //   const scaleElement = document.querySelector('.mapboxgl-ctrl-scale');
    //   if (scaleElement) {
    //     scaleElement.style.height = '15px'; // 设置比例尺高度
    //     scaleElement.style.backgroundColor = 'transparent'; // 设置比例尺背景色
    //     scaleElement.style.lineHeight = '10%'; // 设置比例尺行高
    //     scaleElement.style.textAlign = 'center'; // 设置比例尺文本居中
    //   }
    //
    //   const attribButton = document.querySelector('.mapboxgl-ctrl-attrib-button');// 地图属性按钮
    //   if (attribButton) {
    //     attribButton.remove();// 移除地图属性按钮
    //   }
    //   const attriDiv = document.querySelector('.mapboxgl-ctrl-attrib-inner');// 地图属性div
    //   if (attriDiv) {
    //     attriDiv.remove();
    //   }
    //   const logo = document.querySelector('.mapboxgl-ctrl-logo'); // 地图logo
    //   if (logo) {
    //     logo.remove();
    //   }
    //
    // },
    // structureShow() {
    //   this.map.on('load', () => {
    //     // 添加三维建筑图层
    //     this.map.addLayer({
    //       'id': '3d-buildings',
    //       'source': 'composite',
    //       'source-layer': 'building',
    //       'filter': ['==', 'extrude', 'true'],
    //       'type': 'fill-extrusion',
    //       'minzoom': 15,
    //       'paint': {
    //         'fill-extrusion-color': '#aaa',
    //
    //         // 使用 'fill-extrusion-height' 属性来设置建筑的高度
    //         'fill-extrusion-height': [
    //           "interpolate", ["linear"], ["zoom"],
    //           15, 0,
    //           15.05, ["get", "height"]
    //         ],
    //         'fill-extrusion-base': [
    //           "interpolate", ["linear"], ["zoom"],
    //           15, 0,
    //           15.05, ["get", "min_height"]
    //         ],
    //         'fill-extrusion-opacity': .6
    //       }
    //     });
    //   });
    // },

  },
  mounted() {// 页面加载完毕后执行
    this.initMap();// 初始化地图
    // this.customMap();// 自定义地图
    // this.structureShow();// 显示建筑
  },
  // computed: {
  //   formattedCoordinates() {
  //     if (this.coordinates) {
  //       return {
  //         lng: this.coordinates.lng.toFixed(5), // 保留5位小数
  //         lat: this.coordinates.lat.toFixed(5)
  //       };
  //     }
  //     return null;
  //   }
  // }
}
</script>


<style scoped>
mapHeader {
  margin: 0;
  height: 40px;
  width: 90%;
  display: flex;
  align-items: center;
  /* padding-left: 10px; */
}
#mapCon {
  height: calc(100vh - 50px);
  width: 100%;
}
.selectInfo {
  position: absolute;
  top: 10px;
  right: 10px;
}

.coordinates {
  position: absolute;
  top: 60px;
  left: 160px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
  border-radius: 5px;
  z-index: 1;
}

.detailDisplay {
  position: absolute;
  top: 100px;
  left: 160px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 1;
}

.listDisplay {
  position: absolute;
  top: 60px;
  right: 50px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 1;
}

.buttonStyle {
  margin-left: 10px;
  width: 80px;
  height: 30px;
  font-size: 12px;
  color: #000000;
  /*边框加粗 圆角 右下阴影*/
  border: 2px solid #c08765;
  border-radius: 5px;
  box-shadow: 2px 2px 2px #c08765;
}


.pointsDisplay {
  position: absolute;
  top: 150px;
  left: 160px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 999;
  max-height: 300px;
  overflow-y: auto;
}

.uniqueBtn {
  margin-left: 10px;
  width: 80px;
  height: 30px;
  font-size: 12px;
  color: white;
  background: #333;
}

.dimensionChangeButton{
  margin-left: 10px;
  width: 80px;
  height: 30px;
  font-size: 12px;
  color: white;
  background: #3d3da2;
  font-weight: bolder;
}
</style>