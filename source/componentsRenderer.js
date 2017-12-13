/**
 *  Рендерит в DOM-дереве компоненты согласно описания в modules
 */

export default class componentsRenderer {

    constructor(modules) {
        this.modules = modules;
    }

    render() {
        this.modules.forEach((module) => {
            let components = document.getElementsByTagName(module.component);

            for (var i = 0; i < components.length; i++) {
                new module.module(components[i]);
            }
        });
    }

}
