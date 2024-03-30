import Vue from 'vue'
import Router from 'vue-router'
import Login from './views/Login.vue'
import Home from './views/Home.vue'
import FriendChat from './views/chat/FriendChat.vue'
import HrInfo from './views/HrInfo.vue'
import Map2D from './views/map/Map2D.vue'
import Map3D from './views/map/Map3D.vue'
import Test from './views/map/Maptest.vue'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'Login',
            component: Login,
            hidden: true
        }, {
            path: '/home',
            name: 'Home',
            component: Home,
            hidden: true,
            meta: {
                roles: ['admin', 'user']
            },
            children: [
                {
                    path: '/chat',
                    name: '在线聊天',
                    component: FriendChat,
                    hidden: true
                }, {
                    path: '/hrinfo',
                    name: '个人中心',
                    component: HrInfo,
                    hidden: true
                }, {
                    path: '/map2d',
                    name: 'map2d',
                    component: Map2D
                    // hidden: true
                },{
                    path: '/map3d',
                    name: 'map3d',
                    component: Map3D
                    // hidden: true
                },{
                    path: '/Map-test',
                    name: 'Map-test',
                    component: Test
                }
            ]
            }, {
                path: '*',
                redirect: '/home'
            }
    ]
})