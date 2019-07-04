'use strict';
const _ansiStyle = require('ansi-color').set;
const enforceColumnWidth = require('./line-formatter').enforceColumnWidth;

/*
 * const ansiRegex = require('ansi-regex')();
 * let LN = (before + from).replace(ansiRegex, '').length;
 */
const LN = 37;

const DEFAULTS = {
    arrows: {
        smal: '▸',
        black: '▶',
        empty: '▷'
    },
    symbols: {
        highVoltage: '⚡',
        arrow: '➞',
        dot: '•',
        rarrow: '⟶'
    },
    columnWidth: 190
};

/** 
 * Message is the formatter for messages
 * being written to the console transport.
 * 
 * See [winston.transports.Console]() fore 
 * more information.
 * 
 * @class Message
 * @memberof core/logger
 */
class Message {
    constructor() {
        this._colorizer = null;
        this._message = '<Empty Logger Message>';
        this._timestamp = null;
        this._level = 'info';
        this._label = null;
        this._from = null;
        // this._template = '[{{timestamp}} {{level}}] {{message}}';
    }

    /**
     *
     * @param {Colorizer} colorizer
     * @return {Message} Return instance
     */
    setColorizer(colorizer) {
        this._colorizer = colorizer;
        return this;
    }

    /**
     * This takes a configuration 
     * object like Winston's colors object.
     * 
     * @param {Object} colors 
     */
    setColors(colors) {
        this._colors = colors;
        return this;
    }

    setColor(key, style) {
        this._colors[key] = style;
        return this;
    }

    setTextStyle(...style) {
        /*
         * We can use an array as argument:
         * ['red', 'bold', 'white_bg']
         */
        if (Array.isArray(style[0])) {
            style = style[0];
        }

        if (style.length === 1 && typeof style[0] === 'string') {
            style = style[0];
        } else {
            style = style.join('+');
        }

        // [
        //     'bold', 'underline', 'blink',
        //     'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
        //     'black_bg', 'red_bg', 'green_bg', 'yellow_bg', 'blue_bg', 'magenta_bg', 'cyan_bg', 'white_bg'
        // ]

        this._textStyle = style;

        return this;
    }

    stylize(message, style) {
        return _ansiStyle(message, style);
    }

    colorify(level, message, createColor) {
        if (createColor) {
            if (!this._colors[level]) {
                this.setColor(level, ['bold']);
            }
        }

        try {
            return this._colorizer(level, message);
        } catch (e) {
            return message;
        }
    }



    randomColor() {
        // let colors = [
        // 'bgBlack',
        // 'bgRed',
        // 'bgGreen',
        // 'bgYellow',
        // 'bgBlue',
        // 'bgMagenta',
        // 'bgCyan',
        // 'bgWhite'];

        let colors = [
            'black',
            'red',
            'green',
            'yellow',
            'blue',
            'magenta',
            'cyan',
            'white'
        ];
        let c = colors[Math.floor(Math.random() * colors.length)];
        return c;
    }

    /**
     * Set the message of this instance.
     * 
     * @param {String} message String to output
     * @memberof Message
     * @return {this}
     */
    setMessage(message) {
        if (message) {
            this._message = message;
        }
        return this;
    }

    setLoggerName(name) {
        if (name) {
            this._loggerName = name;
        }
        return this;
    }

    /**
     * @param {boolean|function} timestamp
     * @return {Message}
     */
    setTime(timestamp) {
        if (typeof timestamp === 'function') {
            this._timestamp = timestamp();
        } else if (timestamp) {
            var format = typeof timestamp === 'string' ? timestamp : 'hh:mm:ss';
            this._timestamp = this.dateFormat(format);
        }

        return this;
    }

    /**
     * @param {string|undefined} label
     * @return {Message}
     */
    setLabel(label) {
        if (label) {
            this._label = label;
        }
        return this;
    }

    /**
     * @param {string|undefined} level
     * @return {Message}
     */
    setLevel(level) {
        if (level) {
            this._level = level.toLowerCase();
        }

        return this;
    }

    /**
     * @param {string|undefined} from
     * @return {Message}
     */
    setFrom(from) {
            if (from) {
                this._from = from;
            }
            return this;
        }
        /*
         * eg: format="YYYY-MM-DD hh:mm:ss";
         */
    dateFormat(format) {
        var date = new Date();

        var o = {
            'M+': date.getMonth() + 1, //month
            'D+': date.getDate(), //day
            'h+': date.getHours(), //hour
            'm+': date.getMinutes(), //minute
            's+': date.getSeconds(), //second
            'q+': Math.floor((date.getMonth() + 3) / 3), //quarter
            'S': this.padRight(date.getMilliseconds(), 3, '0') //millisecond
        };

        if (/(Y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
            }
        }
        return format;
    }

    padRight(str = '', len = 5, char = ' ') {
        str = '' + str;
        if (str.length >= len) return str;
        return str + Array(len - str.length + 1).join(char);
    }

    padLeft(str = '', len = 5, char = ' ') {
        if (str.length >= len) return str;
        return Array(len - str.length + 1).join(char) + str;
    }

    pad(str = '', len = 10, char = '') {
        if (str.length >= len) return str;
        len = len - str.length;
        let left = Array(Math.ceil(len / 2) + 1).join(char);
        let right = Array(Math.floor(len / 2) + 1).join(char);
        return left + str + right;
    }

    toString() {
        let from = '';
        let after = '';
        let before = '';
        let message = this._message;

        if (this._label) {
            before += `[${this._label}] `;
        }

        let level = this.pad(this._level.toUpperCase(), 8, ' ');
        before += `${level}`;

        before = this.colorify(this._level, before);

        if (this._timestamp) {
            before += `[${this._timestamp}] `;
        }

        if (this._loggerName) {
            let loggername = this.padRight(this._loggerName, 12);
            loggername = this.colorify(loggername, loggername, true);
            before += `├── ${loggername}`;
        }

        before += ' : ';


        if (this._from) {
            from += `${this._from} `;
            after += '- ';
        }
        // let message = this._message;
        if (['error', 'warn'].indexOf(this._level) !== -1) {
            message = this.colorify(this._level + '-msg', message);
        }

        if (this._textStyle) {
            message = this.stylize(message, this._textStyle);
        }

        message = enforceColumnWidth(message, this.columnWidth);

        message = message.join(this.padRight('\n', LN) + ' ');

        after += `${message}`;

        return before + from + after;
    }
}

///////
module.exports = Message;