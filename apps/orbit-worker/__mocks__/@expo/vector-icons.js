const React = require('react');
const { Text } = require('react-native');

const MockIcon = (props) => React.createElement(Text, props, props.name);
MockIcon.glyphMap = {};

module.exports = MockIcon;
module.exports.default = MockIcon;
module.exports.Ionicons = MockIcon;
module.exports.FontAwesome = MockIcon;
module.exports.MaterialIcons = MockIcon;
