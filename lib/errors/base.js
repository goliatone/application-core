class BaseError extends Error {

    constructor(message, code, status, data) {
        super(message);

        this.name = this.constructor.name;
        this.code = code;
        this.message = message;
        this.status = status;
        if (data) this.data = data;

        this._updateAttributes();
    }

    _updateAttributes() {
        const attributes = [
            'message',
            'code',
            'data',
            'status',
            'stack'
        ];

        /**
         * Remove stack in production
         */
        if (this.constructor.isProd() && attributes.includes('stack')) {
            attributes.splice(attributes.indexOf('stack'), 1);
        }

        this._attributes = attributes;
    }

    static isProd() {
        return process.env.NODE_ENV === 'production';
    }
}
