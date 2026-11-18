import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ClientCommitPage from "../../../components/ClientCommitPage";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

// Shell page for direct URL access via _redirects SPA fallback.
// When served at /v4/commit/abc123, reads SHA from the URL and renders.
// Client-side <Link> navigation uses [sha].tsx instead.

const CommitShell: NextPage = () => {
  const router = useRouter();

  // On direct access via _redirects, extract SHA from URL and let Next.js handle it
  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const sha = parts[3];
    if (sha) {
      router.replace(`/v4/commit/${sha}`, undefined, { shallow: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout version="v4">
      <div className="flex justify-center py-12">
        <Spinner size={10} />
      </div>
    </Layout>
  );
};

export default CommitShell;
