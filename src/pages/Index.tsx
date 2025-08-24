// Fixed: Removed nested Router since App.tsx already has one
// Index.tsx now just returns the SplashScreen component
import SplashScreen from './SplashScreen';

function Index() {
  return <SplashScreen />;
}

export default Index;