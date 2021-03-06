import styles from './index.scss';
import { Inject } from 'angular-es-utils';


function genDefaultConditionObj(conditions = []) {
    return {
        search: {
            isMeet: true,
            isAllSelected: false,
            conditions,
            includes: [],
            excludes: [],
            statistic: 0
        },
        result: {
            isAllSelected: true,
            includes: [],
            excludes: []
        }
    };
}

@Inject('$scope', '$element')
export default class DetailSelectorQueryViewCtrl {
    styles = styles;

    params = {
        page: 1,
        size: 10,
        isMeet: true,
        conditions: []
    };

    total = 0;
    data = [];


    constructor() {
        // 初始化时默认添加一个条件
        const conditionObj = genDefaultConditionObj();
        this.opts.GlobalConditionObj.conditions.push(conditionObj);
    }

    get conditionObj() {
        const { conditions } = this.opts.GlobalConditionObj;
        return conditions[conditions.length - 1];
    }

    $onInit() {
        this.fetch({ page: 1, size: 10 }, true);
        this.registerFromCheckToQuery(this.resetDataSelectedState);
    }

    fetch = (params, isNewCondition) => {
        const { GlobalConditionObj } = this.opts;
        const query = { ...this.params, ...params };

        this.isLoading = true;
        return this.config.fetch(query).then(res => {
            this.data = res.data;
            this.total = res.total;
            this.isLoading = false;
            Object.assign(this.params, params);

            if (isNewCondition) {
                const conditions = query.conditions.map(item => {
                    return item.map(sub => ({ ...sub }));
                });
                const conditionObj = genDefaultConditionObj(conditions);
                GlobalConditionObj.conditions.push(conditionObj);
            }
            this.calculateDataState(true);
            window.GlobalConditionObj = GlobalConditionObj.conditions;
        }).catch(err => {
            this.isLoading = false;
            this._$ccTips.error(err.message, {
                container: this._$element[0].querySelector('.' + styles.container),
                duration: 3000
            });
            throw err;
        });
    }

    resetDataSelectedState = () => {
        this.calculateDataState();
    }

    refresh() {
        this.fetch();
    }

    pageChange(page, size) {
        this.fetch({ page, size });
    }

    calculateDataState(isNewData = false) {
        const { conditions } = this.opts.GlobalConditionObj;
        if (!conditions.length) return;

        const lastCondition = conditions[conditions.length - 1];
        const primaryKey = this.config.primaryKey;
        calculateDataState(isNewData, this.data, lastCondition, primaryKey);
    }
}

function calculateDataState(isNewData, data, lastCondition, primaryKey) {
    const { search, result } = lastCondition;

    if (!result.isAllSelected) {
        const includes = result.includes;
        data.forEach(item => {
            item.selected = !!includes.find(key => key === item[primaryKey]);
        });
        return;
    }

    data.forEach(item => {
        if (isNewData) {
            if (search.isAllSelected) {
                item.selected = search.isAllSelected;
            } else {
                item.selected = search.includes.includes(item[primaryKey]);
            }
        }

        if (result.excludes.find(key => key === item[primaryKey])) {
            item.selected = false;
        }
    });

}
