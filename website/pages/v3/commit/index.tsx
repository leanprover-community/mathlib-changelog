import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

const CommitShell: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const sha = parts[3];
    if (sha) {
      router.replace(`/v3/commit/${sha}`, undefined, { shallow: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout version="v3">
      <div className="flex justify-center py-12">
        <Spinner size={10} />
      </div>
    </Layout>
  );
};

export default CommitShell;
