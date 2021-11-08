function $addErrorSerializer(removeStack = true) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function() {
            let alt = {};

            Object.getOwnPropertyNames(this).forEach(function(key) {
                if (key.includes('__')) return;
                alt[key] = this[key];
            }, this);
            /**
             * Remove stack trace from production environments
             */
            if (removeStack) delete alt.stack;
            return alt;
        },
        writable: true,
        configurable: true,
    });
}

module.exports.addErrorSerializer = $addErrorSerializer;
