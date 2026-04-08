import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';
import App from './App';

// Temporary: surface unhandled JS errors as an alert so we can diagnose the crash
const defaultHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (isFatal) {
    Alert.alert('Fatal Error (temp debug)', error.message + '\n\n' + error.stack?.slice(0, 500));
  }
  defaultHandler(error, isFatal);
});

registerRootComponent(App);
