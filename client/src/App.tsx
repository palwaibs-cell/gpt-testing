import { Route, Switch } from 'wouter';
import { LandingPage } from './pages/LandingPage';
import { OrderPage } from './pages/OrderPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

export function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/order/:orderId" component={OrderPage} />
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="text-2xl">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}
