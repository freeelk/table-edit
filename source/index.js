/**
 * Главный файл приложения
 */

import ComponentsRenderer from "./componentsRenderer";
import DynamicTable from "./dynamic-table";
import "./index.scss";

/**
 * Описание доступных в приложении компонентов
 * component - Элемент в DOM-дереве, на место которого будет внедрен компонент. В этом элементе указываются параметры компонента
 * module - Класс, содержащий логику компонента
 * @type {*[]}
 */
const modules = [
    {
        component: 'dynamicTable',
        module: DynamicTable
    }
];

let componentsRenderer = new ComponentsRenderer(modules);
componentsRenderer.render();




