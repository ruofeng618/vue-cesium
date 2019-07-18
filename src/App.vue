<template>
  <div id="app">
    <el-container>
      <el-menu
        default-active="1-1-1"
        background-color="#545c64"
        text-color="#ffffff"
        class="el-menu-vertical-demo"
        :collapse="isCollapse">
        <el-submenu index="1">
          <template slot="title">
            <i class="el-icon-s-grid"></i>
            <span slot="title">导航一</span>
          </template>
          <el-submenu index="1-1">
            <span slot="title">互联网地图</span>
            <el-menu-item index="1-1-1">
              <el-checkbox @change="changvalue" v-model="checked1" label="OSM"></el-checkbox>
            </el-menu-item>
            <el-menu-item index="1-1-2">
              <el-checkbox v-model="checked2" label="谷歌卫星图"></el-checkbox>
            </el-menu-item>
            <el-menu-item index="1-1-3">
              <el-checkbox v-model="checked3" label="mapbox"></el-checkbox>
            </el-menu-item>
            <el-menu-item index="1-1-4">
              <el-checkbox v-model="checked4" label="天地图卫星"></el-checkbox>
            </el-menu-item>
            <el-menu-item index="1-1-5">
              <el-checkbox v-model="checked5" label="arcgis"></el-checkbox>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="1-2">
            <span slot="title">服务器地图</span>
            <el-menu-item index="">
            </el-menu-item>
          </el-submenu>
        </el-submenu>
        <el-menu-item index="2">
          <i class="el-icon-menu"></i>
          <span slot="title">导航二</span>
        </el-menu-item>
        <el-menu-item index="3" >
          <i class="el-icon-s-data"></i>
          <span slot="title">导航三</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">导航四</span>
        </el-menu-item>
      </el-menu>
      <router-view />
    </el-container>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      collapseBtnClick: false,
      isCollapse: true,
      checked1: true,
      checked2: false,
      checked3: false,
      checked4: true,
      checked5: true
    };
  },
  methods: {
    collapseStatus() {
      this.collapseBtnClick = this.isCollapse;
      this.isCollapse = !this.isCollapse;
    },
    collapseOpen() {
      if (this.collapseBtnClick) return;
      this.isCollapse = false;
    },
    collapseClose() {
      if (this.collapseBtnClick) return;
      this.isCollapse = true;
    },
    changvalue(cheched,item){
      let layerType=item.target.value
      console.log(cheched)
      console.log()
    }
  }
};
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /*margin-top: 60px;*/
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
</style>
