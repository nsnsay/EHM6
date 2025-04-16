import * as Vue from '/dependencies/vue.js';
import { loadModule } from '/dependencies/vue3-sfc-loader.js';
import { sfcLoaderOptions } from '/dependencies/vue3-sfc-loader-options.js';

// 异步加载 PlayerPanels.vue
const PlayerPanelsComponent = Vue.defineAsyncComponent(() =>
    loadModule('/config/options/PlayerPanels.vue', sfcLoaderOptions)
);

// 假设这里加载另一个组件
const AnotherComponent = Vue.defineAsyncComponent(() =>
    loadModule('/config/options/options.vue', sfcLoaderOptions)
);

document.addEventListener('DOMContentLoaded', () => {
    // 创建第一个 Vue 应用实例并挂载到 #app1
    const app1 = Vue.createApp(PlayerPanelsComponent);
    app1.mount('#app1');

    // 创建第二个 Vue 应用实例并挂载到 #app2
    const app2 = Vue.createApp(AnotherComponent);
    app2.mount('#app2');

    // 获取按钮和应用容器
    const showApp1Btn = document.getElementById('show-app1');
    const showApp2Btn = document.getElementById('show-app2');
    const app1Container = document.getElementById('app1');
    const app2Container = document.getElementById('app2');


    app1Container.style.display = 'none';
    app2Container.style.display = 'block';

    // 按钮点击事件监听器
    showApp1Btn.addEventListener('click', () => {
        app1Container.style.display = 'block';
        app2Container.style.display = 'none';
    });

    showApp2Btn.addEventListener('click', () => {
        app1Container.style.display = 'none';
        app2Container.style.display = 'block';
    });
});