import styles from './index.scss';
import { Inject } from 'angular-es-utils';
import { isNumber, isBoolean, isDate } from '@/utils/index';
import dateFormat from 'common-javascript-utils/src/date';
import { getMDRange, getDhmsRange, getHmsRange } from '@/components/detail-selector/utils';


const DateFormatMapping = {
    YMD: 'yyyy-MM-dd',
    YMDhms: 'yyyy-MM-dd hh:mm:ss'
};

@Inject('$element', '$ccTips')
export default class AdvanceModelConditionBox {
    styles = styles;

    isOpen = true;

    conditionData = {
        isMeet: true,
        groups: [
            [{}]
        ]
    };

    $onInit() {

        this.config.conditions.forEach(item => {
            this.addToDefaultGroup(item);
        });

        this.config.extendConditions.forEach(item => {
            if (item.selected) {
                this.addToDefaultGroup(item);
            }
        });

        // 如果初始化时由条件，则把默认的空条件删掉
        const group = this.conditionData.groups[0];
        if (group.length > 1 && Object.keys(group[0]).length === 0) {
            group.splice(0, 1);
        }
    }

    // 将简单搜索中的条件添加到高级搜索的初始化条件中
    addToDefaultGroup(condition) {
        const group = this.conditionData.groups[0];
        if (condition.dataType === 'text') {
            addTextCondition(group, condition);
        } else if (condition.dataType === 'number') {
            addNumberCondition(group, condition);
        } else if (condition.dataType === 'boolean') {
            addBooleanCondition(group, condition);
        } else if (condition.dataType === 'dict') {
            addDictCondition(group, condition);
        } else if (condition.dataType === 'enum') {
            addEnumCondition(group, condition);
        } else if (condition.dataType === 'date') {
            addDateCondition(group, condition);
        }

    }

    tipsError(message) {
        this._$ccTips.error(message, {
            container: this._$element[0].querySelector('.' + styles.container),
            duration: 3000
        });
    }


    removeGroup = (group) => {
        const index = this.conditionData.groups.indexOf(group);
        ~index && this.conditionData.groups.splice(index, 1);
        if (this.conditionData.groups.length === 0) {
            this.addGroup();
        }
    }

    addGroup = () => {
        this.conditionData.groups.push([{}]);
        // setTimeout(() => {
        //     this._$element[0].querySelector('.' + styles.groups).children[this.conditionData.groups.length - 1].scrollIntoView();
        // }, 50);
    }

    switchConditionBox() {
        const $conditionBoxDOM = this._$element[0].querySelector('.' + styles.conditionBox);
        if (this.isOpen) {
            $conditionBoxDOM.oheight = $conditionBoxDOM.getBoundingClientRect().height;

            $conditionBoxDOM.style.height = $conditionBoxDOM.oheight + 'px';
            setTimeout(() => {
                $conditionBoxDOM.style.height = 0;
                $conditionBoxDOM.style.overflow = 'hidden';
            }, 0);
        } else {
            $conditionBoxDOM.style.height = $conditionBoxDOM.oheight + 'px';
            setTimeout(() => {
                $conditionBoxDOM.style.overflow = 'unset';
                $conditionBoxDOM.style.height = 'unset';
            }, 300);
        }

        this.isOpen = !this.isOpen;
    }

    reset() {
        this.conditionData.isMeet = true;
        this.conditionData.groups.forEach(group => {
            group.forEach(item => {
                Object.keys(item).forEach(key => delete item[key]);
            });
        });
    }

    validate() {
        const groups = this.conditionData.groups;

        // 如果为默认的空条件
        if (groups.length === 1 && groups[0].length === 1 && !groups[0][0].code) {
            return { result: true, isDefault: true };
        }

        for (let i = 0, len1 = groups.length; i < len1; i++) {
            const group = groups[i];
            for (let j = 0, len2 = group.length; j < len2; j++) {
                const condition = group[j];
                const validation = validateConditionData(condition);
                if (!validation.result) {
                    return validation;
                }
            }
        }
        return { result: true };
    }

    parseConditions() {
        const conditions = [];

        this.conditionData.groups.forEach(group => {
            const sub = [];
            group.forEach(item => {
                const condition = genSearchCondition(item);
                sub.push(condition);
            });
            conditions.push(sub);
        });
        return conditions;
    }

    search() {
        const validation = this.validate();
        if (!validation.result) {
            this.tipsError('请检查条件是否填写完整');
            return;
        }

        const conditions = validation.isDefault ? [] : this.parseConditions();

        this.fetch({
            page: 1,
            isMeet: this.conditionData.isMeet,
            conditions
        }, true);
    }
}


function filterBaseAttrs(item) {
    return {
        code: item.code,
        name: item.name,
        format: item.format,
        dataType: item.dataType,
        dynamicConfigs: item.dynamicConfigs || []
    };
}


function addTextCondition(group, condition) {
    if (condition.value && condition.value.length > 0) {
        group.push({
            operator: '包含',
            value: [...condition.value],
            ...filterBaseAttrs(condition)
        });
    }
}

function addNumberCondition(group, condition) {
    if (condition.value &&
        (isNumber(condition.value.min) || isNumber(condition.value.max))
    ) {
        group.push({
            operator: '介于',
            value: { ...condition.value },
            ...filterBaseAttrs(condition)
        });
    }
}


function addBooleanCondition(group, condition) {
    if (condition.value || isBoolean(condition.value)) {
        group.push({
            operator: '等于',
            value: condition.value,
            ...filterBaseAttrs(condition)
        });
    }
}

