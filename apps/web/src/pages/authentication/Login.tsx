import { useEffect } from "react";
import { useAuth } from "providers/AuthProvider";
import PageLoader from "components/loading/PageLoader";

const Login = () => {
  const { login } = useAuth();

  useEffect(() => {
    login();
  }, [login]);

  return <PageLoader />;
};

export default Login;
