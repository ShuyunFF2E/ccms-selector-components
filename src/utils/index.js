function isTypeOf(type) {
    return v => {
        return Object.prototype.toString.call(v) === `[object ${type}]`;
    }
}

export function isBoolean(v) {
    return isTypeOf('Boolean')(v);
}

export function isNumber(v) {
    return isTypeOf('Number')(v) && !Number.isNaN(v);
}

export function isDate(v) {
    return isTypeOf('Date')(v);
}