function addDictCondition(group, condition) {
    if (condition.value && condition.value.length > 0) {
        group.push({
            operator: '等于任意值',
            value: [...condition.value],
            ...filterBaseAttrs(condition)
        });
    }
}

function addEnumCondition(group, condition) {
    if (condition.value && condition.value.length > 0) {
        group.push({
            operator: '等于任意值',
            value: [...condition.value],
            ...filterBaseAttrs(condition)
        });
    }
}

function addDateCondition(group, condition) {
    if (!condition.value) return;

    if (condition.format === 'YMDhms' || condition.format === 'YMD') {
        if (isDate(condition.value.start) || isDate(condition.value.end)) {
            group.push({
                operator: '介于',
                value: { ...condition.value },
                ...filterBaseAttrs(condition)
            });
        }
    } else if (condition.format === 'MD') {
        const { start = {}, end = {} } = condition.value;
        if ((isNumber(start.M) && isNumber(start.D)) || isNumber(end.M) && isNumber(end.D)) {
            group.push({
                operator: '介于',
                value: {
                    start: { ...start },
                    end: { ...end }
                },
                ...filterBaseAttrs(condition)
            });
        }

    } else if (condition.format === 'Dhms') {
        const { start = {}, end = {} } = condition.value;
        if ((isNumber(start.D) && isNumber(start.h) && isNumber(start.m) && isNumber(start.s)) ||
            (isNumber(end.D) && isNumber(end.h) && isNumber(end.m) && isNumber(end.s))) {
            group.push({
                operator: '介于',
                value: {
                    start: { ...start },
                    end: { ...end }
                },
                ...filterBaseAttrs(condition)
            });
        }
    } else if (condition.format === 'hms') {
        const { start = {}, end = {} } = condition.value;
        if ((isNumber(start.h) && isNumber(start.m) && isNumber(start.s)) ||
            (isNumber(end.h) && isNumber(end.m) && isNumber(end.s))) {
            group.push({
                operator: '介于',
                value: {
                    start: { ...start },
                    end: { ...end }
                },
                ...filterBaseAttrs(condition)
            });
        }
    }
}

// 生成查询条件
function genSearchCondition(item) {
    const condition = { column: item.code, operator: item.operator };
    if (item.dataType === 'text') {
        condition.type = 'INPUT';
        condition.value = item.value;
    } else if (item.dataType === 'boolean') {
        condition.type = 'Boolean';
        condition.value = item.value === 'true';
    } else if (item.dataType === 'enum') {
        condition.type = 'Enum';
        condition.value = item.value;
    } else if (item.dataType === 'dict') {
        condition.type = 'Dict';
        condition.value = item.value;
    } else if (item.dataType === 'number') {
        condition.type = 'Number';
        if (item.operator === '介于') {
            const min = isNumber(item.value.min) ? item.value.min : null;
            const max = isNumber(item.value.max) ? item.value.max : null;

            if (isNumber(min) && isNumber(max)) {
                condition.value = [Math.min(min, max), Math.max(min, max)];
            } else {
                formData.value = [min, max];
            }

        } else {
            condition.value = item.value;
        }
    } else if (item.dataType === 'date') {
        const format = item.format;
        condition.type = format;
        if (format === 'YMDhms' || format === 'YMD') {
            const start = item.value.start ? dateFormat(item.value.start, DateFormatMapping[format]) : null;
            const end = item.value.end ? dateFormat(item.value.end, DateFormatMapping[format]) : null;
            condition.value = [start, end];
        } else if (format === 'MD') {
            const range = getMDRange(item.value);
            if (range.start || range.end) {
                condition.value = [range.start, range.end];
            }
        } else if (format === 'Dhms') {
            const range = getDhmsRange(item.value);
            if (range.start || range.end) {
                condition.value = [range.start, range.end];
            }
        } else if (format === 'hms') {
            const range = getHmsRange(item.value);
            if (range.start || range.end) {
                condition.value = [range.start, range.end];
            }
        }
    }

    return condition;
}


function validateConditionData(condition) {
    const { code, dataType, format, value, name, operator } = condition;
    if (!code) {
        return { result: false, message: '请选择字段' };
    }

    if (dataType === 'text') {
        if (!value || !value.length) {
            return { result: false, message: `请填写 ${name} 的值` };
        }
    }

    if (dataType === 'boolean') {
        if (!value) {
            return { result: false, message: `请选择 ${name} 的值` };
        }
    }

    if (dataType === 'enum' || dataType === 'dict') {
        if (!value || !value.length) {
            return { result: false, message: `请选择 ${name} 的值` };
        }
    }

    if (dataType === 'number') {
        if (operator === '介于') {
            if (!isNumber(value.min) || !isNumber(value.max)) {
                return { result: false, message: `请填写 ${name} 的值` };
            }
        } else {
            if (!isNumber(value)) {
                return { result: false, message: `请填写 ${name} 的值` };
            }
        }
    }


    if (dataType === 'date') {
        if (format === 'YMDhms' || format === 'YMD') {
            if (!value.start && !value.end) {
                return { result: false, message: `请选择 ${name} 的值` };
            }
        }

        if (format === 'MD') {
            const range = getMDRange(value);
            if (!range.start && !range.end) {
                return { result: false, message: `请选择 ${name} 的值` };
            }
        }

        if (format === 'Dhms') {
            const range = getDhmsRange(value);
            if (!range.start && !range.end) {
                return { result: false, message: `请选择 ${name} 的值` };
            }
        }

        if (format === 'hms') {
            const range = getHmsRange(value);
            if (!range.start && !range.end) {
                return { result: false, message: `请选择 ${name} 的值` };
            }
        }
    }

    return { result: true };
}
