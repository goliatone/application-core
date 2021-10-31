function getLineInfo(lineInfo) {
    lineInfo = lineInfo.replace(/^.*\s\(/, '').replace(/\)$/, '');
    let [file, line, position] = lineInfo.split(':');
    return { file, line: line - 1, position: +position };
}

function getFileLine(filename, line) {
    const fs = require('fs');
    let data = fs.readFileSync(filename, 'utf8');
    let lines = data.split('\n');

    if (line > lines.length) {
        throw new Error('File end reached without finding line');
    }

    return lines[line];
}

class DeprecationError extends Error {
    constructor(attribute, type) {
        super(`${type} ${attribute} is deprecated`);
        this.type = type;
        this.attribute = attribute;
        let { stack, fileInfo } = this._getStack();
        this.stack = stack;
        this.fileInfo = fileInfo;

    }

    getSource() {
        return getFileLine(this.fileInfo.file, this.fileInfo.line);
    }

    _getStack() {
        let stack = (new Error()).stack;
        stack = stack.split(' at ');
        stack = [stack[0], ...stack.slice(5)];

        let fileInfo = getLineInfo(stack[1]);
        let source = getFileLine(fileInfo.file, fileInfo.line);

        stack = stack.join('at ');
        stack = stack.replace(/^Error/, `Deprecation Notice:\n   -> ${source}`);

        return { stack, fileInfo };
    }
}

module.exports = DeprecationError;

/*
const context = {
    moduleid: 'test'
};

function markAsDeprecated(instance, attribute) {
    const old = instance[attribute];
    Object.defineProperty(instance, attribute, {
        get: function $get() {
            context.deprecationNotice(attribute, 'attribute');
            return old;
        },
    });
}

function functionUsingDeprecatedAttribute() {
    console.log('module id: %s', context.moduleid);
}


function main() {
    context.deprecationNotice = deprecationNotice;
    markAsDeprecated(context, 'moduleid');
    functionUsingDeprecatedAttribute();
}

function deprecationNotice(attribute, type) {
    let error = new DeprecationError(attribute, type);
    console.log(error.getSource());
    console.log(error.stack);
}

main();
*/