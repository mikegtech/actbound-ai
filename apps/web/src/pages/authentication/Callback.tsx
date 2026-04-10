import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "providers/AuthProvider";
import PageLoader from "components/loading/PageLoader";
import paths from "routes/paths";

const Callback = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate({ to: paths.dashboard });
      } else {
        navigate({ to: paths.login });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <PageLoader />;
};

export default Callback;
