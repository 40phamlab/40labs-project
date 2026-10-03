const React = require('react');
const { Text } = require('react-native');

module.exports = {
  Ionicons: (props) => React.createElement(Text, props, props.name),
};
