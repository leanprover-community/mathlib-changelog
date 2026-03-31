import { NextPage } from "next";
import { useEffect, useState } from "react";
import ClientCommitPage from "../../../components/ClientCommitPage";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

const CommitPage: NextPage = () => {
  const [sha, setSha] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    // /v3/commit/abc123 → ['', 'v3', 'commit', 'abc123']
    if (parts.length >= 4 && parts[3]) {
      setSha(decodeURIComponent(parts[3]));
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <Layout version="v3">
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  if (!sha) {
    return (
      <Layout version="v3">
        <h1 className="text-xl">Commit not found</h1>
      </Layout>
    );
  }

  return <ClientCommitPage version="v3" sha={sha} />;
};

export default CommitPage;
