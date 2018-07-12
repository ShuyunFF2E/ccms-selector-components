import classes from './index.scss';
import { isBoolean } from '@/utils';
// import dateFormat from 'common-javascript-utils/src/date';

export default class BaseGridCtrl {
    gridWidth = 920;
    fieldParser = {};

    gridOpts = {
        showPagination: false,
        externalData: []
    };

    initGridOpts(columns, conditionType) {
        let gridWidth = 50;
        columns.forEach(item => {
            this.fieldParser[item.code] = this.genFieldParser(item);
            gridWidth += item.width || 150;
        });
        this.gridWidth = gridWidth;
        this.generateGridColumns(columns, conditionType);
    }

    // 计算表格的列（因为列是可配的）
    generateGridColumns(columns, conditionType) {
        this.generateCheckboxGridColumns(columns, conditionType);
    }

    // 多选框
    generateCheckboxGridColumns(columns, conditionType) {
        const headerTpl = `<tr>
			<th style="width:30px;">
                <cc-checkbox
                    ng-model="$parent.$ctrl.condition.${conditionType}.isAllSelected"
                    ng-change="$parent.$ctrl.switchAllSelect()"
                    ng-disabled="!$parent.$ctrl.data.length"
                    cc-tooltip="'选中所有的数据'"
                    tooltip-placement="bottom-left"
                ></cc-checkbox>
			</th>
			${columns.map((item,index) => {
                const itemWidth = item.width || 150;
                const width = (index === columns.length - 1) ? (this.gridWidth > 920 ? (itemWidth + 'px') : 'unset') : (itemWidth + 'px');
                const fieldName = item.name || item.code;
                const thClasses =classes.th + ' ' + (item.tooltip ? classes.tooltipTh : '');
                return `
                    <th style="width:${width}">
                        <div class="${thClasses}">
                            <div class="bs-ellipsis" title="${fieldName}">${fieldName}</div>
                            <span
                                class="iconfont icon-question-mark"
                                ng-if="'${item.tooltip}'"
                                cc-tooltip="'${item.tooltip}'"
                                tooltip-placement="bottom-right">
                            </span>
                        </div>
                    </th>`;
            }).join('')}
		</tr>`;

        const columnsDef = [{
            cellTemplate: `
                <cc-checkbox
                    ng-model="entity.selected"
                    ng-change="$ctrl.switchSelect(entity)">
                </cc-checkbox>`,
            width: '30px'
        }].concat(columns.map((item, index) => {
            const itemWidth = item.width || 150;
            const width = (index === columns.length - 1) ? (this.gridWidth > 920 ? (itemWidth + 'px') : 'unset') : (itemWidth + 'px');
            return {
                cellTemplate: `<div class="bs-ellipsis">
                    <span
                        ng-bind="$ctrl.fieldParser.${item.code}(entity.${item.code})"
                        title="{{$ctrl.fieldParser.${item.code}(entity.${item.code})}}"
                    ></span>
                  </div>`,
                field: item.code,
                displayName: item.name || item.code,
                tooltip: item.tooltip,
                width
            };
        }));

        this.gridOpts.headerTpl = headerTpl;
        this.gridOpts.columnsDef = columnsDef;
    }

    /**
     * 切换全选
     */
    switchAllSelect() {
        console.warn('请实现 switchAllSelect 方法');
    }

    /**
     * 切换选择
     */
    switchSelect() {
        console.warn('请实现 switchSelect 方法');
    }

    /**
     * 计算已选中的数量
     */
    calculateSelectedCount() {
        console.warn('请实现 calculateSelectedCount 方法');
    }


    genFieldParser(field) {
        field.dynamicConfigs = field.dynamicConfigs || [];

        return value => {
            if (field.dataType === 'boolean') {
                if (!isBoolean(value)) return '';

                return field.dynamicConfigs.find(v => v.descVal === value.toString()).destVal;
            }

            if (field.dataType === 'enum' || field.dataType === 'dict') {
                if (!value) return '';
                return (field.dynamicConfigs.find(v => v.descVal === value) || {}).destVal || value;
            }

            if (field.dataType === 'date') {
                if (!value) return '';

                return value;

                // const format = {
                //     'YMD': 'yyyy-MM-dd',
                //     'YMDhms': 'yyyy-MM-dd hh:mm:ss',
                //     'YMDhm': 'yyyy-MM-dd hh:mm',
                // }[field.styleType] || 'yyyy-MM-dd hh:mm:ss';
                // const format = 'yyyy-MM-dd hh:mm:ss';
                // return dateFormat(new Date(value), format);
            }

            return value;
        }

    }
}
