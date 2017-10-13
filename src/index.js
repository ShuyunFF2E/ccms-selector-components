import angular from 'angular';
import ccmsComponents from 'ccms-components';
import detailSelector from './components/detail-selector';
import conditionSelector from './components/condition-selector';
import searchInput from './components/search-input';

const version = process.env.version;

const bsComponents = angular.module('ccms.bs.components', [
	ccmsComponents,
	detailSelector,
	conditionSelector,
	searchInput
]);

bsComponents.version = version;

export default bsComponents.name;