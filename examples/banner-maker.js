var AsciiBanner = require('ascii-banner');

// simple banner
AsciiBanner
.write('AppCore')
.font('Ogre')
.out();

// add color
AsciiBanner
.write('AppCore')
.color('red')
.font('Peaks')
.out();

// change font
AsciiBanner
.write('AppCore')
.color('red')
.font('Pebbles')
.out();

// add app version number (aligned right)
AsciiBanner
.write('AppCore')
.color('red')
.font('Short')
.after('>v{{version}}', 'yellow')
.out();

// add app name before (centered)
AsciiBanner
.write('AppCore')
.color('red')
.font('Slide')
.before('>[{{name}}<')
.after('>v{{version}}', 'yellow')
.out();
