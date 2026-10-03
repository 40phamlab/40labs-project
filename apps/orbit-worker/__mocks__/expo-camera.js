const React = require('react');
const { View } = require('react-native');

module.exports = {
  CameraView: (props) => React.createElement(View, props, props.children),
  useCameraPermissions: () => [{ granted: true }, async () => ({ granted: true })],
};
